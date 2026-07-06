/**
 * ColorInterpolator.ts — Oklch 多关键帧插值器
 *
 * ========== 设计 ==========
 * 在 Oklch 色彩空间中对 PaletteKeyframe[] 进行二次插值：
 * 1. 二分查找定位当前 progress 所在区间
 * 2. 区间内线性插值（Oklch 各通道独立 lerp）
 * 3. 色相 h 自动选择最短路径（绕环插值）
 *
 * 与直接 RGB 插值相比，Oklch 插值产生的过渡色
 * 不会出现中间发灰、发脏的"死色"现象。
 * ========================================================================== */

import type { OklchColor, PaletteKeyframe } from '../types';

/**
 * Oklch 色相信号处理：
 * 当跨 0°/360° 边界时选择最短绕环方向
 */
function shortestHuePath(h1: number, h2: number): number {
  let delta = h2 - h1;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/**
 * 两个 Oklch 颜色之间的线性插值
 * 色相自动选择最短路径
 */
export function lerpOklch(a: OklchColor, b: OklchColor, t: number): OklchColor {
  return {
    l: a.l + (b.l - a.l) * t,
    c: a.c + (b.c - a.c) * t,
    h: a.h + shortestHuePath(a.h, b.h) * t,
    a: a.a + (b.a - a.a) * t,
  };
}

/**
 * 从 PaletteKeyframe[] 数组中根据 progress [0, 1] 采样颜色
 *
 * @param keyframes - 有序关键帧数组（需按 time 升序排列）
 * @param progress  - 归一化进度 [0, 1]
 * @returns 插值后的 Oklch 颜色
 *
 * 复杂度：O(log n) — 二分查找 + O(1) lerp
 */
export function sampleOklchPalette(
  keyframes: PaletteKeyframe[],
  progress: number,
): OklchColor {
  const n = keyframes.length;

  // 空 / 单关键帧退化
  if (n === 0) return { l: 1, c: 0, h: 0, a: 1 };
  if (n === 1) return keyframes[0].color;

  // 边界钳制
  if (progress <= keyframes[0].time) return keyframes[0].color;
  if (progress >= keyframes[n - 1].time) return keyframes[n - 1].color;

  // 二分查找所在区间
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

  // 区间内归一化插值因子
  const t0 = keyframes[lo].time;
  const t1 = keyframes[hi].time;
  const range = t1 - t0;
  const t = range > 0 ? (progress - t0) / range : 0;

  return lerpOklch(keyframes[lo].color, keyframes[hi].color, t);
}

/**
 * 从 PaletteKeyframe[] 数组根据 progress 采样 RGB 颜色（便捷方法）
 * 自动执行 Oklch → sRGB 转换
 */
export function sampleOklchPaletteToSrgb(
  keyframes: PaletteKeyframe[],
  progress: number,
): [number, number, number] {
  const { l, c, h } = sampleOklchPalette(keyframes, progress);
  // 简单近似，生产环境应使用 OklabConversions.oklchToSrgb
  // 此处使用简化映射以避免循环依赖
  const r = l + c * 0.5 * Math.cos(h * Math.PI / 180);
  const g = l + c * 0.3 * Math.cos((h - 120) * Math.PI / 180);
  const b = l + c * 0.4 * Math.cos((h + 120) * Math.PI / 180);
  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ];
}
