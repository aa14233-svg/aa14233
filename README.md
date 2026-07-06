# Trae Workspace · 本地产出物全集

本仓库是 Trae AI 工作区的完整产出物备份，包含 **5 个独立项目** 和 **多份学习教材/可视化产出**。每份文件都有对应上下文和使用指南，供 AI 或人类阅读者快速理解与复用。

---

## 目录结构

```
e:\trae work\
├── taibai-release\                    # 太白炁渊·命理全栈应用
├── particle-system\                   # WebGPU 3D 粒子系统
├── metaphysical-fullstack-design\     # 形而上全栈设计文档（HTML）
├── dark-knowledge-app\                # 暗黑知识应用（设计原型）
├── 人工智能入门\                       # AI 学习教材 (The Automated Mind)
├── 配套实验\labs\                     # Python 配套实验代码
├── *.html                             # 独立可视化页面
├── *.docx                             # 教材/手册 Word 文档
├── *.md                               # 项目上下文、索引文档
└── README.md                          # ← 本文件
```

---

## 项目一：太白炁渊·命理全栈

> 路径：`taibai-release/`

独立运行的全栈命理推理应用，包含四柱八字、六爻、紫微斗数、奇门遁甲四种引擎。

### 架构

```
前端 SPA (index.html + style.css)
    ↕ HTTP REST
Node.js API Server (server.js :3456)
    ↕ stdin/stdout JSON          ↕ HTTP
Rust 引擎 (taibai_engine.exe)    LM Studio AI (:1234/v1)
```

### 文件清单

| 文件 | 用途 |
|------|------|
| `taibai_engine.rs` | Rust 源码，四引擎合一，无外部依赖，1239 行 |
| `taibai_engine.exe` | 编译后的引擎二进制 (417KB) |
| `server.js` | Node.js Express 服务，14 个 API 路由 |
| `public/index.html` | SPA 前端，9 个页面切换 |
| `public/style.css` | 暗色主题样式 |
| `data/history.json` | 排盘历史记录 |
| `data/settings.json` | 应用设置 |
| `package.json` | Node 依赖声明 |
| `启动命理应用.bat` | 一键启动脚本 |

### 引擎通信协议

stdin 输入单行 JSON：
```json
{"type":"bazi","year":1990,"month":5,"day":15,"hour":12,"gender":"男"}
```

stdout 输出四柱、五行统计、十神、大运、神煞等完整结果。

### API 路由表

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/ping` | 健康检查 |
| POST | `/api/bazi` | 八字排盘 |
| POST | `/api/liuyao` | 六爻起卦 |
| POST | `/api/ziwei` | 紫微排盘 |
| POST | `/api/qimen` | 奇门排盘 |
| POST | `/api/route` | 意图路由 → AI 分类 |
| POST | `/api/dialog` | 对话 → LM Studio |
| POST | `/api/embed` | 向量嵌入 → LM Studio |
| GET/POST/DEL | `/api/history` | 排盘历史 CRUD |
| GET/POST | `/api/settings` | 应用设置 CRUD |

### 启动方式

```bash
cd taibai-release
node server.js
# 服务运行于 http://127.0.0.1:3456
```

### LM Studio 配合

对话增强功能需要 LM Studio (端口 1234)，使用的模型：
- **Qwen2.5-3B** (q4_k_m) — 主对话推理
- **Qwen3.5-0.8B** (q4_k_m) — 路由调度
- **Qwen2.5-1.5B** (q4_k_m) — 质检校验
- **BGE-M3** (q4_k_m) — 向量嵌入

纯引擎模式不依赖 LM Studio，排盘类 API 可直接使用。

---

## 项目二：WebGPU 粒子系统

> 路径：`particle-system/`

基于 WebGPU 的 3D 粒子系统，使用 TypeScript + Vite 构建。

### 文件清单

| 路径 | 用途 |
|------|------|
| `src/core/Engine.ts` | WebGPU 引擎核心（设备、队列、交换链） |
| `src/core/GPUBufferManager.ts` | GPU 缓冲区管理 |
| `src/particles/Particle.ts` | 粒子数据结构 |
| `src/particles/ParticlePool.ts` | 粒子池对象复用 |
| `src/emitter/ParticleEmitter.ts` | 粒子发射器逻辑 |
| `src/rendering/Renderer.ts` | 渲染管线 |
| `src/shaders/vertex.glsl` | 顶点着色器 |
| `src/shaders/fragment.glsl` | 片段着色器 |
| `src/color/ColorPalette.ts` | 颜色调色板 |
| `src/color/ColorInterpolator.ts` | 颜色插值器 |
| `src/color/OklabConversions.ts` | Oklab 色彩空间转换 |
| `src/math/NoiseField.ts` | 噪声场（影响粒子运动） |
| `src/types/index.ts` | 类型定义 |
| `src/main.ts` | 入口文件 |
| `vite.config.ts` | Vite 构建配置 |

### 启动方式

```bash
cd particle-system
npm install
npm run dev
```

### 依赖

- three.js — 3D 数学与渲染基础
- @tweenjs/tween.js — 动画插值
- simplex-noise — 噪声场
- gl-matrix — 矩阵运算

---

## 项目三：形而上全栈设计

> 路径：`metaphysical-fullstack-design/`

单 HTML 文件架构设计文档，使用 Mermaid + ECharts 可视化展示系统拓扑关系。

### 文件

| 文件 | 用途 |
|------|------|
| `metaphysical-fullstack-design.html` | 主设计文档 |
| `_shared/js/echarts.min.js` | ECharts 图表库 |
| `_shared/js/mermaid.min.js` | Mermaid 图表库 |

直接在浏览器打开 HTML 文件即可查看。

---

## 项目四：暗黑知识应用

> 路径：`dark-knowledge-app/`

概念设计阶段的应用原型，设计文件描述了一个知识管理/可视化应用的 UI 与交互规范。

### 文件

| 文件 | 用途 |
|------|------|
| `pages/main.html` | 主页面 HTML |
| `colors_and_type.css` | 色彩体系与字体排版 |
| `dark-knowledge-app.design` | 设计规范与组件定义 |
| `generation-tree.json` | 生成树（代码/组件层级） |
| `orchestration-summary.json` | 编排摘要（路由/数据流） |

---

## 项目五：AI 学习教材 — The Automated Mind

> 路径：`人工智能入门/`

一套完整的 AI 入门教材体系，从底层原理到上层应用，分为 5 个阶段 + Agent 专题。

### 教材结构

```
人工智能入门/
├── 教材：The Automated Mind/         # 主教材
│   ├── Phase 1：秩序的底座/           # C++、数据结构、Windows内核
│   ├── Phase 2：语义空间与认知具象/    # Embedding、RAG、多模态
│   ├── Phase 3：模型生态与Agent实践/   # Agent部署、模型选型、工程项目
│   ├── Phase 4：深水区与几何/          # 智能体记忆、流形、拓扑
│   ├── Phase 5：规则重塑/             # Neuro-Symbolic、SAE、ZK-ML
│   ├── 前言.md                      # ⭐ 从这开始阅读
│   ├── 导论：AI模型全景图.md
│   └── 尾声：通往Automated Mind之路.md
├── 手册：核心概念降维缓存/            # 10 个核心概念的降维解释
│   ├── Concept_01：揉纸团理论.md      # 高维空间的直觉理解
│   ├── Concept_02：销售员与审计师.md   # 生成 vs 判别模型
│   ├── Concept_03：拥挤的无线电频道.md  # Attention 机制
│   ├── Concept_04：蒙眼吃辣椒证明.md    # 可解释性
│   ├── Concept_05：按线索破案.md       # RAG 检索增强
│   └── ... (共 10 个 Concept)
├── 配套实验/labs/                    # 12 个 Python 实验
│   ├── vol01_cache_simd/            # CPU 缓存与 SIMD
│   ├── vol02_tensor_basics/         # 张量运算
│   ├── vol03_embedding/             # Embedding 实践
│   ├── vol04_rag/                   # RAG 流程
│   ├── vol05_memory/                # 记忆系统
│   ├── vol06_manifold/              # 流形学习
│   ├── vol07_neurosymbolic/         # 神经符号系统
│   ├── vol09_kernel/                # Windows 内核
│   ├── vol10_topology/              # 拓扑数据分析
│   ├── vol11_sae/                   # 稀疏自编码器
│   ├── vol12_zkml/                  # 零知识机器学习
│   └── vol_ag01_model_selection/    # 模型基准测试
├── 知识架构总览.md                   # 知识点拓扑
├── 索引.md                          # 全文索引
└── 知识文档合集.docx                 # 合集导出
```

### 实验运行

```bash
cd 人工智能入门/配套实验/labs
python vol01_cache_simd/check_cache.py
python vol03_embedding/embedding_demo.py
# 需要: Python 3.8+, numpy, torch, transformers, scikit-learn
```

---

## 独立 HTML 可视化

根目录下多个可直接在浏览器打开的 HTML 文件：

| 文件 | 内容 |
|------|------|
| `cloud.html` | 云朵粒子可视化 |
| `nebula.html` | 星云效果 |
| `spiral-galaxy.html` | 旋涡星系动画 |
| `spiral.html` | 螺旋线生成 |
| `cloud.fig` | 云朵 SVG 图形源 |

---

## Word 文档汇总

| 文件 | 内容 |
|------|------|
| `人工智能入门：两书全本（含超链接）.docx` | 教材+手册合集，含超链接导航 |
| `教材：The Automated Mind.docx` | 教材纯文本版 |
| `教材：The Automated Mind（含超链接）.docx` | 教材含超链接版 |
| `手册：核心概念降维缓存.docx` | 核心概念手册 |
| `手册：核心概念降维缓存（含超链接）.docx` | 核心概念手册含超链接版 |
| `the_automated_mind_full.md` | 教材完整 Markdown 版 |
| `automated_mind_textbook_prompts.md` | 教材配套提示词 |

---

## 关联上下文文件

| 文件 | 用途 | 关联项目 |
|------|------|----------|
| `taibai-项目上下文.md` | 太白炁渊全栈架构、API、模型配置完整说明 | taibai-release |

---

## 快速索引

| 你想做什么 | 看这里 |
|------------|--------|
| 运行命理应用 | `taibai-release/` → 双击 `启动命理应用.bat` |
| 了解四柱八字 API | `taibai-release/server.js` |  
| 修改 Rust 引擎 | `taibai-release/taibai_engine.rs` |
| 运行粒子系统 | `particle-system/` → `npm run dev` |
| 学习 AI 从零开始 | `人工智能入门/教材：The Automated Mind/前言.md` |
| 做 AI 实验 | `人工智能入门/配套实验/labs/vol03_embedding/embedding_demo.py` |
| 查看系统设计 | `metaphysical-fullstack-design/metaphysical-fullstack-design.html` |
| 理解 AI 核心概念 | `人工智能入门/手册：核心概念降维缓存/Concept_01：揉纸团理论.md` |

---

> 最后更新：2026-07-06
> 本 README 由 AI 工作区自动生成，供阅读者快速理解仓库上下文与文件用途。
