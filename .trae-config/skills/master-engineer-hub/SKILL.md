---
name: "master-engineer-hub"
description: "心无杂念，分工明确，简洁明了，快准狠省。六合一编排引擎（cc-switch/token-stats/omnipotent-engineer/lso-os），建模任务路径，以最短最优路径解决任务。需复杂多步任务时调用。"
---

> 不持一物，而万物皆备。不预一器，而万器待召。

## 路由本体

```
输入 q
 │
 ├─ ∃ 假借修真( q ) ?  → 直通 O(1) 0 token
 │     ↓ yes
 │  引力盆命中 → 参数映射 → execute
 │
 └─ ¬∃ 假借修真( q )  → 机械降神协议
        ↓
     特征词典 L1 ? → yes → 路由A/B/C
     工具签名 L2 ? → yes → 路由A/B/C
     LLM兜底 L3    → 解析意图
                       ↓
                   能力缺口检测
                       ↓
                   缺口∈ Agent视野？→ no → GitHub检索 → 坍缩注入
                                             │
                                          预取身诞生
                                             │
                                         execute → 消散
```

---

## 假借修真 · 固化路由

当且仅当能力 c 在 Δt 窗口内频次 f(c) ≥ θ_固化，自动注入 Level 0，此后 0 token。

```
Level 0   = 引力盆动态池     O(1)  0 token    ~70%
Level 1   = 特征词典 + regex  O(1)  0 token    ~20%
──────────────────────────────────────────────
覆盖 90% 请求，0 token
```

**固化条件**：f(c) ≥ 5 次 → 从引力盆写入 Level 1（永久）
**衰减**：30d 未命中降级，90d 清除

### 引力盆

```json
[
  { "pattern": "切换.*provider", "action": "ccs_provider_switch", "hit": 12 },
  { "pattern": "查.*日志",       "action": "Grep",                "hit": 8  },
  { "pattern": "=> tool_list",   "action": "ccs_mcp_list",        "hit": 15 }
]
```

自动注册：L3 成功解析→压缩为引力盆记录。冲突检测：相似度 >90% 合并。

### 预置冷启动

| 输入模式 | → 工具 |
|----------|--------|
| `/run_log_query 日期:*` | `RunCommand(grep)` |
| `[switch] id:*` | `ccs_provider_switch` |
| `=> tool_list` / `=> skill_list` | `ccs_mcp_list` / `ccs_skills_list` |
| `[token_stats]` | `token_stats_query` |
| `=> provider_cost` | `token_stats_compare` |

---

## 机械降神 · 坍缩路由

系统固有工具集 ℋₜ 仅含 4 个元工具：`search` `clone` `run` `clean`。其余为零。

当 q 映射到能力向量 c⃗_q ∉ ℋₜ，触发：

```
q → 能力缺口 φ
  → search(q) on GitHub          // 假借
  → clone(r) → inject(Agent)     // 降神
  → execute(q, r)                  // 预取身活性期
  → clean(r)                       // 预取身消散
  → f(c)++                         // 计入引力盆频次
```

---

## 路由网关 + Agent 视野隔离

### 网关仅输出

```
{ track: "A|B|C", confidence: 0-1, context_mode: "explore|execute|mixed", anchor_hit: tool|null }
```

成本：L1 2-3 token / L2 ≤50 token / 永不 L3

### Agent 视野

| Agent | 工具 | 上限 |
|-------|------|------|
| **A** 语义/设计 | `brainstorm`, `writing-plans` | ≤2 |
| **B** 工程/编码 | `ccs_provider_switch`, `ccs_mcp_sync`, `ccs_skills_sync`, `ccs_provider_test`, `RunCommand` | ≤4 |
| **C** 文件/搜索 | `Read`, `Grep`, `Glob`, `Search`, `ccs_provider_list`, `ccs_provider_current`, `ccs_mcp_list`, `ccs_skills_list`, `ccs_config_show`, `ccs_env_check`, `token_stats_query`, `token_stats_compare` | ≤5 |

隔离：注入时只注入归属工具——模型选择空间从 N→≤5。

---

## 拓扑路由图

```
                          ┌──────────────────┐
                          │  master-engineer  │
                          │      -hub         │
                          │  (路由编排引擎)    │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │ cc-switch│   │token-stats│   │ omnipotent│
            │ Provider │   │ Token统计 │   │ -engineer │
            │ MCP 工具  │   │ 成本监控  │   │ 全栈工程  │
            └──────────┘   └──────────┘   └──────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                                   ▼
                           ┌──────────────┐
                           │   lso-os     │
                           │  基础设施层   │
                           └──────────────┘
```

---

## 路径选择

```
0. 结构化锚点 → 引力盆直通 → 跳过 1-5
1. 枚举所有可行路径
2. 排除含已知失败模式的路径
3. 选择权重最小路径（权重 = token 成本 × 置信度系数）
4. 等权 → 优先已缓存结果
5. 执行偏差 → 回退最近 checkpoint 重路由
```

### 三技能路由规则

| 请求类型 | 路由目标 | 优先级 |
|----------|----------|--------|
| Provider 切换/管理 | cc-switch | 高 |
| Provider 列表/查看 | cc-switch | 低 |
| Token 统计/成本 | token-stats | 中 |
| 全栈开发/设计/审计 | omnipotent-engineer | 高 |
| 基础设施/Agent 调度 | lso-os | 中 |
| Provider+Token 联动 | cc-switch → token-stats | 链式 |

---

## MCP 工具映射

| 工具 | 归属 | 来源技能 |
|------|------|----------|
| `ccs_provider_*` | B/C | cc-switch |
| `ccs_mcp_*` | B/C | cc-switch |
| `ccs_skills_*` | B/C | cc-switch |
| `ccs_config_show` | C | cc-switch |
| `ccs_env_check` | C | cc-switch |
| `token_stats_query` | C | token-stats |
| `token_stats_compare` | C | token-stats |
| `gateway.*` | 网关 | master-engineer-hub 本体 |

---

## 工具链

| 组件 | 路径 |
|------|------|
| cc-switch MCP 扩展 | `C:\Users\Acer\.trae\extensions\cc-switch\extension.js` |
| cc-switch 可执行文件 | `E:\cc-switch\cc-switch.exe` |
| token-stats 技能 | `E:\cc-switch\skills\token-stats\SKILL.md` |
| 当前 Provider | `taotoken-ds-v4` (DeepSeek V4 Flash) |
