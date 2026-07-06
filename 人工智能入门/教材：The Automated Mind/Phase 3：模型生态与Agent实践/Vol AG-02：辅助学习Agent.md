> **👨‍🏫 教授说**
> 前置条件：AG-01 模型基础概念
> 概念阶梯：Agent框架（★）→ 工具调用（★★）→ 记忆机制（★★★）
>
> **🧑‍💻 TA说**
> 动手入口 → 先跑起来：无配套实验，参考以下伪代码理解Agent框架：
> ```python
> # 辅助学习Agent伪代码
> class LearningAgent:
>     def __init__(self, model, memory):
>         self.model = model
>         self.memory = memory
>         self.tools = {"search": search_papers, "summarize": summarize_text}
>
>     def run(self, task):
>         context = self.memory.recall(task)
>         plan = self.model.plan(task, context)
>         for step in plan:
>             result = self.tools[step.tool](step.params)
>             self.memory.store(step, result)
>         return self.model.synthesize(plan, self.memory)
> ```
>
> **🧑‍💻 TA说**
> 我做Agent时最深刻的教训是——不要把Agent做成"黑盒调度器"。好的Agent应该是"透明协作者"：每一步决策都向用户暴露，用户可以干预、撤回、重定向。信任来自透明。

---

# Vol AG-02：辅助学习Agent

## 开章

在所有的Agent应用中，**辅助学习**是最直接也最深远的场景——不是因为AI"代替"学习，而是因为AI重新定义了学习的带宽。

过去，一个研究者要写一篇文献综述，需要花两周读30篇论文。今天，Agent可以在两小时内完成初稿。但问题不在于"快"，而在于：**Agent帮你扫清了信息检索和格式编排的噪声，让你把精力集中在真正的思考上**。

这一卷覆盖五个核心场景：论文写作、课题设计、实验复现、知识体系构建、知识库数据库应用。

---

## 2.1 论文写作Agent

### 架构流程

```
用户输入课题方向
  → Agent检索学术文献（arXiv / Semantic Scholar / Google Scholar API）
  → 提取核心论点和实验数据
  → 生成综述大纲（含分类结构）
  → 用户反馈修改
  → 逐段精炼写作
  → 格式排版（LaTeX / Markdown / DOCX）
```

### 关键组件

| 组件 | 技术选型 | 对应教材知识 |
|------|----------|-------------|
| 文献检索 | 语义Embedding + 关键词混合检索 | [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射\|Vol 03]] |
| 上下文管理 | RAG管道 + 窗口滑动 | [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 04：RAG与知识图谱\|Vol 04]] |
| 推理引擎 | 推理模型（如DeepSeek-R1 / o3） | ← [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-01：AI模型全景与选型\|Vol AG-01]] |
| 格式引擎 | Pandoc / LaTeX编译 | 传统工程工具 |

### 实践案例

> **输入**："请帮我写一篇关于LoRA微调方法的文献综述"
>
> **Agent执行**：
> 1. 搜索arXiv + Semantic Scholar → 返回Top-30相关论文
> 2. 提取方法分类（AdaLoRA / DoRA / QLoRA / PiSSA）
> 3. 对比实验数据（各方法在LLaMA上的微调效果）
> 4. 生成结构化大纲（引言→方法分类→实验对比→未来方向）
> 5. 逐段生成 + 用户确认 → 输出LaTeX格式

### 能力边界

- ✅ 有明确方法分类和实验数据的综述 → 高质量
- ⚠️ 需要原创性理论贡献的论文 → 需人工主导
- ❌ 需要一手实验来验证新假设 → Agent定位为"协作者"

> **🧑‍💻 TA说**
> Function Calling的精髓不在"调API"，而在"描述API"。一个好的工具描述能让模型正确调用，差的描述即使顶级模型也会翻车。我在mcp-servers项目里反复打磨描述文本——这跟写好的prompt一样重要。

---

## 2.2 课题设计Agent

### 架构流程

```
模糊研究想法
  → Agent用LLM做问题拆解与形式化
  → 搜索相关领域（论文+专利+开源项目）
  → 推荐实验方案与基线方法
  → 评估资源需求（GPU/数据量/时间）
  → 输出可执行的研究计划
```

### 关键约束

| 约束维度 | Agent执行方式 |
|----------|-------------|
| **可行性评估** | "这个想法在当前GPU上能否跑通？"→ 估算模型参数量+显存 |
| **新颖性检测** | "这个方法是否已被发表？"→ 语义查重+论文检索 |
| **资源预算** | "需要多少数据标注？多少卡时？"→ 基于baseline推算 |

### 实践案例

> **输入**："我有个想法——把LoRA和MoE结合起来做高效微调"
>
> **Agent执行**：
> 1. 搜索"LoRA MoE efficient fine-tuning" → 发现已有相关工作(MoRA, MoELoRA)
> 2. 对比现有方法的不足 → 找到研究缝隙
> 3. 推荐实验方案：在4个基准数据集上对比4种方法
> 4. 估算资源：1张A100 × 3天 ≈ $150
> 5. 输出研究计划书

---

## 2.3 实验复现Agent

这是最具工程挑战性的场景。Agent需要：

1. **理解论文数学描述** → 提取核心公式和算法伪代码
2. **识别关键实现细节** → 超参数、数据预处理、评估指标
3. **生成可执行代码骨架** → PyTorch/TensorFlow实现
4. **配置环境依赖** → conda/pip + CUDA版本
5. **运行验证** → 与论文结果对比
6. **差异分析** → 如果复现结果不一致，定位原因

### 当前能力评估

- 有明确数学公式+伪代码的论文 → 成功率约60-70%
- 描述模糊的工程实现 → 需人工介入
- 主要是数据预处理细节描述不清的 → 可自动补全但需确认

---

## 2.4 知识体系构建Agent

### 架构流程

```
收集散乱文档
  → 文档解析（OCR / 排版还原 / 格式转换）
  → 分块（Chunking，最优粒度≈256 tokens）
  → Embedding编码 → [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射|Vol 03]]
  → 向量存储 → 索引构建（HNSW / IVF）
  → 质量评估（覆盖率 / 冗余度 / 检索命中率）
  → 自动更新与维护
```

### 关键指标

| 指标 | 目标值 |
|------|--------|
| 检索命中率（Recall@10） | >90% |
| 平均检索响应时间 | <200ms |
| 知识库覆盖度 | 可量化衡量 |
| 冗余文档率 | <5% |

### 应用场景

- 企业内部知识库（HR手册、技术文档、产品规格）
- 个人知识管理（笔记、读书笔记、项目文档）
- 学术文献库（领域论文集合、实验记录）

---

## 2.5 知识库数据库Agent

### 智能客服Agent

```
用户消息 → 意图分类（小模型 <1ms）
  → 知识库检索（向量数据库 <100ms）
  → LLM生成回答（含引用链 <2s）
  → 置信度 <0.7 时转人工兜底
```

**关键指标**：自动解决率>70%，平均响应<3s，人工转接率<30%，满意度>4.0/5.0

### 数据库查询Agent（NL2SQL）

```
自然语言问题 → LLM解析为SQL → 数据库执行 → 结果解释
```

**常见挑战**：表结构复杂时的Schema理解、多表JOIN的歧义消除、聚合函数使用错误

---

## 章节小结

辅助学习Agent不是"让AI替你学"，而是让AI成为你认知的扩展——检索速度扩展信息带宽、推理能力打破思维盲区、自动化减轻重复劳动。每一个场景背后，都依赖[[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-01：AI模型全景与选型|Vol AG-01]]的模型选型决策和[[教材：The Automated Mind/Phase 1：秩序的底座/Vol 01：C++与算力剥削|Vol 01]]-[[教材：The Automated Mind/Phase 1：秩序的底座/Vol 02：多维数据结构|Vol 02]]的底层计算支撑。

---

**→ 相关降维概念：** [[手册：核心概念降维缓存/Concept明细/Concept_06：图书馆管理员|Concept_06：图书馆管理员 (RAG)]] · [[手册：核心概念降维缓存/Concept明细/Concept_07：搭建乐高|Concept_07：搭建乐高 (Agent编排)]]

→ [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-03：工程项目构建Agent|下一章：Vol AG-03 工程项目构建Agent]]
