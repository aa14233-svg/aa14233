> **👨‍🏫 教授说**
> 前置条件：Phase 2（Embedding/RAG/多模态）
> 概念阶梯：模型分类（★）→ 模型选型维度（★★）→ 精度/速度trade-off（★★★）
>
> **🧑‍💻 TA说**
> 动手入口 → 先跑起来：`python "e:\trae work\人工智能入门\配套实验\labs\vol_ag01_model_selection\model_benchmark.py"`

---

# Vol AG-01：AI模型全景与选型

## 开章

在动手搭建任何Agent之前，你必须先回答一个根本问题：**该用哪个模型？**

市面上有几百个模型名字——GPT-4o、Claude 4、Gemini 2.5、Qwen3、DeepSeek-R1、Llama 4……每个都说自己"最强"。但真正的答案不取决于排行榜，而取决于你的**任务类型、部署约束、成本预算和隐私要求**。

这一卷不是厂商广告，而是一张**模型生态的作战地图**——知道什么任务该用什么模型、为什么这个模型擅长而另一个不擅长、以及它们的训练方式和来源。

---

## 1.1 模型分类体系

| 类别 | 核心能力 | 代表场景 | 理解要点 |
|------|----------|----------|----------|
| **推理模型** | 链式思考、逻辑推导、数学证明 | 代码生成、数学竞赛、科学推理 | 本质是将"思考过程"作为Token序列输出，通过CoT/self-consistency增强可靠性 |
| **语义/语言模型** | 自然语言理解与生成 | 对话、翻译、摘要、写作 | 压缩了人类文本语料的概率分布，核心是"下一个Token预测" |
| **视觉模型** | 图像识别、检测、分割、生成 | 自动驾驶感知、医疗影像、图像编辑 | 从CNN到ViT的范式转换，核心是对空间结构的层次化抽象 |
| **多模态模型** | 跨模态理解与生成 | 图文问答、视频理解、图像生成 | 关键是模态对齐（Alignment），在共享嵌入空间中找到映射 → [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射|Vol 03]] |
| **代码模型** | 代码生成、理解、修复 | 编程辅助、自动化测试 | 代码的"双模态"本质——既是文本又是可执行逻辑 |
| **音频模型** | 语音识别、合成、音乐生成 | 语音助手、TTS、音频编辑 | 时间序列上的Token化，与文本模态的编解码桥接 |
| **Embedding模型** | 语义向量化 | 检索、聚类、RAG | 将离散语义映射到稠密向量空间的核心基础设施 → [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射|Vol 03]] |
| **端侧/小模型** | 低资源推理 | 手机、IoT、浏览器 | 量化、蒸馏、剪枝——用精度换速度的工程艺术 |

---

## 1.2 前沿大模型厂商矩阵

### 在线模型（Cloud API）

| 厂商 | 旗舰模型 | 特长 | 关键限制 |
|------|----------|------|----------|
| **OpenAI** | GPT-4o / o3 / o4-mini | 多模态融合、推理链稳定性最强 | 数据隐私需企业合规层，成本偏高 |
| **Anthropic** | Claude 4 / Claude 3.5 Sonnet | 长上下文(200K+)、安全对齐、代码生成 | 多模态能力弱于GPT-4o |
| **Google DeepMind** | Gemini 2.0 / Gemini 2.5 Pro | 超长上下文(1M+)、YouTube生态整合 | 中文语料稳定性有波动 |
| **DeepSeek** | DeepSeek-V3 / DeepSeek-R1 | 推理链透明、数学证明强、成本极低（约OpenAI 1/10） | 多模态尚在迭代 |
| **Meta** | Llama 4（通过Together/Bedrock分发） | 开源授权最宽松、社区生态最大 | 非自有API，依赖第三方托管 |
| **Mistral AI** | Mistral Large 2 / Pixtral | 多语言（尤其欧洲语系）、端侧优化 | 中文能力偏弱 |
| **阿里云** | Qwen3 / Qwen2.5-VL / Qwen-Audio | 中文旗舰、多模态全覆盖、开源生态 | 国际合规路径受限 |
| **字节跳动** | Doubao / 豆包Pro | 中文对话体验、娱乐场景、低延迟 | 复杂推理弱于DeepSeek |
| **百度** | ERNIE 4.5 / ERNIE Speed | 中文搜索增强、企业知识库集成 | 开源生态弱 |
| **智谱AI** | GLM-5 / GLM-4V | 中英双语学术、Agent框架对齐 | 国际影响力有限 |
| **月之暗面** | Kimi K2 | 超长上下文(2M+)、文件分析 | 多模态能力有限 |
| **01.AI（零一万物）** | Yi-Lightning / Yi-VL | 中文性价比高、长上下文 | 生态建设早期 |
| **Anthropic (Claude Code)** | Claude 3.5 Sonnet CLI | 终端内Agent式编程 | 仅限编码场景 |

### 本地部署模型（Local / Self-hosted）

| 模型 | 参数量 | 量化后需求 | 特长 | 部署推荐 |
|------|--------|-----------|------|----------|
| **Llama 4** | 17B / 70B | 16GB+ VRAM (8bit) | 通用、宽松许可、社区最大 | ollama / vLLM |
| **Qwen2.5** | 0.5B~72B | 8GB (4bit 14B) | 中文最优、多尺寸梯度完整 | ollama / llama.cpp |
| **DeepSeek-R1 (distill)** | 1.5B~70B | 6GB (4bit 7B) | 推理透明、数学强 | ollama / llama.cpp |
| **Mistral 7B / Mixtral 8x7B** | 7B / 46B MoE | 8GB (4bit 7B) | 多语言、MoE架构高效 | vLLM / llama.cpp |
| **Gemma 3 (Google)** | 2B~27B | 4GB~12GB | Google官方、PyTorch原生 | transformers / ollama |
| **Phi-4 (Microsoft)** | 14B | 8GB (4bit) | 代码与数学推理突出 | ollama / ONNX |
| **Qwen2.5-Coder** | 1.5B~32B | 8GB (4bit 14B) | 代码生成领域最强开源 | ollama / vLLM |
| **BGE-M3 / GTE-Qwen2** | 0.5B~1B | 2GB | Embedding/Sparse/Hybrid检索 | FlagEmbedding |
| **Stable Diffusion 3.5** | 2.6B~8B | 8GB+ | 文生图 | ComfyUI / diffusers |
| **FLUX.1** | 12B | 12GB+ | 文生图质量最强开源 | ComfyUI |
| **Whisper large-v3** | 1.5B | 4GB | 多语言语音识别最成熟 | whisper.cpp / faster-whisper |

---

## 1.3 训练范式：模型是怎么来的

```
预训练 (Pre-training)
    ↓ 在海量语料上学习语言/视觉的统计规律
指令微调 (SFT)
    ↓ 在高质量指令对数据上对齐"指令→回答"格式
偏好对齐 (RLHF / DPO / KTO / GRPO)
    ↓ 让模型学会"什么该说、什么不该说"
持续微调 (Continual Pre-training)
    ↓ 注入领域知识（法律、医学、代码）
```

**关键理解**：
- **预训练**决定模型的"知识面"有多广（参数量的意义在此——在TB级语料上做"填空预测"任务，模型被动记住了文本中的统计规律）
- **SFT**决定模型"听不听得懂指令"（数据质量比数量重要）
- **RLHF/DPO**决定模型"输出是否符合人类偏好"（安全与价值观在此注入——通过人类对多个输出的排序反馈来微调模型偏好）
- **持续微调**决定模型"在特定领域是否专业"

---

## 1.4 模型获取来源

| 渠道 | 定位 | 特点 |
|------|------|------|
| **HuggingFace** | 全球最大模型仓库 | 几乎所有开源模型的第一发布地，社区最活跃 |
| **ModelScope（魔搭）** | 阿里旗下中文模型社区 | 中文模型聚集地，国内访问速度快 |
| **Ollama Library** | 一键本地部署 | 自动量化+命令行启动，开发者首选 |
| **GGUF社区（llama.cpp）** | CPU推理格式 | 量化后可在无GPU机器上运行 |
| **vLLM / TGI** | 高性能推理服务 | 生产环境部署，支持Continuous Batching |

---

## 1.5 模型选型决策框架

当你要为Agent选择一个模型时，按以下顺序做决策：

```
Q1: 任务类型？
    → 文本对话/写作 → 语义模型
    → 数学/逻辑推理 → 推理模型
    → 看懂图片 → 视觉/多模态模型
    → 听懂声音 → 音频模型
    → 代码生成 → 代码模型
    → 做检索 → Embedding模型

Q2: 数据是否可出域？
    → 不可出域（隐私敏感）→ 本地模型
    → 可出域 → 在线模型

Q3: 延迟要求？
    → 实时交互（<500ms）→ 小模型 / 端侧模型
    → 准实时（1-5s）→ 在线LLM
    → 批量处理 → 大模型 + 推理优化

Q4: 成本预算？
    → 零成本 → 本地开源模型
    → 有限 → DeepSeek / Qwen API
    → 充裕 → GPT-4o / Claude 4
```

> **🧑‍💻 TA说**
> 选模型就像选工具——锤子螺丝刀各有用途。我在X-Plore的300+仓库里筛选时，核心原则是：先看任务再看模型，不要被"最强模型"绑架。很多场景7B模型比70B更好用（更快、更便宜、更容易部署）。
>
> **🧑‍💻 TA说**
> 推理速度不是只看模型大小。量化（INT4/INT8）、推测解码（Speculative Decoding）、KV Cache优化——每个都能带来2-5倍的加速。理解这些工程手段比追求参数量更有实际价值。

---

**→ 相关降维概念：** [[手册：核心概念降维缓存/Concept明细/Concept_06：图书馆管理员|Concept_06：图书馆管理员 (RAG)]] · [[手册：核心概念降维缓存/Concept明细/Concept_07：搭建乐高|Concept_07：搭建乐高 (Agent编排)]]

→ [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-02：辅助学习Agent|下一章：Vol AG-02 辅助学习Agent]]
