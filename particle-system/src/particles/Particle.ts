/**
 * Particle.ts - 粒子数据结构和工厂函数
 *
 * ========== 设计哲学 ==========
 * 本模块采用 Data-Oriented Design（面向数据设计），
 * 粒子不是对象，而是 Float32Array 中连续排列的字段序列。
 * 所有操作通过偏移量直接读写类型化数组，零对象分配。
 *
 * 每个粒子占用 PARTICLE_STRIDE 个 float32（44 字节）：
 *   [0]  position.x    — 位置X
 *   [1]  position.y    — 位置Y
 *   [2]  position.z    — 位置Z
 *   [3]  velocity.x    — 速度X
 *   [4]  velocity.y    — 速度Y
 *   [5]  velocity.z    — 速度Z
 *   [6]  color.r       — 颜色R
 *   [7]  color.g       — 颜色G
 *   [8]  color.b       — 颜色B
 *   [9]  size          — 粒子大小
 *   [10] life          — 剩余寿命（秒），≤0 表示死亡
 */

import type { ParticleData } from '../types';

/** 每个粒子占用的 float32 数量 */
export const PARTICLE_STRIDE = 11;

/** 粒子字段在 stride 内的偏移量（使用 const enum 编译期内联） */
export const enum ParticleOffset {
  PositionX = 0,
  PositionY = 1,
  PositionZ = 2,
  VelocityX = 3,
  VelocityY = 4,
  VelocityZ = 5,
  ColorR = 6,
  ColorG = 7,
  ColorB = 8,
  Size = 9,
  Life = 10, // >0 存活, ≤0 死亡
}

/**
 * 在预分配数组的 index 位置重置粒子为出厂默认值（死亡状态）
 * 所有字段归零，life=0 表示死亡，颜色默认白色。
 * 此函数不分配任何内存，仅修改数组元素。
 *
 * @param data   - 粒子数据 Float32Array
 * @param index  - 粒子索引
 * @param stride - 步幅（默认 PARTICLE_STRIDE）
 */
export function resetParticle(
  data: Float32Array,
  index: number,
  stride: number = PARTICLE_STRIDE,
): void {
  const offset = index * stride;
  data[offset + ParticleOffset.PositionX] = 0;
  data[offset + ParticleOffset.PositionY] = 0;
  data[offset + ParticleOffset.PositionZ] = 0;
  data[offset + ParticleOffset.VelocityX] = 0;
  data[offset + ParticleOffset.VelocityY] = 0;
  data[offset + ParticleOffset.VelocityZ] = 0;
  data[offset + ParticleOffset.ColorR] = 1;
  data[offset + ParticleOffset.ColorG] = 1;
  data[offset + ParticleOffset.ColorB] = 1;
  data[offset + ParticleOffset.Size] = 1;
  data[offset + ParticleOffset.Life] = 0; // 0 表示死亡
}

/**
 * 在 data 数组 index 位置创建（激活）一个粒子。
 * 直接写入所有字段，不通过中间对象。
 *
 * @returns 传入的 life 值
 */
export function createParticle(
  data: Float32Array,
  index: number,
  x: number, y: number, z: number,
  vx: number, vy: number, vz: number,
  r: number, g: number, b: number,
  size: number,
  life: number,
  stride: number = PARTICLE_STRIDE,
): number {
  const offset = index * stride;
  data[offset + ParticleOffset.PositionX] = x;
  data[offset + ParticleOffset.PositionY] = y;
  data[offset + ParticleOffset.PositionZ] = z;
  data[offset + ParticleOffset.VelocityX] = vx;
  data[offset + ParticleOffset.VelocityY] = vy;
  data[offset + ParticleOffset.VelocityZ] = vz;
  data[offset + ParticleOffset.ColorR] = r;
  data[offset + ParticleOffset.ColorG] = g;
  data[offset + ParticleOffset.ColorB] = b;
  data[offset + ParticleOffset.Size] = size;
  data[offset + ParticleOffset.Life] = life;
  return life;
}

/**
 * 检查 index 位置的粒子是否存活
 * 通过 life > 0 判断，恒为 O(1) 操作
 */
export function isAlive(
  data: Float32Array,
  index: number,
  stride: number = PARTICLE_STRIDE,
): boolean {
  return data[index * stride + ParticleOffset.Life] > 0;
}

/**
 * 获取 index 位置粒子的生命进度 [0, 1]
 * 0 = 刚诞生, 1 = 即将死亡
 */
export function getLifeProgress(
  data: Float32Array,
  index: number,
  maxLifetime: number,
  stride: number = PARTICLE_STRIDE,
): number {
  const life = data[index * stride + ParticleOffset.Life];
  if (life <= 0) return 1;
  if (maxLifetime <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - life / maxLifetime));
}

/**
 * 批量读取存活粒子的位置到输出数组
 * 用于加速 GPU 同步时的数据收集
 *
 * @param data       - 粒子数据源
 * @param out        - 输出 Float32Array（需有足够容量）
 * @param maxCount   - 最多读取的粒子数
 * @param stride     - 步幅
 * @returns 实际写入的粒子数
 */
export function collectAlivePositions(
  data: Float32Array,
  out: Float32Array,
  maxCount: number,
  stride: number = PARTICLE_STRIDE,
): number {
  let written = 0;
  for (let i = 0; i < maxCount; i++) {
    if (!isAlive(data, i, stride)) continue;
    const srcOff = i * stride;
    const dstOff = written * 3;
    out[dstOff]     = data[srcOff + ParticleOffset.PositionX];
    out[dstOff + 1] = data[srcOff + ParticleOffset.PositionY];
    out[dstOff + 2] = data[srcOff + ParticleOffset.PositionZ];
    written++;
  }
  return written;
}
