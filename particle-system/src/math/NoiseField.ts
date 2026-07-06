/**
 * NoiseField.ts - 3D 单纯形噪声流场
 *
 * ========== 用途 ==========
 * 为粒子系统提供有机、涌现式的运动驱动力。
 * 通过对 (x, y, z, t) 四维采样，生成平滑变化的三维力向量，
 * 实现流体般的粒子轨迹。
 *
 * ========== 算法 ==========
 * 实现经典 3D Simplex Noise（Ken Perlin, 2002），
 * 使用排列表 + 梯度向量表，12 个梯度方向。
 * 时间维通过 noise3D(x + t, y + t, z + t) 近似，
 * 并对每个轴使用不同偏移以避免力方向对齐。
 *
 * ========== 免依赖 ==========
 * 本模块不依赖任何外部噪声库，纯数学实现。
 */

import type { NoiseConfig } from '../types';

/** 排列表尺寸 */
const PERM_SIZE = 256;

/** Skew / Unskew 因子（3D Simplex） */
const F3 = 1 / 3;
const G3 = 1 / 6;

/** 12 个梯度向量 */
const GRAD3: readonly [number, number, number][] = [
  [ 1, 1, 0], [-1, 1, 0], [ 1,-1, 0], [-1,-1, 0],
  [ 1, 0, 1], [-1, 0, 1], [ 1, 0,-1], [-1, 0,-1],
  [ 0, 1, 1], [ 0,-1, 1], [ 0, 1,-1], [ 0,-1,-1],
];

/**
 * NoiseField - 3D 单纯形噪声流场
 *
 * 使用示例：
 * ```ts
 * const field = new NoiseField({ scale: 0.02, strength: 0.5, timeSpeed: 0.1 });
 * // 在每帧更新回调中：
 * const [fx, fy, fz] = field.sample(px, py, pz, elapsed);
 * pool.forEachAlive((i, data, off) => {
 *   data[off + 3] += fx;  // velocity.x += fx
 *   data[off + 4] += fy;
 *   data[off + 5] += fz;
 * });
 * ```
 */
export class NoiseField {
  /** 排列表（512 = 256 × 2，避免取模） */
  private _perm: Uint8Array;

  /** 噪声缩放（频率倒数，值越小变化越平滑） */
  private _scale: number;

  /** 力强度倍率 */
  private _strength: number;

  /** 时间演化速度 */
  private _timeSpeed: number;

  constructor(config?: Partial<NoiseConfig>) {
    this._scale     = config?.scale     ?? 0.02;
    this._strength  = config?.strength  ?? 1.0;
    this._timeSpeed = config?.timeSpeed ?? 0.1;

    // 初始化排列表
    this._perm = new Uint8Array(512);
    const seed = config?.seed ?? 42;
    this._initPerm(seed);
  }

  /**
   * Fisher-Yates 洗牌初始化排列表
   */
  private _initPerm(seed: number): void {
    const p = new Uint8Array(PERM_SIZE);
    for (let i = 0; i < PERM_SIZE; i++) p[i] = i;

    // 简单种子线性同余生成器
    let s = seed;
    for (let i = PERM_SIZE - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }

    // 双倍填充
    for (let i = 0; i < 512; i++) {
      this._perm[i] = p[i & 255];
    }
  }

  /**
   * 3D 单纯形噪声核心算法
   * @returns [-1, 1] 范围内的噪声值
   */
  noise3D(x: number, y: number, z: number): number {
    const perm = this._perm;

    // Skew：将 (x,y,z) 映射到单纯形坐标空间
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    const t = (i + j + k) * G3;
    const x0 = x - (i - t);
    const y0 = y - (j - t);
    const z0 = z - (k - t);

    // 确定单纯形 (i,j,k) 的哪个子三角形
    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0;
        i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0;
        i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1;
        i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1;
        i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 1; j2 = 1; k2 = 0;
      }
    }

    // 四个顶点的距离向量
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    // 顶点索引 → 哈希 → 梯度索引
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    // 顶点 0
    {
      const t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 > 0) {
        const gi = perm[ii + perm[jj + perm[kk]]] % 12;
        n0 = t0 * t0 * t0 * t0 * (GRAD3[gi][0] * x0 + GRAD3[gi][1] * y0 + GRAD3[gi][2] * z0);
      }
    }

    // 顶点 1
    {
      const t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 > 0) {
        const gi = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
        n1 = t1 * t1 * t1 * t1 * (GRAD3[gi][0] * x1 + GRAD3[gi][1] * y1 + GRAD3[gi][2] * z1);
      }
    }

    // 顶点 2
    {
      const t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 > 0) {
        const gi = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
        n2 = t2 * t2 * t2 * t2 * (GRAD3[gi][0] * x2 + GRAD3[gi][1] * y2 + GRAD3[gi][2] * z2);
      }
    }

    // 顶点 3
    {
      const t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 > 0) {
        const gi = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
        n3 = t3 * t3 * t3 * t3 * (GRAD3[gi][0] * x3 + GRAD3[gi][1] * y3 + GRAD3[gi][2] * z3);
      }
    }

    // 归一化到 [-1, 1]
    return 32 * (n0 + n1 + n2 + n3);
  }

  /**
   * 采样流场力向量。
   * 对三个轴分别以不同偏移采样噪声，避免力方向趋同。
   *
   * @param x - 世界坐标 X
   * @param y - 世界坐标 Y
   * @param z - 世界坐标 Z
   * @param t - 累计时间（秒）
   * @returns [fx, fy, fz] 力向量
   */
  sample(
    x: number,
    y: number,
    z: number,
    t: number,
  ): [number, number, number] {
    const s = this._scale;
    const str = this._strength;
    const ts = t * this._timeSpeed;

    // 对每个轴使用不同空间偏移破坏对称性
    const fx = this.noise3D(
      x * s + ts,
      y * s + ts * 0.7,
      z * s + ts * 1.3,
    );
    const fy = this.noise3D(
      x * s + ts * 0.5 + 100,
      y * s + ts * 0.9 + 100,
      z * s + ts * 0.3 + 100,
    );
    const fz = this.noise3D(
      x * s + ts * 1.1 + 200,
      y * s + ts * 0.4 + 200,
      z * s + ts * 0.8 + 200,
    );

    return [fx * str, fy * str, fz * str];
  }

  /** 更新配置参数 */
  setConfig(config: Partial<NoiseConfig>): void {
    if (config.scale !== undefined)     this._scale     = config.scale;
    if (config.strength !== undefined)  this._strength  = config.strength;
    if (config.timeSpeed !== undefined) this._timeSpeed = config.timeSpeed;
  }

  /** 获取当前配置快照 */
  getConfig(): NoiseConfig {
    return {
      scale: this._scale,
      strength: this._strength,
      timeSpeed: this._timeSpeed,
    };
  }
}
