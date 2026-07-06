/**
 * GPUBufferManager.ts - GPU 缓冲区管理器
 *
 * ========== 设计 ==========
 * 本模块连接 CPU 端（ParticlePool）与 GPU 端（Three.js InstancedBufferAttribute）。
 * 核心职责：
 *   1. 创建和管理三个 InstancedBufferAttribute（位置、颜色、大小）
 *   2. 每帧通过 typed array subarray copy 将存活粒子数据从 ParticlePool → GPU buffers
 *   3. 数据压缩排列：仅存活粒子写入缓冲区连续前部，避免 GPU 处理死亡粒子
 *
 * ========== 数据流 ==========
 *   ParticlePool (Float32Array, stride=11)
 *       │
 *       │ sync() — forEach alive → subarray copy
 *       ▼
 *   GPUBufferManager
 *       ├─ positionBuffer: InstancedBufferAttribute (itemSize=3)
 *       ├─ colorBuffer   : InstancedBufferAttribute (itemSize=3)
 *       └─ sizeBuffer    : InstancedBufferAttribute (itemSize=1)
 *       │
 *       │ visibleCount   — 实际可见粒子数（供 InstancedMesh.count 使用）
 *       ▼
 *   Renderer → Three.js InstancedMesh
 */

import * as THREE from 'three';
import { ParticlePool } from '../particles/ParticlePool';
import {
  PARTICLE_STRIDE,
  ParticleOffset,
  isAlive,
} from '../particles/Particle';

export class GPUBufferManager {
  /** 位置缓冲区（每实例 3 float） */
  private _positionBuffer: THREE.InstancedBufferAttribute;

  /** 颜色缓冲区（每实例 3 float） */
  private _colorBuffer: THREE.InstancedBufferAttribute;

  /** 大小缓冲区（每实例 1 float） */
  private _sizeBuffer: THREE.InstancedBufferAttribute;

  /** 当前存活粒子数（压缩后，用于 mesh.count） */
  private _visibleCount: number = 0;

  /** 缓冲区最大容量 */
  private _capacity: number;

  constructor(maxParticles: number) {
    if (maxParticles <= 0 || !Number.isInteger(maxParticles)) {
      throw new RangeError(
        `GPUBufferManager: maxParticles 必须为正整数，收到 ${maxParticles}`,
      );
    }

    this._capacity = maxParticles;

    // --- 创建逐实例属性缓冲区 ---
    // 使用 DynamicDrawUsage 提示 GPU 数据频繁更新

    this._positionBuffer = new THREE.InstancedBufferAttribute(
      new Float32Array(maxParticles * 3),
      3,
    );
    this._positionBuffer.setUsage(THREE.DynamicDrawUsage);

    this._colorBuffer = new THREE.InstancedBufferAttribute(
      new Float32Array(maxParticles * 3),
      3,
    );
    this._colorBuffer.setUsage(THREE.DynamicDrawUsage);

    this._sizeBuffer = new THREE.InstancedBufferAttribute(
      new Float32Array(maxParticles * 1),
      1,
    );
    this._sizeBuffer.setUsage(THREE.DynamicDrawUsage);
  }

  /**
   * 将 ParticlePool 中的存活粒子数据同步到 GPU 缓冲区。
   *
   * 策略：
   * - 线性扫描全池，对存活粒子通过 subarray 视图拷贝到 GPU 数组
   * - 死亡粒子跳过，存活数据压缩排列至缓冲区前部
   * - visibleCount 记录有效数据长度
   */
  sync(pool: ParticlePool): void {
    const srcData = pool.getData();
    const maxParticles = pool.capacity;
    const posArray = this._positionBuffer.array as Float32Array;
    const colArray = this._colorBuffer.array as Float32Array;
    const sizeArray = this._sizeBuffer.array as Float32Array;

    let writeIdx = 0;

    for (let i = 0; i < maxParticles; i++) {
      if (!isAlive(srcData, i)) continue;

      const srcOff = i * PARTICLE_STRIDE;
      const dstOff = writeIdx * 3; // 每个粒子 position/color 占 3 float

      // 位置拷贝：subarray 语义（直接索引赋值，等价于 memcpy）
      posArray[dstOff]     = srcData[srcOff + ParticleOffset.PositionX];
      posArray[dstOff + 1] = srcData[srcOff + ParticleOffset.PositionY];
      posArray[dstOff + 2] = srcData[srcOff + ParticleOffset.PositionZ];

      // 颜色拷贝
      colArray[dstOff]     = srcData[srcOff + ParticleOffset.ColorR];
      colArray[dstOff + 1] = srcData[srcOff + ParticleOffset.ColorG];
      colArray[dstOff + 2] = srcData[srcOff + ParticleOffset.ColorB];

      // 大小拷贝（单值）
      sizeArray[writeIdx] = srcData[srcOff + ParticleOffset.Size];

      writeIdx++;
    }

    this._visibleCount = writeIdx;

    // 标记 BufferAttribute 需要上传到 GPU
    this._positionBuffer.needsUpdate = true;
    this._colorBuffer.needsUpdate = true;
    this._sizeBuffer.needsUpdate = true;
  }

  // ==================== 访问器 ====================

  /** 位置缓冲区 */
  get positionBuffer(): THREE.InstancedBufferAttribute {
    return this._positionBuffer;
  }

  /** 颜色缓冲区 */
  get colorBuffer(): THREE.InstancedBufferAttribute {
    return this._colorBuffer;
  }

  /** 大小缓冲区 */
  get sizeBuffer(): THREE.InstancedBufferAttribute {
    return this._sizeBuffer;
  }

  /** 当前可见粒子数（用于 InstancedMesh.count） */
  get visibleCount(): number {
    return this._visibleCount;
  }

  /** 总容量 */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * 计算 GPU 缓冲区总内存占用（字节）
   * 用于 SystemStats.gpuMemory
   */
  getMemoryUsage(): number {
    const posBytes = (this._positionBuffer.array as Float32Array).byteLength;
    const colBytes = (this._colorBuffer.array as Float32Array).byteLength;
    const sizeBytes = (this._sizeBuffer.array as Float32Array).byteLength;
    return posBytes + colBytes + sizeBytes;
  }

  /** 销毁，切断引用 */
  dispose(): void {
    (this._positionBuffer.array as unknown) = null;
    (this._colorBuffer.array as unknown) = null;
    (this._sizeBuffer.array as unknown) = null;
    (this._positionBuffer as unknown) = null;
    (this._colorBuffer as unknown) = null;
    (this._sizeBuffer as unknown) = null;
    this._visibleCount = 0;
    this._capacity = 0;
  }
}
