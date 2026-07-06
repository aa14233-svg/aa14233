/**
 * main.ts - 粒子系统入口模块
 *
 * ========== 职责 ==========
 * 将所有模块（ParticlePool、ParticleEmitter、GPUBufferManager、Renderer、Engine）
 * 组装为一个可运行的粒子系统实例。
 *
 * ========== 初始化流程 ==========
 * 1. 创建 Canvas 并挂载到 DOM
 * 2. 创建 ParticlePool（最大粒子数）
 * 3. 创建 GPUBufferManager（同最大粒子数）
 * 4. 创建 Renderer（传入 Canvas + GPUBufferManager + 渲染配置）
 * 5. 创建 Engine（串联 Pool、GPUBufferManager、Renderer）
 * 6. 创建 ParticleEmitter 并注册到 Engine
 * 7. （可选）注册 NoiseField 作为逐帧更新回调
 * 8. Engine.start() 启动主循环
 */

import { ParticlePool } from './particles/ParticlePool';
import { ParticleEmitter } from './emitter/ParticleEmitter';
import type { EmitterConfig, RenderConfig } from './types';
import { GPUBufferManager } from './core/GPUBufferManager';
import { Engine } from './core/Engine';
import { Renderer } from './rendering/Renderer';
import { NoiseField } from './math/NoiseField';

// ==================== 配置 ====================

/** 粒子系统容量 */
const MAX_PARTICLES = 10_000;

/** 发射器配置 */
const EMITTER_CFG: EmitterConfig = {
  maxParticles: MAX_PARTICLES,
  rate: 200,                          // 每秒发射 200 个
  lifetime: [2.0, 4.0],               // 寿命 2-4 秒
  speed: [1.0, 3.0],                  // 速度 1-3 单位/秒
  size: [0.1, 0.5],                   // 大小 0.1-0.5
  colors: [
    { time: 0.0,  color: { l: 1.0, c: 0.12, h: 280, a: 1.0 } }, // 紫色
    { time: 0.5,  color: { l: 0.8, c: 0.18, h: 200, a: 1.0 } }, // 蓝色
    { time: 1.0,  color: { l: 0.3, c: 0.05, h: 0,   a: 0.0 } }, // 淡出
  ],
  shape: 'sphere',
  shapeConfig: { radius: 2 },
  position: [0, 0, 0],
};

/** 渲染配置 */
const RENDER_CFG: RenderConfig = {
  count: MAX_PARTICLES,
  useInstanceColor: true,
  useInstanceSize: true,
  cameraPosition: [0, 5, 15],
};

// ==================== 初始化 ====================

function main(): void {
  // 1. Canvas
  const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement
    ?? createFullscreenCanvas();

  // 2. 粒子池
  const pool = new ParticlePool(MAX_PARTICLES);

  // 3. GPU 缓冲区管理器
  const gpuBufferManager = new GPUBufferManager(MAX_PARTICLES);

  // 4. Three.js 渲染封装
  const renderer = new Renderer(canvas, gpuBufferManager, RENDER_CFG);

  // 5. 引擎
  const engine = new Engine(pool, gpuBufferManager, renderer);

  // 6. 发射器
  const emitter = new ParticleEmitter(pool, EMITTER_CFG);
  engine.addEmitter(emitter);

  // 7. 噪声流场（可选）
  const noiseField = new NoiseField({
    scale: 0.02,
    strength: 2.0,
    timeSpeed: 0.1,
    seed: 42,
  });

  let elapsed = 0;

  engine.setUpdateCallback((dt, _pool) => {
    elapsed += dt;

    // 噪声场采样并施加到存活粒子的速度
    _pool.forEachAlive((_index, data, off) => {
      const px = data[off];
      const py = data[off + 1];
      const pz = data[off + 2];
      const [fx, fy, fz] = noiseField.sample(px, py, pz, elapsed);

      data[off + 3] += fx * dt; // velocity.x
      data[off + 4] += fy * dt; // velocity.y
      data[off + 5] += fz * dt; // velocity.z
    });
  });

  // 8. 启动
  engine.start();

  // 暴露引擎到全局（方便 DevTools 调试）
  (window as unknown as Record<string, unknown>).__particleEngine = engine;

  console.log('[ParticleSystem] 已启动', engine.getStats());
}

// ==================== 辅助 ====================

/** 在全屏创建 Canvas 并挂载到 body */
function createFullscreenCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.id = 'particle-canvas';
  canvas.style.display = 'block';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  document.body.appendChild(canvas);
  return canvas;
}

// ==================== 启动 ====================

// 等待 DOM 就绪
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
