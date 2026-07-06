---
name: "token-stats"
description: "Token Stats MCP — Token 审计 / 预算管理 / 成本对比。6个MCP工具。Invoke when需要查询Token用量、管理预算、对比Provider成本或审计消费记录。"
---

# Token Stats MCP

Token 审计与预算管理工具集。通过 `token-stats-server.js` 管理 Token 消费、预算监控、Provider 成本对比。

## 工具列表

| 工具 | 功能 |
|------|------|
| `token_stats_query` | 查询 Token 用量统计 |
| `token_stats_compare` | 对比各 Provider 成本 |
| `token_stats_budget` | 查看/设置预算上限 |
| `token_stats_audit` | 审计 Token 消费记录 |
| `token_stats_report` | 生成 Token 使用报告 |
| `token_stats_alert` | 配置用量告警阈值 |

## 路由拓扑

```
cc-switch ←→ token-stats ←→ master-engineer-hub
  ├─ 查询/审计工具 → Agent C（文件/搜索）
  └─ 预算/告警工具 → Agent B（工程/编码）
```

## 与 master-engineer-hub 耦合

master-engineer-hub 的路由网关将 token-stats 工具分配到：
- **Agent B**：`token_stats_budget`, `token_stats_alert`
- **Agent C**：`token_stats_query`, `token_stats_compare`, `token_stats_audit`, `token_stats_report`

---

## MCP 配置

```json
{
  "command": "node",
  "args": ["E:\\cc-switch\\mcp\\token-stats-server.js"],
  "description": "Token Stats MCP server — Token auditing"
}
```
