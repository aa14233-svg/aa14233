/* ==========================================================================
 * fragment.glsl — 粒子系统片段着色器
 *
 * ========== 核心功能 ==========
 * 根据粒子的 age 属性，从 Oklch 调色板中动态采样颜色。
 *
 * ========== Oklch 色彩管线 ==========
 * 本着色器在 GPU 上实现完整的 Oklch → sRGB 转换，
 * 避免在 CPU 端预计算 LUT，支持运行时调色板热更新。
 *
 * 管线流程：
 *   1. 根据 vAge 在调色板关键帧之间线性插值
 *   2. 插值结果位于 Oklch 空间
 *   3. Oklch → Oklab (极坐标→笛卡尔)
 *   4. Oklab → Linear sRGB (矩阵变换)
 *   5. sRGB gamma 编码输出
 *
 * 调色板布局 (uniform):
 *   uPaletteColors[PALETTE_SIZE] — Oklch 颜色数组 (vec4.xyzw = L, c, h, a)
 *   uPaletteTimes[PALETTE_SIZE]  — 对应关键帧时间点
 *   uPaletteCount                 — 有效关键帧数量
 * ========================================================================== */

precision highp float;

// ── 从顶点着色器传入 ──
varying vec3 vColor;
varying float vAge;         // 归一化生命进度 [0, 1]

// ── Uniforms ──
uniform float uOpacity;     // 全局不透明度

// ── Oklch 调色板（最多 8 个关键帧） ──
#define PALETTE_MAX 8

uniform vec4  uPaletteColors[PALETTE_MAX]; // xyzw = L, c, h, a
uniform float uPaletteTimes[PALETTE_MAX];  // 对应时间点 [0, 1]
uniform int   uPaletteCount;               // 实际关键帧数 (2..PALETTE_MAX)

// ==========================================================================
// Oklch → Oklab → Linear sRGB 转换管线 (GPU 实现)
// ==========================================================================

/**
 * Oklch → Oklab（极坐标→笛卡尔）
 */
vec3 oklchToOklab(vec3 oklch) {
  float L = oklch.x;       // 明度
  float c = oklch.y;       // 彩度
  float h = oklch.z;       // 色相（度）
  float hRad = radians(h);
  return vec3(
    L,
    c * cos(hRad),
    c * sin(hRad)
  );
}

/**
 * Oklab → Linear sRGB (M1⁻¹ 矩阵)
 */
vec3 oklabToLinearSrgb(vec3 lab) {
  float L_ = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
  float m_ = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
  float s_ = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;

  // LMS'³ → LMS (cube in shader: L_*L_*L_)
  float l = L_ * L_ * L_;
  float m = m_ * m_ * m_;
  float s = s_ * s_ * s_;

  // M1⁻¹: LMS → Linear sRGB
  vec3 rgb;
  rgb.r =  1.2270138511 * l - 0.5577999807 * m + 0.2812561490 * s;
  rgb.g = -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s;
  rgb.b = -0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s;

  return rgb;
}

/**
 * sRGB gamma 编码（近似）
 */
vec3 srgbEncode(vec3 linear) {
  // 标准 sRGB 2.4 幂次
  vec3 lo = linear * 12.92;
  vec3 hi = 1.055 * pow(linear, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), linear));
}

/**
 * Oklch → sRGB 完整管线
 */
vec4 oklchToSrgba(vec3 oklch, float alpha) {
  vec3 lab = oklchToOklab(oklch);
  vec3 linearRgb = oklabToLinearSrgb(lab);
  vec3 srgb = srgbEncode(clamp(linearRgb, 0.0, 1.0));
  return vec4(srgb, clamp(alpha, 0.0, 1.0));
}

// ==========================================================================
// 调色板采样 — 根据 age 在关键帧间 Oklch 插值
// ==========================================================================

/**
 * Oklch 色相最短路径处理
 */
float hueLerp(float h1, float h2, float t) {
  float delta = h2 - h1;
  if (delta > 180.0) delta -= 360.0;
  if (delta < -180.0) delta += 360.0;
  return h1 + delta * t;
}

/**
 * 两个 Oklch 颜色关键帧插值
 */
vec4 lerpOklch(vec4 a, vec4 b, float t) {
  float L = mix(a.x, b.x, t);
  float c = mix(a.y, b.y, t);
  float h = hueLerp(a.z, b.z, t);
  float alpha = mix(a.w, b.w, t);
  return vec4(L, c, h, alpha);
}

/**
 * 根据 vAge 从调色板采样颜色
 */
vec4 samplePalette(float age) {
  int count = uPaletteCount;

  // 边界保护
  if (count <= 0) return vec4(1.0, 1.0, 1.0, 1.0);

  // 边界钳制
  if (age <= uPaletteTimes[0]) return uPaletteColors[0];
  if (age >= uPaletteTimes[count - 1]) return uPaletteColors[count - 1];

  // 线性查找（GPU 上通常二分查找的 warp divergence 问题与线性查找相当）
  for (int i = 0; i < PALETTE_MAX - 1; i++) {
    if (i >= count - 1) break;
    float t0 = uPaletteTimes[i];
    float t1 = uPaletteTimes[i + 1];
    if (age >= t0 && age < t1) {
      float t = (t1 > t0) ? (age - t0) / (t1 - t0) : 0.0;
      return lerpOklch(uPaletteColors[i], uPaletteColors[i + 1], t);
    }
  }

  return uPaletteColors[count - 1];
}

// ==========================================================================
// 主函数
// ==========================================================================

void main() {
  // ── 圆形点精灵（丢弃方形角落） ──
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  // 硬边裁剪（性能优先）
  if (dist > 0.5) discard;

  // 柔和边缘（0.5 → 0.35 区间平滑衰减）
  float softEdge = 1.0 - smoothstep(0.35, 0.5, dist);

  // ── 根据生命进度采样调色板颜色 ──
  vec4 paletteColor = samplePalette(vAge);

  // ── Oklch → sRGB 转换 ──
  vec3 oklchColor = paletteColor.xyz; // L, c, h
  float alpha = paletteColor.w * softEdge * uOpacity;
  vec4 finalColor = oklchToSrgba(oklchColor, alpha);

  gl_FragColor = finalColor;

  // ========== 调试模式（取消注释以启用） ==========
  // 无调色板：直接显示 vColor (CPU 端 RGB)
  // gl_FragColor = vec4(vColor, vAge) * softEdge * uOpacity;
}
