/**
 * ColorPalette.ts — Oklch 调色板生成器
 *
 * 提供一系列预设的 Oklch 色调色板，可用于粒子生命周期颜色映射。
 * 每个调色板由 PaletteKeyframe[] 定义，支持 2–N 个关键帧。
 *
 * ========== 预设法 ==========
 * - 极光 (Aurora)     — 绿→青→紫
 * - 熔岩 (Lava)       — 红→橙→黄
 * - 星河 (Galaxy)     — 蓝→紫→粉
 * - 霓虹 (Neon)       — 高彩度 粉→青→绿
 * - 单色蓝 (MonBlue)  — 深蓝→浅蓝→白
 * - 日落 (Sunset)     — 橙→红→紫
 * - 海洋 (Ocean)      — 青→蓝→深蓝
 * - 暖阳 (WarmGlow)   — 黄→橙→红棕
 * ========================================================================== */

import type { PaletteKeyframe } from '../types';

/** 预设调色板注册表 */
export const PALETTES: Record<string, PaletteKeyframe[]> = {
  /* ── 极光 — 冷色循环 ───────────────────────────────────────────────── */
  aurora: [
    { time: 0.0,  color: { l: 0.80, c: 0.15, h: 140, a: 1.0 } },  // 青绿
    { time: 0.35, color: { l: 0.75, c: 0.12, h: 190, a: 1.0 } },  // 青蓝
    { time: 0.65, color: { l: 0.70, c: 0.14, h: 260, a: 0.9 } },  // 紫蓝
    { time: 1.0,  color: { l: 0.30, c: 0.04, h: 300, a: 0.0 } },  // 淡紫→透明
  ],

  /* ── 熔岩 — 暖色喷射 ───────────────────────────────────────────────── */
  lava: [
    { time: 0.0,  color: { l: 0.90, c: 0.20, h: 30,  a: 1.0 } },  // 亮黄
    { time: 0.3,  color: { l: 0.75, c: 0.22, h: 15,  a: 1.0 } },  // 橙
    { time: 0.6,  color: { l: 0.55, c: 0.18, h: 0,   a: 0.9 } },  // 红
    { time: 1.0,  color: { l: 0.20, c: 0.05, h: 350, a: 0.0 } },  // 暗红→透明
  ],

  /* ── 星河 — 冷紫粉 ────────────────────────────────────────────────── */
  galaxy: [
    { time: 0.0,  color: { l: 0.85, c: 0.10, h: 220, a: 1.0 } },  // 亮蓝
    { time: 0.4,  color: { l: 0.75, c: 0.14, h: 280, a: 1.0 } },  // 紫
    { time: 0.7,  color: { l: 0.65, c: 0.16, h: 320, a: 0.8 } },  // 粉紫
    { time: 1.0,  color: { l: 0.25, c: 0.03, h: 340, a: 0.0 } },  // 暗粉→透明
  ],

  /* ── 霓虹 — 高彩度荧光 ─────────────────────────────────────────────── */
  neon: [
    { time: 0.0,  color: { l: 0.85, c: 0.28, h: 330, a: 1.0 } },  // 亮粉
    { time: 0.33, color: { l: 0.80, c: 0.25, h: 180, a: 1.0 } },  // 青
    { time: 0.66, color: { l: 0.75, c: 0.22, h: 120, a: 1.0 } },  // 绿
    { time: 1.0,  color: { l: 0.30, c: 0.08, h: 60,  a: 0.0 } },  // 黄绿→透明
  ],

  /* ── 单色蓝 — 蓝调渐变 ─────────────────────────────────────────────── */
  monBlue: [
    { time: 0.0,  color: { l: 0.95, c: 0.04, h: 240, a: 1.0 } },  // 极浅蓝
    { time: 0.5,  color: { l: 0.65, c: 0.12, h: 250, a: 1.0 } },  // 中蓝
    { time: 1.0,  color: { l: 0.25, c: 0.06, h: 260, a: 0.0 } },  // 深蓝→透明
  ],

  /* ── 日落 — 暖色凋零 ─────────────────────────────────────────────── */
  sunset: [
    { time: 0.0,  color: { l: 0.90, c: 0.18, h: 40,  a: 1.0 } },  // 金黄
    { time: 0.35, color: { l: 0.75, c: 0.20, h: 20,  a: 1.0 } },  // 橙
    { time: 0.65, color: { l: 0.55, c: 0.16, h: 350, a: 0.8 } },  // 红
    { time: 1.0,  color: { l: 0.20, c: 0.04, h: 320, a: 0.0 } },  // 暗紫→透明
  ],

  /* ── 海洋 — 深冷渐变 ──────────────────────────────────────────────── */
  ocean: [
    { time: 0.0,  color: { l: 0.85, c: 0.10, h: 175, a: 1.0 } },  // 淡青
    { time: 0.5,  color: { l: 0.60, c: 0.14, h: 210, a: 0.9 } },  // 海蓝
    { time: 1.0,  color: { l: 0.20, c: 0.06, h: 240, a: 0.0 } },  // 深蓝→透明
  ],

  /* ── 暖阳 — 暖色温和渐变 ──────────────────────────────────────────── */
  warmGlow: [
    { time: 0.0,  color: { l: 0.90, c: 0.12, h: 55,  a: 1.0 } },  // 淡黄
    { time: 0.5,  color: { l: 0.75, c: 0.15, h: 35,  a: 1.0 } },  // 橙黄
    { time: 1.0,  color: { l: 0.35, c: 0.08, h: 10,  a: 0.0 } },  // 红棕→透明
  ],
};

/** 获取所有预设调色板名称 */
export function getPaletteNames(): string[] {
  return Object.keys(PALETTES);
}

/** 按名称获取调色板副本 */
export function getPalette(name: string): PaletteKeyframe[] | undefined {
  const p = PALETTES[name];
  return p ? p.map(kf => ({
    time: kf.time,
    color: { ...kf.color },
  })) : undefined;
}

/** 自定义调色板工厂 */
export function createPalette(keyframes: PaletteKeyframe[]): PaletteKeyframe[] {
  // 校验：time 必须严格升序
  for (let i = 1; i < keyframes.length; i++) {
    if (keyframes[i].time <= keyframes[i - 1].time) {
      throw new Error(
        `createPalette: keyframes[${i}].time (${keyframes[i].time}) ` +
        `must be > keyframes[${i-1}].time (${keyframes[i-1].time})`,
      );
    }
  }
  return keyframes.map(kf => ({
    time: kf.time,
    color: { ...kf.color },
  }));
}

/** 返回随机调色板名称 */
export function randomPaletteName(): string {
  const names = getPaletteNames();
  return names[Math.floor(Math.random() * names.length)];
}
