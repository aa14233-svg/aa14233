/**
 * OklabConversions.ts — Oklab ↔ Oklch ↔ sRGB 高精度转换管线
 *
 * ========== 色彩科学依据 ==========
 * Oklab 是 Björn Ottosson 于 2020 年提出的感知均匀色彩空间，
 * 相较 CIELAB（L*a*b*）在蓝色区域的 hue linearity 问题被显著改善。
 * Oklch 是 Oklab 的圆柱极坐标形式，更符合设计师的"色相-彩度-明度"直觉。
 *
 * ========== 管线流程 ==========
 *   sRGB (uint8)
 *     ↓ linearize
 *   Linear sRGB
 *     ↓ M1
 *   LMS (长/中/短锥体响应)
 *     ↓ M2^(1/3)  (非线性压缩)
 *   Oklab
 *     ↓ polar transform
 *   Oklch  ← 本模块核心工作空间
 *
 * ========== 参考 ==========
 * - https://bottosson.github.io/posts/oklab/
 * - https://www.w3.org/TR/css-color-4/#ok-lab
 *
 * ========== 精度 ==========
 * 所有转换使用 Float64 (JS number) 计算，避免累积误差。
 * 最终输出 clamp 到 [0, 1] 范围。
 * ========================================================================== */

/** M1: Linear sRGB → LMS (3×3 矩阵，常量折叠) */
const M1 = [
  [ 0.8189330101,  0.3618667424, -0.1288597137 ],
  [ 0.0329845436,  0.9293118715,  0.0361456387 ],
  [ 0.0482003018,  0.2643662691,  0.6338517070 ],
] as const;

/** M1⁻¹: LMS → Linear sRGB */
const M1_INV = [
  [ 1.2270138511, -0.5577999807,  0.2812561490 ],
  [-0.0405801784,  1.1122568696, -0.0716766787 ],
  [-0.0763812845, -0.4214819784,  1.5861632204 ],
] as const;

/** sRGB gamma 校正参数 */
const GAMMA = 2.4;
const INV_GAMMA = 1 / GAMMA;

/**
 * sRGB 反gamma（线性化）
 * 标准的 sRGB 2.4 幂次近似
 */
export function srgbLinearize(c: number): number {
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, GAMMA);
}

/**
 * 线性 sRGB → sRGB（gamma 编码）
 */
export function srgbEncode(c: number): number {
  return c <= 0.0031308
    ? c * 12.92
    : 1.055 * Math.pow(c, INV_GAMMA) - 0.055;
}

/**
 * Linear sRGB [0,1]³ → Oklab
 */
export function linearSrgbToOklab(r: number, g: number, b: number): { L: number; a: number; b_: number } {
  // Linear sRGB → LMS
  const l = M1[0][0] * r + M1[0][1] * g + M1[0][2] * b;
  const m = M1[1][0] * r + M1[1][1] * g + M1[1][2] * b;
  const s = M1[2][0] * r + M1[2][1] * g + M1[2][2] * b;

  // LMS 立方根（非线性压缩）
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS' → Oklab
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b_: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/**
 * Oklab → Linear sRGB [0,1]³
 * 结果已 clamp
 */
export function oklabToLinearSrgb(L: number, a: number, b_: number): [number, number, number] {
  // Oklab → LMS'
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b_;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b_;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b_;

  // LMS'³ → LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → Linear sRGB
  const r = M1_INV[0][0] * l + M1_INV[0][1] * m + M1_INV[0][2] * s;
  const g = M1_INV[1][0] * l + M1_INV[1][1] * m + M1_INV[1][2] * s;
  const b = M1_INV[2][0] * l + M1_INV[2][1] * m + M1_INV[2][2] * s;

  // Clamp
  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ];
}

/**
 * Oklab → Oklch（极坐标变换）
 */
export function oklabToOklch(L: number, a: number, b_: number): { l: number; c: number; h: number } {
  const c = Math.sqrt(a * a + b_ * b_);
  const h = Math.atan2(b_, a) * (180 / Math.PI);
  return {
    l: L,
    c,
    h: ((h % 360) + 360) % 360, // 归一化到 [0, 360)
  };
}

/**
 * Oklch → Oklab（笛卡尔变换）
 */
export function oklchToOklab(l: number, c: number, h: number): { L: number; a: number; b_: number } {
  const hRad = h * (Math.PI / 180);
  return {
    L: l,
    a: c * Math.cos(hRad),
    b_: c * Math.sin(hRad),
  };
}

/**
 * sRGB (uint8 归一化) → Oklch — 完整管线
 */
export function srgbToOklch(ru: number, gu: number, bu: number): { l: number; c: number; h: number } {
  const r = srgbLinearize(ru);
  const g = srgbLinearize(gu);
  const b = srgbLinearize(bu);
  const lab = linearSrgbToOklab(r, g, b);
  return oklabToOklch(lab.L, lab.a, lab.b_);
}

/**
 * Oklch → sRGB (uint8 [0,1]) — 完整管线
 */
export function oklchToSrgb(l: number, c: number, h: number): [number, number, number] {
  const lab = oklchToOklab(l, c, h);
  const [r, g, b] = oklabToLinearSrgb(lab.L, lab.a, lab.b_);
  return [
    srgbEncode(r),
    srgbEncode(g),
    srgbEncode(b),
  ];
}
