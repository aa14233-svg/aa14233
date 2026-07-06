/**
 * Engine.ts - 粒子系统主引擎
 *
 * ========== 职责 ==========
 * 1. 管理 requestAnimationFrame 主循环
 * 2. 计算 delta time 并做最大步长钳制（防止卡顿导致的 delta 暴增）
 * 3. 编排生命周期：init → update(resize) → render → dispose
 * 4. 收集 FPS 等运行时统计信息
 *
 * ========== 时序 ==========
 *   tick()
 *     ├─ _update(dt)
 *     │   ├─ ParticleEmitter[].update(dt)      — 发射新粒子
 *     │   ├─ ParticlePool.updateLife(dt)       — 生命周期衰减
 *     │   └─ onUpdate(dt, pool)                — 外部自定义（噪声场等）
 *     │
 *     └─ _render(dt)
 *         ├─ GPUBufferManager.sync(pool)       — CPU → GPU 同步
 *         └─ Renderer.render(dt)               — 提交绘制
 */

import type { SystemStats } from '../types';
import { ParticlePool } from '../particles/ParticlePool';
import { ParticleEmitter } from '../emitter/ParticleEmitter';
import { GPUBufferManager } from './GPUBufferManager';
import { Renderer } from '../rendering/Renderer';

export class Engine {
  private _pool: ParticlePool;
  private _emitters: ParticleEmitter[] = [];
  private _gpuBufferManager: GPUBufferManager;
  private _renderer: Renderer;

  private _rafId: number = -1;
  private _lastTime: number = 0;
  private _fps: number = 0;
  private _frameCount: number = 0;
  private _fpsAccum: number = 0;

  /** 最大允许 delta time（秒），防止调试断点/切屏导致的物理跳跃 */
  private _maxDeltaTime: number = 0.05;
  private _running: boolean = false;

  /**
   * 外部逐帧更新回调。
   * 用于噪声场力累加、自定义运动逻辑等。
   * 签名：(deltaTime, pool) => void
   */
  private _onUpdate: ((dt: number, pool: ParticlePool) => void) | null = null;

  /** 窗口 resize 处理器 */
  private _onResize: (() => void) | null = null;

  constructor(
    pool: ParticlePool,
    gpuBufferManager: GPUBufferManager,
    renderer: Renderer,
  ) {
    this._pool = pool;
    this._gpuBufferManager = gpuBufferManager;
    this._renderer = renderer;

    // 绑定 resize
    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  // ==================== 发射器管理 ====================

  /** 注册一个发射器 */
  addEmitter(emitter: ParticleEmitter): void {
    this._emitters.push(emitter);
  }

  /** 移除指定发射器 */
  removeEmitter(emitter: ParticleEmitter): void {
    const idx = this._emitters.indexOf(emitter);
    if (idx >= 0) this._emitters.splice(idx, 1);
  }

  /** 清空所有发射器 */
  clearEmitters(): void {
    this._emitters.length = 0;
  }

  // ==================== 生命周期控制 ====================

  /** 设置逐帧更新回调 */
  setUpdateCallback(cb: (dt: number, pool: ParticlePool) => void): void {
    this._onUpdate = cb;
  }

  /** 启动引擎 */
  start(): void {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._tick);
  }

  /** 停止引擎 */
  stop(): void {
    this._running = false;
    if (this._rafId >= 0) {
      cancelAnimationFrame(this._rafId);
      this._rafId = -1;
    }
  }

  /** 销毁引擎，释放所有资源 */
  dispose(): void {
    this.stop();
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
    this._emitters.length = 0;
    this._gpuBufferManager.dispose();
    this._renderer.dispose();
    this._pool.dispose();
    this._onUpdate = null;
  }

  // ==================== 主循环 ====================

  /** 使用箭头函数绑定 this，避免 rAF 回调丢失上下文 */
  private _tick = (now: number): void => {
    if (!this._running) return;

    // --- delta time 计算与钳制 ---
    let dt = (now - this._lastTime) / 1000;
    this._lastTime = now;

    if (dt > this._maxDeltaTime) dt = this._maxDeltaTime;
    if (dt < 0.001) dt = 0.001; // 防止除以零

    // --- FPS 统计 ---
    this._frameCount++;
    this._fpsAccum += dt;
    if (this._fpsAccum >= 1) {
      this._fps = Math.round(this._frameCount / this._fpsAccum);
      this._frameCount = 0;
      this._fpsAccum = 0;
    }

    // --- 更新阶段 ---
    this._update(dt);

    // --- 渲染阶段 ---
    this._render(dt);

    // 请求下一帧
    this._rafId = requestAnimationFrame(this._tick);
  };

  /** 更新逻辑编排 */
  private _update(dt: number): void {
    // 1. 发射器生成新粒子
    for (let i = 0; i < this._emitters.length; i++) {
      this._emitters[i].update(dt);
    }

    // 2. 粒子生命周期衰减（自动回收死亡粒子到 Freelist）
    this._pool.updateLife(dt);

    // 3. 欧拉积分：位置 += 速度 * dt
    this._pool.integrate(dt);

    // 4. 外部自定义回调（噪声场力、碰撞等）
    if (this._onUpdate) {
      this._onUpdate(dt, this._pool);
    }
  }

  /** 渲染逻辑编排 */
  private _render(_dt: number): void {
    // 1. CPU 粒子数据 → GPU 缓冲区同步
    this._gpuBufferManager.sync(this._pool);

    // 2. 提交渲染
    this._renderer.render();
  }

  // ==================== 窗口自适应 ====================

  private _handleResize(): void {
    this._renderer.resize();
  }

  // ==================== 状态查询 ====================

  /** 获取运行时统计快照 */
  getStats(): SystemStats {
    return {
      ...this._pool.getStats(),
      fps: this._fps,
      gpuMemory: this._gpuBufferManager.getMemoryUsage(),
    };
  }

  /** 引擎是否正在运行 */
  get running(): boolean {
    return this._running;
  }

  /** 当前实时帧率 */
  get fps(): number {
    return this._fps;
  }

  /** 获取渲染器引用（用于外部访问相机、场景等） */
  get renderer(): Renderer {
    return this._renderer;
  }
}
