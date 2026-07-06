/* ==========================================================================
 * types/index.ts — 全局类型定义
 *
 * 所有粒子系统核心数据结构的 TypeScript 接口集中定义于此，
 * 确保 emitter / color / rendering 各模块类型严格隔离。
 * ========================================================================== */

import type { vec3 } from 'gl-matrix';

/* ── 粒子数据结构 ──────────────────────────────────────────────────────── */

/** 粒子CPU数据结构（标记接口，实际数据存储在 Float32Array 中） */
export interface ParticleData {
  /** 粒子在池中的索引 */
  index: number;
  /** 是否存活 */
  alive: boolean;
}

/** GPU粒子数据结构（标记接口） */
export interface GPUParticle {
  /** 粒子在GPU缓冲区中的索引 */
  index: number;
}

/**
 * GPU 友好的紧凑粒子 — 直接映射到 InstancedBufferAttribute
 * 每个粒子占用 11 个 float32：pos(3) + vel(3) + color(3) + size(1) + life(1)
 */
export interface ParticleLayout {
  position: [number, number, number];
  velocity: [number, number, number];
  color: [number, number, number];
  size: number;
  life: number;
}

/* ── 色彩类型 ──────────────────────────────────────────────────────────── */

/**
 * Oklch 颜色空间
 * 比 sRGB 更感知均匀的色彩空间，适合平滑插值
 */
export interface OklchColor {
  /** 亮度 Lightness [0, 1] */
  l: number;
  /** 彩度 Chroma [0, ~0.4] */
  c: number;
  /** 色相 Hue [0, 360] */
  h: number;
  /** 透明度 Alpha [0, 1] */
  a: number;
}

/** Oklab 色彩分量 */
export interface OklabColor {
  /** 亮度 Lightness [0, 1] */
  L: number;
  /** 绿–红轴 */
  a: number;
  /** 蓝–黄轴 */
  b: number;
}

/** 调色板关键帧：在生命进度某时刻切换颜色 */
export interface PaletteKeyframe {
  /** 生命进度 [0, 1]，0=粒子诞生，1=粒子死亡 */
  time: number;
  /** 该时刻的颜色值（Oklch） */
  color: OklchColor;
}

/* ── 发射器类型 ────────────────────────────────────────────────────────── */

/** 发射形状枚举字面量 */
export type EmissionShape =
  | 'point'   // 点发射（原点）
  | 'sphere'  // 球体表面发射
  | 'cone'    // 锥体方向喷射
  | 'box'     // 盒体体积内随机
  | 'circle'; // 平面圆环边缘

/** 发射器完整配置 */
export interface EmitterConfig {
  /** 最大粒子数 */
  maxParticles: number;
  /** 每秒发射率（个/秒） */
  rate: number;
  /** 粒子寿命范围 [min, max]（秒） */
  lifetime: [number, number];
  /** 粒子速度范围 [min, max]（单位/秒） */
  speed: [number, number];
  /** 粒子大小范围 [min, max] */
  size: [number, number];
  /** 颜色调色板关键帧序列 */
  colors: PaletteKeyframe[];
  /** 发射形状 */
  shape: EmissionShape;
  /** 形状相关参数（可选） */
  shapeConfig?: Partial<{
    radius: number;
    angle: number;
    half: [number, number, number];
  }>;
  /** 发射器位置 */
  position?: [number, number, number];
}

/* ── 渲染类型 ──────────────────────────────────────────────────────────── */

/** 渲染配置 */
export interface RenderConfig {
  /** 粒子几何体（如 PlaneGeometry、SphereGeometry） */
  geometry?: import('three').BufferGeometry;
  /** 粒子材质（如 ShaderMaterial） */
  material?: import('three').Material;
  /** 最大粒子数 */
  count: number;
  /** 是否启用逐实例颜色 */
  useInstanceColor?: boolean;
  /** 是否启用逐实例大小 */
  useInstanceSize?: boolean;
  /** 初始相机位置 */
  cameraPosition?: [number, number, number];
}

/* ── 系统状态 ──────────────────────────────────────────────────────────── */

/** 系统运行时统计快照 */
export interface SystemStats {
  /** 当前存活粒子数 */
  alive: number;
  /** 总容量 */
  total: number;
  /** 当前帧率 */
  fps: number;
  /** GPU缓冲区内存占用（字节） */
  gpuMemory: number;
}

/* ── 噪声场类型 ────────────────────────────────────────────────────────── */

/** 噪声场配置 */
export interface NoiseConfig {
  /** 噪声缩放（频率） */
  scale: number;
  /** 力的强度倍率 */
  strength: number;
  /** 时间演化速度 */
  timeSpeed: number;
  /** 种子值 */
  seed?: number;
}

/* ── 遗留结构（向后兼容） ──────────────────────────────────────────────── */

/** @deprecated 请使用 ParticleLayout 中的字段偏移 */
export interface _DeprecatedParticleData {
  position: vec3;
  velocity: vec3;
  acceleration: vec3;
  age: number;
  maxLifetime: number;
  size: number;
  rotation: number;
  id: number;
  alive: boolean;
}
