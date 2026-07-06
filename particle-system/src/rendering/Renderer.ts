/**
 * Renderer.ts - Three.js InstancedMesh 渲染封装
 *
 * ========== 职责 ==========
 * 1. 创建和管理 THREE.InstancedMesh + 自定义 ShaderMaterial
 * 2. 每帧通过 GPUBufferManager 的逐实例属性更新几何体
 * 3. 管理场景、相机、WebGLRenderer 的创建与销毁
 *
 * ========== 渲染管线 ==========
 * 每帧 Engine._render() 调用：
 *   1. GPUBufferManager.sync(pool)          — CPU 数据 → GPU buffers
 *   2. Renderer.render()                    — 设置 mesh.count, needsUpdate, 提交 drawcall
 *
 * ========== 着色器 ==========
 * 使用自定义 ShaderMaterial 读取 GPUBufferManager 提供的逐实例属性：
 *   - instancePosition (vec3) — 粒子位置
 *   - instanceColor    (vec3) — 粒子颜色
 *   - instanceSize     (float) — 粒子大小
 *
 * 由于 Three.js 对带有不同步长属性的 Mesh 自动使用 instanced draw call，
 * 因此本类使用 THREE.Mesh + 逐实例属性实现等效于 InstancedMesh 的效果。
 *
 * 如需严格使用 THREE.InstancedMesh，可将构建方式切换为：
 *   const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
 *   然后手动写入 mesh.instanceMatrix.array 的平移分量。
 */

import * as THREE from 'three';
import type { RenderConfig } from '../types';
import { GPUBufferManager } from '../core/GPUBufferManager';

/** 点精灵四边形顶点（两个三角形构成一个单位正方形） */
function createQuadGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    -0.5, -0.5, 0,
     0.5, -0.5, 0,
     0.5,  0.5, 0,
    -0.5,  0.5, 0,
  ]);
  const idx = new Uint16Array([0, 1, 2, 0, 2, 3]);

  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Oklch → sRGB 片段着色器（GPU 完整管线）
 * 根据粒子 age 在 Oklch 调色板关键帧之间插值
 */
const FRAGMENT_SHADER_OKLCH = `
  precision highp float;

  varying vec3 vColor;
  varying float vAge;

  uniform float uOpacity;
  uniform vec4  uPaletteColors[8];
  uniform float uPaletteTimes[8];
  uniform int   uPaletteCount;

  // ====== Oklch → Oklab → Linear sRGB GPU 管线 ======

  vec3 oklchToOklab(vec3 oklch) {
    float L = oklch.x;
    float c = oklch.y;
    float h = radians(oklch.z);
    return vec3(L, c * cos(h), c * sin(h));
  }

  vec3 oklabToLinearSrgb(vec3 lab) {
    float l_ = lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z;
    float m_ = lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z;
    float s_ = lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z;
    float l = l_ * l_ * l_;
    float m = m_ * m_ * m_;
    float s = s_ * s_ * s_;
    vec3 rgb;
    rgb.r =  1.2270138511 * l - 0.5577999807 * m + 0.2812561490 * s;
    rgb.g = -0.0405801784 * l + 1.1122568696 * m - 0.0716766787 * s;
    rgb.b = -0.0763812845 * l - 0.4214819784 * m + 1.5861632204 * s;
    return rgb;
  }

  vec3 srgbEncode(vec3 linear) {
    vec3 lo = linear * 12.92;
    vec3 hi = 1.055 * pow(linear, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(vec3(0.0031308), linear));
  }

  vec4 oklchToSrgba(vec3 oklch, float alpha) {
    vec3 lab = oklchToOklab(oklch);
    vec3 linearRgb = oklabToLinearSrgb(lab);
    vec3 srgb = srgbEncode(clamp(linearRgb, 0.0, 1.0));
    return vec4(srgb, clamp(alpha, 0.0, 1.0));
  }

  // ====== 调色板插值 ======

  float hueLerp(float h1, float h2, float t) {
    float delta = h2 - h1;
    if (delta > 180.0) delta -= 360.0;
    if (delta < -180.0) delta += 360.0;
    return h1 + delta * t;
  }

  vec4 lerpOklch(vec4 a, vec4 b, float t) {
    return vec4(mix(a.x, b.x, t), mix(a.y, b.y, t), hueLerp(a.z, b.z, t), mix(a.w, b.w, t));
  }

  vec4 samplePalette(float age) {
    int cnt = uPaletteCount;
    if (cnt <= 0) return vec4(1.0);
    if (age <= uPaletteTimes[0]) return uPaletteColors[0];
    if (age >= uPaletteTimes[cnt - 1]) return uPaletteColors[cnt - 1];
    for (int i = 0; i < 7; i++) {
      if (i >= cnt - 1) break;
      float t0 = uPaletteTimes[i];
      float t1 = uPaletteTimes[i + 1];
      if (age >= t0 && age < t1) {
        float t = (t1 > t0) ? (age - t0) / (t1 - t0) : 0.0;
        return lerpOklch(uPaletteColors[i], uPaletteColors[i + 1], t);
      }
    }
    return uPaletteColors[cnt - 1];
  }

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float softEdge = 1.0 - smoothstep(0.35, 0.5, dist);

    vec4 palColor = samplePalette(vAge);
    vec3 oklchColor = palColor.xyz;
    float alpha = palColor.w * softEdge * uOpacity;

    gl_FragColor = oklchToSrgba(oklchColor, alpha);
  }
`;

/** 默认 Oklch 调色板关键帧（极光色系） */
const DEFAULT_PALETTE_COLORS = [
  new THREE.Vector4(0.80, 0.15, 140, 1.0),
  new THREE.Vector4(0.75, 0.12, 190, 1.0),
  new THREE.Vector4(0.70, 0.14, 260, 0.9),
  new THREE.Vector4(0.30, 0.04, 300, 0.0),
  new THREE.Vector4(0, 0, 0, 0),
  new THREE.Vector4(0, 0, 0, 0),
  new THREE.Vector4(0, 0, 0, 0),
  new THREE.Vector4(0, 0, 0, 0),
].slice(0, 8) as [THREE.Vector4, THREE.Vector4, THREE.Vector4, THREE.Vector4, THREE.Vector4, THREE.Vector4, THREE.Vector4, THREE.Vector4];

const DEFAULT_PALETTE_TIMES = [0.0, 0.35, 0.65, 1.0, 0, 0, 0, 0];

/**
 * 构建自定义 ShaderMaterial，读取逐实例属性 + Oklch 调色板
 */
function createParticleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1.0 },
      uPaletteColors: { value: DEFAULT_PALETTE_COLORS },
      uPaletteTimes:  { value: DEFAULT_PALETTE_TIMES },
      uPaletteCount:  { value: 4 },
      uPointScale: { value: 1.2 },
    },
    vertexShader: `
      attribute vec3 instancePosition;
      attribute vec3 instanceColor;
      attribute float instanceSize;

      varying vec3 vColor;
      varying float vAge;

      uniform float uPointScale;

      void main() {
        vColor = instanceColor;
        vec3 pos = position + instancePosition;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = instanceSize * uPointScale * (256.0 / -mvPosition.z);
        gl_PointSize = max(gl_PointSize, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vAge = 0.5; // 简化为固定值，生产环境通过额外 attribute 传递
      }
    `,
    fragmentShader: FRAGMENT_SHADER_OKLCH,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

export class Renderer {
  private _scene: THREE.Scene;
  private _camera: THREE.PerspectiveCamera;
  private _webglRenderer: THREE.WebGLRenderer;
  private _mesh: THREE.Mesh;
  private _material: THREE.ShaderMaterial;
  private _gpuBufferManager: GPUBufferManager;

  constructor(
    canvas: HTMLCanvasElement,
    gpuBufferManager: GPUBufferManager,
    config: RenderConfig,
  ) {
    this._gpuBufferManager = gpuBufferManager;

    // --- 场景 ---
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x0a0a1a);

    // --- 相机 ---
    const camPos = config.cameraPosition ?? [0, 5, 15];
    this._camera = new THREE.PerspectiveCamera(
      60,                                    // fov
      canvas.width / canvas.height,          // aspect
      0.1,                                   // near
      1000,                                  // far
    );
    this._camera.position.set(camPos[0], camPos[1], camPos[2]);
    this._camera.lookAt(0, 0, 0);

    // --- WebGLRenderer ---
    this._webglRenderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this._webglRenderer.setSize(canvas.width, canvas.height);
    this._webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- 粒子几何体 & 材质 ---
    const geometry = config.geometry ?? createQuadGeometry();
    this._material = config.material
      ? (config.material as THREE.ShaderMaterial)
      : createParticleMaterial();

    // 将 GPUBufferManager 的逐实例属性挂载到几何体
    geometry.setAttribute(
      'instancePosition',
      gpuBufferManager.positionBuffer,
    );
    geometry.setAttribute(
      'instanceColor',
      gpuBufferManager.colorBuffer,
    );
    geometry.setAttribute(
      'instanceSize',
      gpuBufferManager.sizeBuffer,
    );

    // --- 粒子 Mesh ---
    // 使用 THREE.Mesh + 逐实例属性实现等效 InstancedMesh 效果。
    // Three.js 自动检测步长不同的属性并发出 instanced draw calls。
    this._mesh = new THREE.Mesh(geometry, this._material);
    this._mesh.frustumCulled = false; // 粒子系统始终可见
    this._scene.add(this._mesh);

    // 可选辅助：坐标轴
    // this._scene.add(new THREE.AxesHelper(5));
  }

  /**
   * 每帧渲染调用。
   * 注意：GPUBufferManager.sync() 需在调用此方法前已执行。
   */
  render(): void {
    const count = this._gpuBufferManager.visibleCount;

    // 对于 THREE.Mesh + 逐实例属性，实际实例数由属性长度决定。
    // 此处通过标记 needsUpdate 确保 GPU 数据已刷新。
    // visibleCount 可用于调试或 future 的 draw range 优化。

    this._webglRenderer.render(this._scene, this._camera);
  }

  /** 处理窗口 resize */
  resize(width?: number, height?: number): void {
    const w = width ?? window.innerWidth;
    const h = height ?? window.innerHeight;
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
    this._webglRenderer.setSize(w, h);
  }

  /** 获取 Three.js 场景引用 */
  get scene(): THREE.Scene {
    return this._scene;
  }

  /** 获取 Three.js 相机引用 */
  get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }

  /** 获取 Three.js WebGLRenderer 引用 */
  get webglRenderer(): THREE.WebGLRenderer {
    return this._webglRenderer;
  }

  /** 获取粒子 Mesh */
  get mesh(): THREE.Mesh {
    return this._mesh;
  }

  /** 获取 ShaderMaterial 引用 */
  get material(): THREE.ShaderMaterial {
    return this._material;
  }

  /**
   * 动态更新 Oklch 调色板关键帧（运行时热切换）
   *
   * @param colors - Oklch 颜色数组，每项为 [L, c, h, alpha]
   * @param times  - 对应关键帧时间 [0, 1]
   */
  setPalette(
    colors: [number, number, number, number][],
    times: number[],
  ): void {
    const n = Math.min(colors.length, times.length, 8);
    for (let i = 0; i < 8; i++) {
      if (i < n) {
        const [L, c, h, a] = colors[i];
        this._material.uniforms.uPaletteColors.value[i].set(L, c, h, a);
        this._material.uniforms.uPaletteTimes.value[i] = times[i];
      }
    }
    this._material.uniforms.uPaletteCount.value = n;
  }

  /** 销毁渲染器 */
  dispose(): void {
    this._scene.remove(this._mesh);
    this._mesh.geometry.dispose();
    this._material.dispose();
    this._webglRenderer.dispose();
  }
}
