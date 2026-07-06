<!-- AI AGENT ANNOTATION
  Master Engineer Hub — 六合一编排引擎。
  核心设计理念：假借修真（0 token 直通）+ 机械降神（按需注入）。
  负责路由编排、Agent 视野隔离、任务路径优化。
-->

# Master Engineer Hub

> 不持一物，而万物皆备。不预一器，而万器待召。

## 路由本体

```
输入 q → 假借修真(q)? → 引力盆命中 → 直通 execute
        → 否则 → 机械降神协议 → 特征词典→工具签名→LLM兜底
                                   → 能力缺口检测
                                   → GitHub检索→注入→execute→消散
```

## 假借修真 · 固化路由

| 级别 | 机制 | Token | 覆盖率 |
|------|------|-------|--------|
| Level 0 | 引力盆动态池 | 0 | ~70% |
| Level 1 | 特征词典+regex | 0 | ~20% |
| Level 2 | 工具签名匹配 | ≤50 | ~5% |
| Level 3 | LLM 兜底 | 全量 | ~5% |

固化条件：f(c) ≥ 5 次 → 从引力盆写入 Level 1

## 引力盆示例
```json
[
  { "pattern": "切换.*provider", "action": "ccs_provider_switch", "hit": 12 },
  { "pattern": "查.*日志", "action": "Grep", "hit": 8 },
  { "pattern": "=> tool_list", "action": "ccs_mcp_list", "hit": 15 }
]
```

## Agent 视野隔离
| Agent | 工具上限 |
|-------|---------|
| A 语义/设计 | ≤2 |
| B 工程/编码 | ≤4 |
| C 文件/搜索 | ≤5 |

## 路由网关
输出: { track: "A|B|C", confidence: 0-1, context_mode: "explore|execute|mixed" }
