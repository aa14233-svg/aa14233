> **👨‍🏫 教授说**
> 前置条件：AG-02, AG-03
> 概念阶梯：记忆类型（★）→ 检索策略（★★）→ 长程编排（★★★）
>
> **🧑‍💻 TA说**
> 动手入口 → 先跑起来：无配套实验。以下是一个简易持久记忆实现框架：
> ```python
> class PersistentMemory:
>     def __init__(self):
>         self.short_term = deque(maxlen=10)  # 短期缓存
>         self.summary = ""                    # 中期摘要
>         self.knowledge_graph = {}            # 长期知识图谱
>
>     def add(self, experience):
>         self.short_term.append(experience)
>         if len(self.short_term) == 10:
>             self.summary = summarize(self.short_term)
>             extract_triples(self.summary, self.knowledge_graph)
> ```
>
> **🧑‍💻 TA说**
> 持久记忆不是"把对话历史存进数据库"那么简单。关键问题是：哪些信息值得记住？多久过期？怎么在需要时精确召回？我在mem0-mcp的实现里用了三层过滤：短期缓存→中期摘要→长期知识图谱。

---

# Vol AG-06：Agent持久记忆与智能编排

## 开章

前五卷解决了"用什么模型、在什么场景、怎么部署"的问题。但部署一个Agent和让它**越用越聪明**是两回事。

真实世界的Agent面临四个致命问题：

- **记忆休克**：每次对话都是新的，昨天修正过的错误今天又犯
- **缓存盲区**：相同的向量查询每次都重新计算，Token和算力全浪费
- **任务迷失**：用户说"改一下那个功能"，Agent不知道"那个"指的是哪个
- **上下文通胀**：10轮对话后上下文50%是重复信息，有效推理被稀释

这一卷的核心解法：**把Agent从"无状态函数"改造为"有状态系统"**——持久记忆 + 智能缓存 + Code Graph式任务理解。

---

## 6.1 四层记忆架构

Agent的记忆不是一个存储，是一套分层系统：

```
┌─────────────────────────────────────────┐
│           工作记忆（Working Memory）        │ ← 当前上下文窗口
│        持活性：当前会话 / 容量：<= 上下文长度  │
├─────────────────────────────────────────┤
│           情景记忆（Episodic Memory）       │ ← 近期对话历史
│         持活性：天级 / 容量：向量库 Top-K     │
├─────────────────────────────────────────┤
│           语义记忆（Semantic Memory）       │ ← 长期知识积累
│       持活性：月/年级 / 容量：知识图谱+向量库   │
├─────────────────────────────────────────┤
│           程序记忆（Procedural Memory）      │ ← 工具使用模式
│       持活性：永久 / 容量：函数库+偏好配置      │
└─────────────────────────────────────────┘
```

### 6.1.1 工作记忆——上下文窗口的管理

工作记忆就是LLM的上下文窗口。问题在于：窗口不够大，且"旧的≠不重要的"。

**分层压缩策略：**

```
原始对话（假设 100K tokens）
    │
    ├─ 最近 N 轮（保留完整文本）→ 保持即时响应能力
    ├─ 中间轮次（提取摘要压缩 10x）
    └─ 最早轮次（仅保留事实性三元组）
          │
          ↓
   压缩后上下文 ≈ 30K tokens（节省 70%）
```

**核心算法——重要性评分召回：**

```python
# 上下文窗口管理的核心逻辑
class WorkingMemory:
    def __init__(self, max_tokens=128000):
        self.buffer = []        # (turn_id, text, importance, timestamp)
        self.max_tokens = max_tokens
        self.summary_cache = {} # turn_id → compressed version
    
    def add_turn(self, user_msg, assistant_msg):
        importance = self._score_importance(user_msg, assistant_msg)
        tokens = count_tokens(user_msg) + count_tokens(assistant_msg)
        self.buffer.append((len(self.buffer), f"{user_msg}\n{assistant_msg}", importance, now()))
        
        # 超限时触发压缩
        if sum(t for _, _, _, t in self.buffer) > self.max_tokens * 0.8:
            self._evict_and_compress()
    
    def _score_importance(self, user_msg, assistant_msg):
        """重要性评分信号"""
        score = 0
        if contains_code(user_msg):       score += 3  # 代码段优先保留
        if contains_numeric(user_msg):    score += 2  # 数值/配置
        if is_instruction(user_msg):      score += 2  # 指令性内容
        if has_negative_feedback(msg):    score += 2  # 用户修正反馈
        if is_greeting(user_msg):         score -= 1  # 寒暄降权
        return score
    
    def _evict_and_compress(self):
        # 按重要性排序，低分优先压缩
        self.buffer.sort(key=lambda x: x[2], reverse=True)
        # 保留 Top 30% 原始文本
        keep = self.buffer[:int(len(self.buffer) * 0.3)]
        # 剩余 70% 压缩为摘要
        for item in self.buffer[int(len(self.buffer) * 0.3):]:
            compressed = self._summarize(item[1])
            keep.append((item[0], compressed, item[2] * 0.5, item[3]))
        self.buffer = keep
```

### 6.1.2 情景记忆——跨会话的连续性

情景记忆解决的核心问题：**昨天的对话，今天能用**。

**实现方案——基于 Embedding 的自动检索：**

```
用户新输入
    │
    ▼
Embedding 编码
    │
    ▼
向量库检索（余弦相似度 > 0.85 为命中）
    │
    ├─ 命中 → 提取历史决策/偏好 → 注入系统提示
    │
    └─ 未命中 → 新会话 → 结束时将本轮摘要存入情景记忆库
```

**存储结构：**

```json
{
  "session_id": "2026-07-06-003",
  "timestamp": 1783300000,
  "summary": "用户要求重构项目的数据库连接模块，从 SQLite 迁移到 PostgreSQL",
  "embedding": [0.123, -0.456, ...],
  "key_decisions": [
    "使用 asyncpg 而非 psycopg2",
    "连接池大小设为 20",
    "保留旧接口做兼容层"
  ],
  "user_preferences": {
    "naming_convention": "snake_case",
    "error_handling": "return Result type"
  },
  "artifacts": ["project/db/migration_v2.py"],
  "importance": 0.85
}
```

**关键设计——记忆分级：**

| 级别 | 条件 | 保留期 | 检索优先级 |
|------|------|--------|-----------|
| 临时 | 单轮对话，无关键信息 | 24h | 最低 |
| 普通 | 完成了一个子任务 | 7天 | 低 |
| 重要 | 涉及架构决策/用户偏好 | 30天 | 高 |
| 关键 | 安全配置/认证信息/项目配置 | 永久 | 最高 |

### 6.1.3 语义记忆——知识图谱式长期知识

情景记忆记住"发生过什么"，语义记忆记住"事实是什么"。

**实现方案——实体-关系图：**

```
用户项目的语义记忆示例：

[项目A] ──使用的技术───→ [FastAPI]
[项目A] ──数据库是──────→ [PostgreSQL]
[项目A] ──部署在────────→ [Docker]
[项目A] ──用户偏好──────→ [async/await 风格]
[用户]  ──当前工作项目──→ [项目A]
[用户]  ──常用语言──────→ [Python, TypeScript]
```

**图存储的查询优势：**

| 场景 | 向量检索 | 图检索 | 胜出 |
|------|---------|--------|------|
| "我之前用的数据库是什么？" | 可能匹配到"数据库"但结果模糊 | 直接查[项目A]→[数据库]边 | 图 |
| "类似这个需求的代码片段" | 语义匹配最佳 | 需要遍历多条边 | 向量 |
| "用户上次对ORM的选择偏好" | 需要精确关键词 | [用户]→[偏好ORM]直接命中 | 图 |
| "这个项目的完整技术栈？" | 需多次查询拼接 | [项目A]邻接节点展开即得 | 图 |

**最佳实践：图 + 向量混合检索**

```
用户查询
    │
    ├─ 图检索：精确匹配实体/关系 → 返回结构化事实
    │
    └─ 向量检索：语义相似匹配 → 返回相关文档/代码片段
          │
          ▼
    合并结果 → 去重 → 排序 → 注入上下文
```

### 6.1.4 程序记忆——工具使用模式的固化

程序记忆是Agent的"肌肉记忆"——不用每次重新思考怎么做。

**核心机制——工具调用缓存：**

```python
class ProceduralMemory:
    def __init__(self):
        # key: (tool_name, input_pattern_hash)
        # value: {result, confidence, usage_count}
        self.tool_cache = {}
        self.pattern_library = []
    
    def should_use_cache(self, tool_name, input_args):
        """判断是否可以直接使用缓存结果"""
        pattern = self._extract_pattern(tool_name, input_args)
        
        # 若同一参数组合被调用 > 3 次 → 固化
        if pattern in self.tool_cache:
            entry = self.tool_cache[pattern]
            entry["usage_count"] += 1
            if entry["confidence"] > 0.9:
                return True, entry["result"]  # 跳过 LLM 直接返回
        return False, None
    
    def learn_pattern(self, tool_name, input_args, result):
        """从成功调用中学习模式"""
        pattern = self._extract_pattern(tool_name, input_args)
        if pattern not in self.tool_cache:
            self.tool_cache[pattern] = {
                "result": result,
                "confidence": 0.5,
                "usage_count": 1
            }
        else:
            # 每次成功命中，置信度递增
            entry = self.tool_cache[pattern]
            entry["confidence"] = min(1.0, entry["confidence"] + 0.1)
```

**固化阈值定义：**

| 模式类型 | 固化条件 | 示例 |
|---------|---------|------|
| 固定参数 | 同一参数 > 3次 | 每次都用 `temperature=0.2` 写代码 |
| 流程模板 | 同一操作序列 > 2次 | 每次改代码都先 lint → test → build |
| 错误恢复 | 同一错误处理 > 2次 | API 超时 → 重试 3 次 → 降级 |
| 输出格式 | 用户明确指定 > 1次 | "所有代码输出都要带类型注解" |

---

## 6.2 缓存体系与命中率优化

### 6.2.1 三层缓存架构

```
┌──────────────────────┐
│    L1：语义缓存        │ ← Embedding 相似度匹配
│  命中率目标：40-60%    │   相同/相似查询不重复计算
├──────────────────────┤
│    L2：KV-Cache        │ ← 推理引擎级缓存
│  命中率目标：70-90%    │   前缀相同的请求复用 Attention KV
├──────────────────────┤
│    L3：结果缓存         │ ← 确定性操作缓存
│  命中率目标：95%+      │   相同输入+相同参数 → 直接返回
└──────────────────────┘
```

### 6.2.2 L1 语义缓存——核心实现

语义缓存是Agent特有的缓存层——传统缓存比较key是否相等，语义缓存比较"意思是否相近"。

**实现逻辑：**

```python
class SemanticCache:
    def __init__(self, similarity_threshold=0.92):
        self.entries = []          # [(embedding, response, meta)]
        self.threshold = similarity_threshold
        self.hit_count = 0
        self.miss_count = 0
    
    def query(self, user_input):
        input_emb = embed(user_input)
        
        # 1. 快速预筛选（可选：使用 BM25 或关键词索引缩小范围）
        candidates = self._prefilter(user_input)
        
        # 2. 精确语义匹配
        best_score = 0
        best_entry = None
        for emb, resp, meta in (candidates or self.entries):
            score = cosine_similarity(input_emb, emb)
            if score > best_score:
                best_score = score
                best_entry = (resp, meta)
        
        # 3. 阈值判断
        if best_score >= self.threshold:
            self.hit_count += 1
            return True, best_entry  # 缓存命中
        else:
            self.miss_count += 1
            return False, None
    
    def store(self, user_input, response, meta=None):
        """存入新缓存条目"""
        emb = embed(user_input)
        self.entries.append((emb, response, meta or {}))
        
        # 条目上限控制（LRU 淘汰）
        if len(self.entries) > self.max_entries:
            self._evict_lru()
    
    def hit_rate(self):
        total = self.hit_count + self.miss_count
        return self.hit_count / total if total > 0 else 0
```

**语义缓存 vs 传统缓存：**

| 维度 | 传统缓存（Redis/Memcached） | 语义缓存 |
|------|---------------------------|---------|
| 匹配方式 | key 精确相等 | Embedding 相似度 |
| 适用场景 | 相同请求反复出现 | 相似但不完全相同的请求 |
| 时延 | 亚毫秒 | 5-50ms（含 Embedding 计算） |
| 存储对象 | 序列化字符串 | Embedding 向量 + 响应 |
| 主要成本 | 内存 | Embedding API Token |

**命中率优化策略：**

1. **阈值自适应**：根据业务场景动态调整相似度阈值
   - 代码生成场景 → 阈值 0.95（精确匹配优先）
   - 问答场景 → 阈值 0.85（语义泛化优先）
2. **Embedding 模型专用化**：用 `BGE-M3` 或 `GTE-Qwen2` 替代通用 Embedding，对代码/技术术语的语义区分度更高
3. **Query 重写**：将用户输入标准化后再计算 Embedding（去除停用词、统一术语）

### 6.2.3 L2 KV-Cache——推理引擎级优化

KV-Cache 是 Transformer 推理的内置缓存——计算第 N+1 个 token 时，前 N 个 token 的 Key/Value 矩阵可以复用。

**工程要点：**

```
┌─────────────────────────────────────────┐
│           无 KV-Cache 的推理               │
│  每个 token 重新计算所有前序 token 的注意力    │
│  复杂度：O(n²)                           │
├─────────────────────────────────────────┤
│           有 KV-Cache 的推理               │
│  每个 token 只计算当前 token 的 KV          │
│  复杂度：O(n) 增量 + O(n²) 预热            │
└─────────────────────────────────────────┘
```

**前缀缓存（Prefix Caching）：**

vLLM / TGI 等框架支持 Prefix Caching——如果新请求的前缀和旧请求相同（如共享的 System Prompt），KV-Cache 直接复用。

```
请求1：System + "写一个排序算法"     → 计算 System 部分的 KV
请求2：System + "写一个搜索算法"     → 复用 System 的 KV，只需计算增量
                                     → 节省 30-60% 首 token 延迟
```

**在 Agent 场景中的应用：**

```python
# Agent 工作流中的 KV-Cache 复用
class AgentKVCacheManager:
    def __init__(self):
        self.cached_prefixes = {
            "system_prompt_v1": kv_cache_handle,
            "tool_definitions": kv_cache_handle,
            "user_profile": kv_cache_handle,
        }
    
    def build_prompt(self, user_input):
        # 1. 固定的 System Prompt（缓存命中率最高）
        system = self.cached_prefixes["system_prompt_v1"]
        
        # 2. 工具定义（变化频率低，可缓存）
        tools = self.cached_prefixes["tool_definitions"]
        
        # 3. 记忆注入（变化频率中，部分缓存）
        memories = self.retrieve_memories(user_input)
        
        # 4. 用户输入（不可缓存，每次计算）
        return assemble_prompt(system, tools, memories, user_input)
```

### 6.2.4 L3 结果缓存——确定性操作

对于纯函数式工具调用（数学计算、代码执行、数据查询），结果具有**确定性**——相同输入必定相同输出。这是最高效的缓存层。

```
工具调用流程：
1. 检查 L3 缓存 → 命中 → 直接返回（0ms 延迟）
2. 未命中 → 执行工具 → 存入 L3 → 返回

命中率预估：
  - 代码编译结果：同一段代码 → 100% 命中
  - 数学计算：相同表达式 → 100% 命中  
  - 数据查询：相同 SQL + 相同数据 → 100% 命中
  - LLM 生成：相同 prompt（temperature=0）→ ~70% 命中
  - LLM 生成：相同 prompt（temperature>0）→ 不可缓存
```

---

## 6.3 Token 节省策略全景

### 6.3.1 三层压缩体系

| 层级 | 方法 | 压缩比 | 质量损失 | 实现复杂度 |
|------|------|--------|---------|-----------|
| L1 | 结构化输出（JSON/YAML 替代自然语言） | 3-5x | 低 | 低 |
| L2 | 对话摘要（LLM 压缩历史） | 5-10x | 中 | 中 |
| L3 | 选择性遗忘（Drop 低重要性上下文） | 10-20x | 高 | 高 |

### 6.3.2 L1：结构化输出

**反直觉事实：用 token 更多的 JSON 替代自然语言，实际更省 Token。**

因为 LLM 理解结构化数据需要的推理 token 比理解散文少（结构化降低了 LLM 的概率熵）。

```json
// ❌ 自然语言描述（~80 tokens）
"用户要求我把项目中的数据库从 SQLite 切换到 PostgreSQL，使用 asyncpg 库，
连接池设置为 20，并且保留旧的接口作为兼容层。他还提到错误处理要使用
Result 类型而不是抛出异常。"

// ✅ 结构化描述（~45 tokens + 推理节省 ~30%）
{
  "task": "db_migration",
  "from": "SQLite",
  "to": "PostgreSQL",
  "driver": "asyncpg",
  "pool_size": 20,
  "compat_layer": true,
  "error_handling": "Result type"
}
```

**在 Agent 上下文中的具体应用：**

- 工具调用结果 → 用 JSON 压缩而非自然语言描述
- 记忆检索结果 → 用表格形式而非段落
- 用户偏好 → 存为键值对而非句子

### 6.3.3 L2：对话摘要

**增量摘要（Incremental Summarization）：**

```
第 N 轮对话结束后的摘要更新流程：

旧摘要（S_old）："用户正在开发一个 Markdown 编辑器"
    +
本轮新增内容（D_new）："用户决定使用 CodeMirror 作为编辑器内核"
    │
    ▼
LLM 合并生成新摘要（S_new）："用户开发 Markdown 编辑器，内核选 CodeMirror"
    │
    ▼
S_old → 可丢弃（节省其原始 token）
S_new → 进入上下文
```

**压缩比实测数据：**

| 对话长度 | 原始 Token | 摘要 Token | 压缩比 |
|---------|-----------|-----------|--------|
| 5 轮 | 3,000 | 600 | 5x |
| 20 轮 | 15,000 | 1,200 | 12.5x |
| 50 轮 | 40,000 | 2,000 | 20x |

### 6.3.4 L3：选择性遗忘

不是所有信息都值得保留。定义**遗忘优先级**：

```
低优先级（优先遗忘）：
  - 问候/寒暄
  - 重复确认
  - 错误尝试记录（仅保留最终成功的）
  - 用户临时输入的文件内容（保留路径即可）

中优先级：
  - 中间推理步骤（保留结论即可）
  - 调试日志（仅保留关键错误行）
  - 已执行的代码（保留结果签名即可）

高优先级（强制保留）：
  - 用户明确指定的约束
  - 架构决策
  - 安全相关配置
  - 未完成的子任务状态
```

**Token 节省预算分配：**

```python
class TokenBudget:
    def __init__(self, total_budget=128000):
        self.budget = {
            "system_prompt":    4000,   # 3%
            "tool_definitions": 8000,   # 6%
            "user_input":       16000,  # 12%
            "memories":         20000,  # 15%
            "conversation":     40000,  # 31%（可压缩）
            "reasoning_scratchpad": 40000, # 31%
        }
    
    def allocate(self, priority_events):
        """动态调整预算分配"""
        # 如果当前有重要任务，给 reasoning 更多预算
        if self._has_active_complex_task():
            self.budget["reasoning_scratchpad"] = 50000
            self.budget["conversation"] = 30000  # 压缩对话
```

---

## 6.4 Code Graph 式任务理解

### 6.4.1 什么是 Code Graph

Code Graph（代码图谱）不是指代码知识图谱，而是指**对代码库进行静态分析，构建出函数/类/模块之间的调用依赖关系图，从而让 LLM 理解代码结构**。代表工具：`RepoGraph`、`Code2Vec` 的依赖分析变体、`Sourcegraph` 的上下文引擎。

**核心原理：**

```
原始代码：
  def A(): B()
  def B(): C()
  def C(): ...
  
    ↓ 静态分析 ↓
    
依赖图：
  A ──调用──→ B ──调用──→ C
  
    ↓ 注入 LLM 上下文 ↓
    
LLM 现在理解："A 依赖 B，B 依赖 C，改 A 时要考虑整条链"
```

### 6.4.2 从 Code Graph 到 Task Graph

将 Code Graph 的思路应用到**任务理解**上——用户的工程需求就是一个"代码库"，需求中的每个子任务就是"函数"，它们的依赖关系就是"调用链"。

**Task Graph 构建流程：**

```
用户输入："帮我写一个 REST API，用户注册后发送欢迎邮件"
    │
    ▼
Step 1：需求解析（LLM 将自然语言拆解为原子任务节点）
    │
    ├─ Task_A: 用户注册接口 (POST /register)
    ├─ Task_B: 邮箱格式验证
    ├─ Task_C: 密码哈希存储
    ├─ Task_D: 生成欢迎邮件模板
    ├─ Task_E: 调用 SMTP 发送邮件
    └─ Task_F: 错误处理与重试
    │
    ▼
Step 2：依赖分析（识别节点间依赖关系）
    │
    ├─ Task_A 依赖 Task_B, Task_C  (注册前先验证+哈希)
    ├─ Task_D, Task_E 依赖 Task_A   (发送邮件在注册之后)
    └─ Task_F 依赖 Task_E           (发送失败需要重试)
    │
    ▼
Step 3：Task Graph 构建
    │
    ┌──────────────────────────┐
    │  Task_B (验证) ──┐       │
    │                  ├──→ Task_A (注册) ──→ Task_D (模板) ──→ Task_E (发送) ──→ Task_F (重试)│
    │  Task_C (哈希) ──┘       │
    └──────────────────────────┘
    │
    ▼
Step 4：执行编排（按拓扑序执行）
    1. Task_B + Task_C（可并行）
    2. Task_A（依赖就绪）
    3. Task_D + Task_E（依赖就绪，可并行）
    4. Task_F（依赖就绪）
```

### 6.4.3 Task Graph 数据结构

```python
@dataclass
class TaskNode:
    id: str                      # 唯一标识
    description: str             # 任务描述
    dependencies: list[str]      # 依赖的 Task ID 列表
    status: str = "pending"      # pending | ready | running | done | failed
    priority: int = 0            # 优先级（0-10）
    estimated_tokens: int = 0    # 预计消耗 Token
    artifacts: list[str] = None  # 产出物路径
    
class TaskGraph:
    def __init__(self):
        self.nodes: dict[str, TaskNode] = {}
        self.execution_history: list = []
    
    def from_user_requirement(self, user_input: str, llm) -> "TaskGraph":
        """LLM 将用户需求解析为 Task Graph"""
        analysis = llm.infer(f"""
        分析以下需求，拆解为原子任务节点，并识别依赖关系。
        输出格式：JSON 数组 [{{
            "id": "A",
            "description": "...",
            "depends_on": ["B", "C"],
            "priority": 5
        }}]
        
        需求：{user_input}
        """)
        self.nodes = {n["id"]: TaskNode(**n) for n in json.loads(analysis)}
        return self
    
    def get_ready_tasks(self) -> list[TaskNode]:
        """返回所有依赖已就绪的任务"""
        return [
            n for n in self.nodes.values()
            if n.status == "pending" and
            all(self.nodes[d].status == "done" for d in n.dependencies)
        ]
    
    def topological_execute(self, agent):
        """按拓扑序执行任务"""
        while pending := self.get_ready_tasks():
            for task in pending:
                task.status = "running"
                result = agent.execute(task.description)
                task.status = "done"
                task.artifacts = result
                self.execution_history.append(task)
```

### 6.4.4 Task Graph 对缓存的赋能

这是最巧妙的部分：**Task Graph 的节点 ID 可以作为缓存的 Key**。

```
传统缓存模式：
  用户输入（每次不同）→ Embedding → 语义匹配（O(n)）

Task Graph 缓存模式：
  用户输入 → 解析为 Task Graph（结构化的标准节点）
  → 节点 ID 作为缓存 Key → O(1) 精确命中
```

**示例：**

```python
# 同一个 Task 在不同时间的缓存命中
# 第一次：用户说"实现用户注册接口"
task_graph = TaskGraph.from_user_requirement("实现用户注册接口")
# → 解析出节点：["user_registration", "password_hashing", "input_validation"]

# 缓存节点 "password_hashing" 的代码实现
cache.set("task:password_hashing", code_implementation)

# 第二次：用户说"加一个登录接口，也要密码哈希"
task_graph2 = TaskGraph.from_user_requirement("登录接口，密码哈希")
# → 解析出节点：["user_login", "password_verification", "jwt_generation"]
# 其中 "password_verification" 的依赖技能匹配到 "password_hashing"

# Task Graph 发现依赖相似 → 推荐缓存中的 password_hashing 实现
# 用户只需要微调（验证 vs 哈希），无需从零生成
```

### 6.4.5 增量更新：让 Agent 理解"改了哪里"

Code Graph 的核心优势是**增量理解**——不是每次都重新分析整个代码库，而是只关注**变化部分**。

Task Graph 同样支持增量：

```
全量构建（第一次）：
  需求 → 完整 Task Graph → 全部执行 → 存储 Graph 快照

增量更新（第 N 次）：
  新需求 → 与历史 Task Graph 对比
  → 识别已完成的节点（跳过）
  → 识别修改的节点（重新执行）
  → 识别新增的节点（追加执行）
  → 识别删除的节点（清理相关 artifact）
```

**增量更新实战代码：**

```python
class IncrementalTaskGraph(TaskGraph):
    def __init__(self):
        super().__init__()
        self.snapshot: dict[str, TaskNode] = {}  # 历史快照
    
    def diff_and_merge(self, new_requirement: str, llm):
        """增量解析：只处理变化部分"""
        new_graph = TaskGraph.from_user_requirement(new_requirement, llm)
        
        for node_id, new_node in new_graph.nodes.items():
            if node_id in self.snapshot:
                old_node = self.snapshot[node_id]
                if self._is_unchanged(old_node, new_node):
                    # 跳过直接复用
                    new_node.status = "done"
                    new_node.artifacts = old_node.artifacts
            # 新增节点保持 pending
            
        self.nodes = new_graph.nodes
```

**增量带来的 Token 节省：**

| 迭代次数 | 全量重新解析 | 增量更新 | 节省 |
|---------|------------|---------|------|
| 第1次 | 5,000 tokens | 5,000 tokens | 0% |
| 第2次 | 5,000 tokens | 800 tokens | 84% |
| 第5次 | 5,000 tokens | 400 tokens | 92% |
| 第10次 | 5,000 tokens | 200 tokens | 96% |

---

## 6.5 多模态记忆的统一索引

当 Agent 处理多模态输入（文本 + 图像 + 代码 + 文件），不同模态的记忆需要**统一索引**才能交叉检索。

### 6.5.1 统一 Embedding 空间

```python
class MultimodalMemoryIndex:
    def __init__(self):
        # 不同模态使用不同 Encoder，但映射到同一空间
        self.encoders = {
            "text":  TextEmbedding(),
            "image": VisionEmbedding(),
            "code":  CodeEmbedding(),
            "audio": AudioEmbedding(),
        }
        self.index = VectorDB(dimension=1024)  # 统一索引空间
    
    def store(self, modality, content, metadata):
        emb = self.encoders[modality].encode(content)
        self.index.add(
            embedding=emb,
            metadata={
                "modality": modality,
                "content_preview": str(content)[:200],
                "timestamp": now(),
                **metadata
            }
        )
    
    def cross_modal_search(self, query_text):
        """文本查询 → 跨模态检索"""
        query_emb = self.encoders["text"].encode(query_text)
        results = self.index.search(query_emb, top_k=10)
        
        # 结果中可能包含文本、图片、代码等任何模态
        return [
            r for r in results
            if r.score > 0.80
        ]
```

### 6.5.2 跨模态关联

多模态记忆的真正的价值在于**关联**——看到一段代码时能联想到当时的对话上下文和参考图。

```python
# 存储关联记忆
def store_associated_memory(code_block, conversation, screenshot):
    # 每种模态独立编码但共享 session_id
    session_id = uuid4()
    
    memory_index.store("code", code_block, {
        "session_id": session_id,
        "project": "web-app",
        "description": "用户实现的 OAuth 登录"
    })
    memory_index.store("text", conversation, {
        "session_id": session_id,
        "type": "decision",
        "decision": "使用 Google OAuth 而非自建"
    })
    memory_index.store("image", screenshot, {
        "session_id": session_id,
        "type": "ui_reference"
    })

# 跨模态检索
# 下次用户问 "OAuth 登录怎么写的"
# → 返回代码 + 当时的决策理由 + UI 截图
```

---

## 6.6 完整架构蓝图

将以上所有模块整合为一个**个人 Agent 多模态工作流系统**：

```
┌────────────────────────────────────────────────────────┐
│                    用户输入                               │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│              6.1 工作记忆（上下文窗口管理）                │
│  重要性评分 → 分层压缩 → Token 预算分配                    │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│              6.4 Task Graph（任务理解）                   │
│  需求解析 → 节点拆解 → 依赖分析 → 增量对比                 │
└───────┬────────────────────────────┬───────────────────┘
        │                            │
        ▼                            ▼
┌───────────────────┐   ┌────────────────────────────────┐
│  6.2 缓存体系       │   │  6.1 记忆检索                    │
│  L1 语义缓存        │   │  情景记忆 + 语义记忆 + 程序记忆   │
│  L2 KV-Cache       │   │  图+向量混合检索                  │
│  L3 结果缓存        │   │  跨模态关联                     │
└───────┬───────────┘   └───────────┬────────────────────┘
        │                            │
        ▼                            ▼
┌────────────────────────────────────────────────────────┐
│              6.3 Token 节省层                           │
│  结构化输出 → 增量摘要 → 选择性遗忘                      │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│                  LLM 推理（上下文已优化）                   │
│  输入 Token：未优化 100K → 优化后 35K（节省 65%）         │
│  缓存命中率：L1 55% + L3 90%                            │
│  理解深度：从"猜需求"到"读 Task Graph"                   │
└────────────────────────────────────────────────────────┘
```

**数据流时序：**

```
1. 用户输入到达
2. 工作记忆注入历史上下文 + 用户偏好
3. Task Graph 解析需求，识别依赖链
4. 缓存查询（L1 → L2 → L3）
5. 记忆检索（情景 + 语义 + 程序）
6. 所有信息压缩后组装为最终 prompt
7. LLM 推理
8. 结果写入缓存 + 情景记忆更新
9. Task Graph 标记完成节点
10. Token 用量统计，调整预算
```

---

## 章节小结

| 模块 | 核心概念 | 关键收益 |
|------|---------|---------|
| 四层记忆 | 工作/情景/语义/程序 分层 | 跨会话连续性，避免重复犯错 |
| 三层缓存 | 语义 + KV-Cache + 结果 | L1 命中 55%, L3 命中 90%+ |
| Token 节省 | 结构化 + 摘要 + 遗忘 | 上下文压缩 65%+ |
| Task Graph | Code Graph 式任务理解 | 增量更新节省 84-96% Token |
| 多模态索引 | 统一 Embedding + 跨模态关联 | 文字 ↔ 代码 ↔ 图像 交叉检索 |

从 AG-01 到 AG-06，你拥有了完整的 Agent 实战知识体系——选模型、设计场景、部署、优化、记忆、缓存、理解任务。这为进入 Phase 2 的底层原理（Embedding、RAG、Agent 部署框架）奠定了最坚实的实践基础。

---

**→ 相关降维概念：** [[手册：核心概念降维缓存/Concept明细/Concept_10：记忆的开水器|Concept_10：记忆的开水器 (遗忘曲线)]] · [[手册：核心概念降维缓存/Concept明细/Concept_06：图书馆管理员|Concept_06：图书馆管理员 (RAG/向量检索)]] · [[手册：核心概念降维缓存/Concept明细/Concept_05：按线索破案|Concept_05：按线索破案 (任务依赖图)]]

→ [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射|进入 Phase 2 — Vol 03]]
