/**
 * ParticleEmitter.ts - 粒子发射器基类
 *
 * ========== 架构 ==========
 * 发射器采用 策略模式（Strategy Pattern）：
 * - 每种 EmissionShape 实现独立策略类
 * - 发射器持有策略引用，update() 时委托策略生成初始位置/速度
 * - 配置驱动：EmitterConfig 控制速率、寿命、大小、颜色等全部参数
 *
 * ========== 调色板系统 ==========
 * 使用 Oklch 颜色空间 + 关键帧插值，实现感知均匀的颜色过渡。
 * 每个粒子在诞生时从调色板随机采样一个颜色，决定其生命周期内的外观。
 */

import type {
  EmitterConfig,
  EmissionShape,
  PaletteKeyframe,
  OklchColor,
} from '../types';
import { ParticlePool } from '../particles/ParticlePool';
import { PARTICLE_STRIDE, createParticle } from '../particles/Particle';

// ==================== 发射形状策略接口 ====================

/** 策略接口：每种形状实现各自的初始位置和速度生成逻辑 */
interface EmissionStrategy {
  /** 生成初始位置偏移 (x,y,z) 和初始速度 (vx,vy,vz) */
  emit(): EmitResult;
}

interface EmitResult {
  x: number;  y: number;  z: number;
  vx: number; vy: number; vz: number;
}

// ==================== 策略实现 ====================

/**
 * 点发射策略
 * 所有粒子从原点出发，速度方向均匀分布在单位球面上
 */
class PointStrategy implements EmissionStrategy {
  constructor(
    private _speedMin: number,
    private _speedMax: number,
  ) {}

  emit(): EmitResult {
    const speed = this._speedMin + Math.random() * (this._speedMax - this._speedMin);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const sinPhi = Math.sin(phi);
    return {
      x: 0, y: 0, z: 0,
      vx: speed * sinPhi * Math.cos(theta),
      vy: speed * Math.cos(phi),
      vz: speed * sinPhi * Math.sin(theta),
    };
  }
}

/**
 * 球体表面发射策略
 * 粒子从半径为 radius 的球壳上随机点出发，速度沿径向向外
 */
class SphereStrategy implements EmissionStrategy {
  constructor(
    private _radius: number,
    private _speedMin: number,
    private _speedMax: number,
  ) {}

  emit(): EmitResult {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = this._speedMin + Math.random() * (this._speedMax - this._speedMin);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    return {
      x: this._radius * sinPhi * Math.cos(theta),
      y: this._radius * cosPhi,
      z: this._radius * sinPhi * Math.sin(theta),
      vx: speed * sinPhi * Math.cos(theta),
      vy: speed * cosPhi,
      vz: speed * sinPhi * Math.sin(theta),
    };
  }
}

/**
 * 锥体喷射策略
 * 粒子从原点沿圆锥方向射出，适合火焰、喷泉效果
 */
class ConeStrategy implements EmissionStrategy {
  constructor(
    private _angle: number,
    private _speedMin: number,
    private _speedMax: number,
  ) {}

  emit(): EmitResult {
    const theta = Math.random() * Math.PI * 2;
    const phi = this._angle * Math.random(); // 锥体内随机角度
    const speed = this._speedMin + Math.random() * (this._speedMax - this._speedMin);
    const sinPhi = Math.sin(phi);
    return {
      x: 0, y: 0, z: 0,
      vx: speed * sinPhi * Math.cos(theta),
      vy: speed * Math.cos(phi),
      vz: speed * sinPhi * Math.sin(theta),
    };
  }
}

/**
 * 盒体体积发射策略
 * 粒子在长方体体积内随机位置出发，速度方向单位球面均匀分布
 */
class BoxStrategy implements EmissionStrategy {
  constructor(
    private _half: [number, number, number],
    private _speedMin: number,
    private _speedMax: number,
  ) {}

  emit(): EmitResult {
    const speed = this._speedMin + Math.random() * (this._speedMax - this._speedMin);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const sinPhi = Math.sin(phi);
    return {
      x: (Math.random() * 2 - 1) * this._half[0],
      y: (Math.random() * 2 - 1) * this._half[1],
      z: (Math.random() * 2 - 1) * this._half[2],
      vx: speed * sinPhi * Math.cos(theta),
      vy: speed * cosPhi,
      vz: speed * sinPhi * Math.sin(theta),
    };
  }
}

/**
 * 圆环边缘发射策略
 * 粒子在 XZ 平面圆环上随机位置出发
 */
class CircleStrategy implements EmissionStrategy {
  constructor(
    private _radius: number,
    private _speedMin: number,
    private _speedMax: number,
  ) {}

  emit(): EmitResult {
    const angle = Math.random() * Math.PI * 2;
    const speed = this._speedMin + Math.random() * (this._speedMax - this._speedMin);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return {
      x: this._radius * cosA,
      y: 0,
      z: this._radius * sinA,
      vx: speed * cosA,
      vy: 0,
      vz: speed * sinA,
    };
  }
}

// ==================== 策略工厂 ====================

/** 根据形状类型创建对应的策略实例 */
function createEmissionStrategy(
  shape: EmissionShape,
  speedMin: number,
  speedMax: number,
  config?: EmitterConfig['shapeConfig'],
): EmissionStrategy {
  const radius = config?.radius ?? 5;
  const angle  = config?.angle  ?? Math.PI / 4;
  const half   = config?.half   ?? [3, 3, 3];

  switch (shape) {
    case 'point':  return new PointStrategy(speedMin, speedMax);
    case 'sphere': return new SphereStrategy(radius, speedMin, speedMax);
    case 'cone':   return new ConeStrategy(angle, speedMin, speedMax);
    case 'box':    return new BoxStrategy(half, speedMin, speedMax);
    case 'circle': return new CircleStrategy(radius, speedMin, speedMax);
  }
}

// ==================== 发射器主类 ====================

/**
 * ParticleEmitter - 粒子发射器
 *
 * 职责：
 * - 根据 EmitterConfig 驱动粒子生成节奏
 * - 委托 EmissionStrategy 计算初始位置/速度
 * - 从调色板为每个粒子采样颜色
 * - 支持多发射器共享同一个 ParticlePool
 */
export class ParticleEmitter {
  private _config: EmitterConfig;
  private _pool: ParticlePool;
  private _strategy: EmissionStrategy;
  private _accumulator: number = 0;
  private _burstCount: number = 1;
  private _position: [number, number, number] = [0, 0, 0];
  private _enabled: boolean = true;

  constructor(pool: ParticlePool, config: EmitterConfig) {
    this._pool = pool;
    this._config = { ...config };

    this._strategy = createEmissionStrategy(
      config.shape,
      config.speed[0],
      config.speed[1],
      config.shapeConfig,
    );

    if (config.position) {
      this._position = [...config.position];
    }
  }

  /**
   * 每帧更新：累计时间、批量发射
   * @param deltaTime - 帧时间差（秒）
   */
  update(deltaTime: number): void {
    if (!this._enabled) return;

    this._accumulator += deltaTime;
    const spawnInterval = 1 / this._config.rate;

    while (this._accumulator >= spawnInterval) {
      this._accumulator -= spawnInterval;
      this._emitBatch(this._burstCount);
    }
  }

  /** 发射一批粒子 */
  private _emitBatch(count: number): void {
    const pool = this._pool;
    const data = pool.getData();
    const cfg = this._config;
    const [px, py, pz] = this._position;

    for (let i = 0; i < count; i++) {
      const idx = pool.acquire();
      if (idx < 0) break; // 池满，停止发射

      const { x, y, z, vx, vy, vz } = this._strategy.emit();

      const lifetime =
        cfg.lifetime[0] +
        Math.random() * (cfg.lifetime[1] - cfg.lifetime[0]);

      const size =
        cfg.size[0] +
        Math.random() * (cfg.size[1] - cfg.size[0]);

      // 调色板采样默认白色
      let r = 1, g = 1, b = 1;
      if (cfg.colors.length > 0) {
        const col = samplePalette(cfg.colors, Math.random());
        // Oklch → 近似 RGB（生产环境应使用完整转换矩阵）
        r = col.l;
        g = col.l * (1 - col.c * 0.5);
        b = col.l * (1 - col.c * 0.3);
      }

      createParticle(
        data, idx,
        px + x, py + y, pz + z,
        vx, vy, vz,
        r, g, b,
        size,
        lifetime,
      );
    }
  }

  // ==================== 控制接口 ====================

  /** 启用/禁用发射 */
  set enabled(value: boolean) {
    this._enabled = value;
  }
  get enabled(): boolean {
    return this._enabled;
  }

  /** 设置发射器世界坐标 */
  setPosition(x: number, y: number, z: number): void {
    this._position[0] = x;
    this._position[1] = y;
    this._position[2] = z;
  }

  /** 重置发射累计时间 */
  resetAccumulator(): void {
    this._accumulator = 0;
  }

  /** 获取配置（只读副本） */
  get config(): EmitterConfig {
    return { ...this._config };
  }

  /** 动态更新发射速率 */
  setRate(rate: number): void {
    this._config.rate = Math.max(0, rate);
  }

  /** 每次触发批量发射数 */
  set burstCount(n: number) {
    this._burstCount = Math.max(1, n | 0);
  }
  get burstCount(): number {
    return this._burstCount;
  }
}

// ==================== 工具函数 ====================

/**
 * 调色板关键帧线性插值
 * 根据 progress [0, 1] 在 Oklch 颜色关键帧之间平滑过渡
 */
function samplePalette(
  keyframes: PaletteKeyframe[],
  progress: number,
): OklchColor {
  const n = keyframes.length;
  if (n === 0) return { l: 1, c: 0, h: 0, a: 1 };
  if (n === 1) return keyframes[0].color;

  // 边界钳制
  if (progress <= keyframes[0].time) return keyframes[0].color;
  if (progress >= keyframes[n - 1].time) return keyframes[n - 1].color;

  // 二分查找所在区间（关键帧按 time 升序排列）
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if (progress >= keyframes[mid].time) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const t0 = keyframes[lo].time;
  const t1 = keyframes[hi].time;
  const t = (progress - t0) / (t1 - t0);

  return lerpOklch(keyframes[lo].color, keyframes[hi].color, t);
}

/** Oklch 颜色线性插值 */
function lerpOklch(a: OklchColor, b: OklchColor, t: number): OklchColor {
  return {
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: a.h + (b.h - a.h) * t,
    a: a.a + (b.a - a.a) * t,
  };
}
