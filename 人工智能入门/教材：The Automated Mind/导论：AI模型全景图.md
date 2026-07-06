# 导论：AI模型全景图

在进入第一个Volume之前，你需要先理解今天手中的工具到底是什么。

## 1.1 模型分类体系

| 类别 | 核心能力 | 代表场景 | 理解要点 |
|------|----------|----------|----------|
| **推理模型** | 链式思考、逻辑推导、数学证明 | 代码生成、数学竞赛 | 本质是将"思考过程"作为Token序列生成 |
| **语义/语言模型** | 自然语言理解与生成 | 对话、翻译、摘要 | 压缩了人类文本语料的概率分布（"学习语言的统计规律——'我→爱→你'的概率远高于'我→吃→桌子'"） |
| **视觉模型** | 图像识别、检测、分割、生成 | 自动驾驶、医疗影像 | 从CNN到ViT的范式转换 |
| **多模态模型** | 跨模态理解与生成 | 图文问答、视频理解 | 关键是模态对齐（Alignment，让文本"猫"和图片中的猫对应到向量空间中的相近位置） |
| **音频模型** | 语音识别、合成、音乐生成 | 语音助手、TTS | 时间序列上的Token化（把连续的声音信号切成离散片段，像文字分词一样处理） |
| **代码模型** | 代码生成、理解、修复 | 编程辅助、自动化测试 | 代码的"双模态"本质 |
| **Embedding模型** | 语义向量化 | 检索、聚类、RAG | → 参见[[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射|Vol 03：Embedding映射]] |
| **端侧/小模型** | 低资源推理 | 手机、IoT | 量化、蒸馏、剪枝 |

## 1.2 前沿大模型厂商矩阵

**在线模型**：

| 厂商 | 旗舰模型 | 特长 |
|------|----------|------|
| OpenAI | GPT-4o / o3 / o4-mini | 多模态融合、推理链稳定 |
| Anthropic | Claude 4 / Claude 3.5 Sonnet | 长上下文200K+、安全对齐 |
| Google DeepMind | Gemini 2.0 / 2.5 Pro | 超长上下文1M+、YouTube整合 |
| DeepSeek | DeepSeek-V3 / R1 | 推理链透明、成本极低 |
| 阿里云 | Qwen3 / Qwen2.5-VL | 中文旗舰、多模态、开源 |
| 字节跳动 | Doubao / 豆包Pro | 中文对话、低延迟 |
| 智谱AI | GLM-5 / GLM-4V | 中英双语学术、Agent框架 |
| 月之暗面 | Kimi K2 | 超长上下文2M+ |

**本地部署模型**：

| 模型 | 参数量 | 量化后需求 | 特长 |
|------|--------|-----------|------|
| Llama 4 | 17B/70B | 16GB+ VRAM | 通用、宽松许可 |
| Qwen2.5 | 0.5B~72B | 8GB (4bit 14B) | 中文优异 |
| DeepSeek-R1 distill | 1.5B~70B | 6GB (4bit 7B) | 推理透明 |
| Mistral/Mixtral | 7B/46B MoE | 8GB | 多语言、MoE高效 |
| Phi-4 (MS) | 14B | 8GB | 代码与数学 |
| SD 3.5 | 2.6B~8B | 8GB+ | 文生图 |
| Whisper large-v3 | 1.5B | 4GB | 多语言语音识别 |

## 1.3 Agent应用总览

Agent是一个**感知→推理→行动→观察**的控制循环。本书实践章节坐标：

下表汇总了所有Agent实战内容的分布。**Phase 3是专门的Agent应用实战模块**，从模型选型到四个核心场景全面展开。

| 领域 | 典型应用 | 核心章节 | 扩展补充章节 |
|------|----------|----------|-------------|
| **智能编排** | 持久记忆、缓存、Token优化、Task Graph | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-06：Agent持久记忆与智能编排\|Vol AG-06]] | [[教材：The Automated Mind/Phase 4：深水区与几何/Vol 05：智能体记忆(Alaya)\|Vol 05（记忆原理）]] |
| **本地化部署** | 推理引擎、量化、OS原理、蒸馏 | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-05：本地化部署与蒸馏实战\|Vol AG-05]] | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol 08：Agent部署\|Vol 08（部署原理）]] · [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol 08.5：AI工程项目实战\|Vol 08.5（进阶篇）]] |
| **模型全景与选型** | 所有Agent的基础 | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-01：AI模型全景与选型\|Vol AG-01]] | — |
| **辅助学习** | 论文写作、课题设计、实验复现 | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-02：辅助学习Agent\|Vol AG-02]] | [[教材：The Automated Mind/Phase 1：秩序的底座/Vol 02.5：AI辅助学习与知识体系构建\|Vol 02.5（基础篇）]] |
| **工程项目构建** | 应用/插件/网页、多模态生成、客服 | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-03：工程项目构建Agent\|Vol AG-03]] | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol 08.5：AI工程项目实战\|Vol 08.5（进阶篇）]] |
| **具身智能** | 机器人控制、IoT、端侧部署 | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-04：具身智能与感官AI\|Vol AG-04]] | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol 08：Agent部署\|Vol 08（部署原理）]] |
| **感官AI** | 视觉/音频模型应用、数据库管理 | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-04：具身智能与感官AI\|Vol AG-04 §4.3-4.5]] | [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 04.5：多模态感知与生成应用\|Vol 04.5（原理篇）]] |
| **知识工程** | 知识库构建、RAG、图数据库 | [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 04：RAG与知识图谱\|Vol 04]] | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-02：辅助学习Agent\|Vol AG-02 §2.4-2.5]] |
| **Agent编排** | ReAct、FSM、异步并发 | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol 08：Agent部署\|Vol 08]] | [[教材：The Automated Mind/Phase 5：规则重塑/Vol 07：数字城邦秩序(Neuro-Symbolic)\|Vol 07（符号约束）]] |

**Phase 3 完整路线：** [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-01：AI模型全景与选型|AG-01 模型谱系]] → [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-02：辅助学习Agent|AG-02 学习场景]] → [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-03：工程项目构建Agent|AG-03 工程场景]] → [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-04：具身智能与感官AI|AG-04 物理世界]] → [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-05：本地化部署与蒸馏实战|AG-05 本地部署]] → [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-06：Agent持久记忆与智能编排|AG-06 记忆编排]]

---

## 1.4 阅读路线图

本书按 **Phase 编号** 组织，但你不必线性阅读：

```
Phase 1：秩序的底座      ← 底层基础（C++/数据结构）
    ↓
Phase 2：语义空间与认知具象  ← 理解AI在做什么（Embedding/RAG/多模态）
    ↓
Phase 3：模型生态与Agent实践 ← 上手搭建（模型选型/Agent/部署）
    ↓
Phase 4：深水区与几何    ← 深入理论（记忆/流形/内核/拓扑）
    ↓
Phase 5：规则重塑        ← 前沿话题（Neuro-Symbolic/可解释性/密码学）
```

**建议路径**：
- **工程优先路线**：Phase 1 → 2 → 3，上手做项目后再回来看Phase 4-5
- **理论优先路线**：Phase 1 → 2 → 4 → 5，最后看Phase 3应用
- **跳跃路线**：每个Volume都有前置条件标注，可根据兴趣直接跳

→ [[教材：The Automated Mind/前言|← 前言]] | [[教材：The Automated Mind/Phase 1：秩序的底座/Vol 01：C++与算力剥削|→ 进入 Phase 1 — Vol 01]] | [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-01：AI模型全景与选型|→ 跳到模型全景 → Vol AG-01]]

