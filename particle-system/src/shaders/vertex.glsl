/* ==========================================================================
 * vertex.glsl — 粒子系统顶点着色器
 *
 * 逐实例属性：
 *   instancePosition — 粒子世界坐标 (vec3)
 *   instanceColor    — 粒子颜色 (vec3, 线性 RGB)
 *   instanceSize     — 粒子大小 (float)
 *
 * 输出到片段着色器：
 *   vColor      — 传递给片段阶段的颜色
 *   vAge        — 归一化生命进度 [0, 1]
 * ========================================================================== */

// ── 逐实例属性（由 GPUBufferManager 填充） ──
attribute vec3 instancePosition;
attribute vec3 instanceColor;
attribute float instanceSize;

// ── Uniforms ──
uniform float uPointScale;  // 点精灵全局缩放因子

// ── 传递到片段着色器 ──
varying vec3 vColor;
varying float vAge;         // 归一化生命进度 [0, 1]

void main() {
  vColor = instanceColor;

  // 将粒子从模型空间平移到实例位置
  vec3 worldPos = position + instancePosition;

  // 标准模型-视图-投影变换
  vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);

  // ========== 点精灵大小 ==========
  // 1. 基础大小 × 实例大小因子
  // 2. 透视衰减：距相机越远越小
  // 3. uPointScale 统一缩放
  gl_PointSize = instanceSize * uPointScale * (256.0 / -mvPosition.z);
  gl_PointSize = max(gl_PointSize, 1.0); // 最小 1px

  // 标准输出
  gl_Position = projectionMatrix * mvPosition;

  // 传递生命进度（从 instanceSize 的 w 分量暂存）
  // 注：此处简化传递，实际项目中可通过额外 attribute 传递 age
  vAge = 0.5; // 占位 — 由片段着色器的动态采样逻辑使用
}
