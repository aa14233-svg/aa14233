/**
 * ParticlePool.ts - 无GC粒子对象池
 *
 * ========== 核心设计 ==========
 * 1. 固定大小的 Float32Array 作为所有粒子数据的唯一后备存储。
 * 2. 索引式 Freelist（栈结构）管理死亡粒子的回收，O(1) acquire/release。
 * 3. 所有操作绕开 { } 对象分配和 Map/Set 容器，
 *    每帧零 GC 压力（无新生代对象产生）。
 *
 * ========== 内存布局 ==========
 * _data: Float32Array(maxParticles × PARTICLE_STRIDE)
 *   ┌─────────────────────┬─────────────────────┬────
 *   │ 粒子0 (STRIDE floats) │ 粒子1 (STRIDE floats) │ ...
 *   └─────────────────────┴─────────────────────┴────
 *
 * _freelist: Int32Array(maxParticles) — 栈式空闲索引表
 *   _freelistTop 指向栈顶，-1 表示空栈
 *
 * ========== 生命周期管理 ==========
 * acquire()   — 从栈顶弹出一个空闲索引，标记存活
 * release()   — 将索引压回栈顶，标记死亡
 * updateLife() — 逐帧遍历，life -= dt，自然死亡的自动回收入栈
 */

import type { SystemStats } from '../types';
import {
  PARTICLE_STRIDE,
  ParticleOffset,
  resetParticle,
  isAlive,
} from './Particle';

export class ParticlePool {
  /** 粒子数据连续存储区：Float32Array */
  private _data: Float32Array;

  /** Freelist 栈：存储死亡（可复用）粒子的索引 */
  private _freelist: Int32Array;

  /** Freelist 栈顶指针，-1 表示空栈 */
  private _freelistTop: number;

  /** 当前存活粒子计数 */
  private _aliveCount: number;

  /** 池总容量 */
  private _capacity: number;

  /** 粒子数据步幅（浮点数个数/粒子） */
  readonly stride: number = PARTICLE_STRIDE;

  constructor(maxParticles: number) {
    if (maxParticles <= 0 || !Number.isInteger(maxParticles)) {
      throw new RangeError(
        `ParticlePool: maxParticles 必须为正整数，收到 ${maxParticles}`,
      );
    }

    this._capacity = maxParticles;
    this._data = new Float32Array(maxParticles * PARTICLE_STRIDE);
    this._freelist = new Int32Array(maxParticles);
    this._freelistTop = -1;
    this._aliveCount = 0;

    // 初始化 Freelist：将所有索引顺序压栈
    // 使用倒序赋值比 push 更快
    const fl = this._freelist;
    for (let i = 0; i < maxParticles; i++) {
      fl[i] = i;
    }
    this._freelistTop = maxParticles - 1;

    // 预清空所有粒子数据
    for (let i = 0; i < maxParticles; i++) {
      resetParticle(this._data, i, PARTICLE_STRIDE);
    }
  }

  /**
   * 从池中获取一个死亡粒子的索引。
   * 栈顶弹出 O(1)，不分配任何对象。
   *
   * @returns 可用索引，池满则返回 -1
   */
  acquire(): number {
    if (this._freelistTop < 0) return -1;
    const index = this._freelist[this._freelistTop--];
    this._aliveCount++;
    return index;
  }

  /**
   * 将粒子释放回池中。
   * 仅将索引压入 Freelist 栈顶，不擦除数据（延迟覆盖）。
   * 将 life 置 0 标记死亡，避免被下一帧误判为存活。
   */
  release(index: number): void {
    if (index < 0 || index >= this._capacity) return;
    // 标记死亡
    this._data[index * PARTICLE_STRIDE + ParticleOffset.Life] = 0;
    this._freelist[++this._freelistTop] = index;
    this._aliveCount--;
  }

  /**
   * 更新所有存活粒子的剩余寿命。
   * 遍历全部槽位（不依赖 Freelist），对 life > 0 的粒子执行 dt 扣减。
   * 自然死亡的粒子自动压入 Freelist。
   *
   * @param deltaTime - 帧时间差（秒）
   * @returns 本帧死亡粒子数（用于外部统计）
   */
  updateLife(deltaTime: number): number {
    let died = 0;
    const data = this._data;
    const stride = PARTICLE_STRIDE;
    const fl = this._freelist;

    for (let i = 0; i < this._capacity; i++) {
      const lifeOffset = i * stride + ParticleOffset.Life;
      const life = data[lifeOffset];
      if (life > 0) {
        const newLife = life - deltaTime;
        if (newLife <= 0) {
          // 自然死亡：life 置 0，索引入栈
          data[lifeOffset] = 0;
          fl[++this._freelistTop] = i;
          this._aliveCount--;
          died++;
        } else {
          data[lifeOffset] = newLife;
        }
      }
    }
    return died;
  }

  /**
   * 遍历全部存活粒子，应用外部力向量到速度。
   * 用于噪声场、重力、风力等逐帧外力累加。
   *
   * @param applyFn - 对每个存活粒子的回调，接收 (index, data, strideOffset)
   */
  forEachAlive(
    applyFn: (index: number, data: Float32Array, offset: number) => void,
  ): void {
    const data = this._data;
    const stride = PARTICLE_STRIDE;
    for (let i = 0; i < this._capacity; i++) {
      if (!isAlive(data, i, stride)) continue;
      applyFn(i, data, i * stride);
    }
  }

  /**
   * 应用速度到位置（欧拉积分）
   * v += a * dt, p += v * dt
   * 此方法遍历全部存活粒子，适合简单运动学
   */
  integrate(deltaTime: number): void {
    const data = this._data;
    const stride = PARTICLE_STRIDE;

    for (let i = 0; i < this._capacity; i++) {
      const off = i * stride;
      if (data[off + ParticleOffset.Life] <= 0) continue;

      // p += v * dt
      data[off + ParticleOffset.PositionX] +=
        data[off + ParticleOffset.VelocityX] * deltaTime;
      data[off + ParticleOffset.PositionY] +=
        data[off + ParticleOffset.VelocityY] * deltaTime;
      data[off + ParticleOffset.PositionZ] +=
        data[off + ParticleOffset.VelocityZ] * deltaTime;
    }
  }

  // ==================== 访问器 ====================

  /** 获取粒子数据原始 Float32Array 引用 */
  getData(): Float32Array {
    return this._data;
  }

  /** 总容量 */
  get capacity(): number {
    return this._capacity;
  }

  /** 当前存活粒子数 */
  get aliveCount(): number {
    return this._aliveCount;
  }

  /** Freelist 栈顶指针（调试用） */
  get freelistTop(): number {
    return this._freelistTop;
  }

  /** 获取统计快照 */
  getStats(): Pick<SystemStats, 'alive' | 'total'> {
    return {
      alive: this._aliveCount,
      total: this._capacity,
    };
  }

  /** 销毁池，切断引用以利 GC */
  dispose(): void {
    (this._data as unknown) = null;
    (this._freelist as unknown) = null;
    this._aliveCount = 0;
    this._freelistTop = -1;
    this._capacity = 0;
  }
}
