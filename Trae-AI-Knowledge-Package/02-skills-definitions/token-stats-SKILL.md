<!-- AI AGENT ANNOTATION
  Token Stats MCP — Token 审计与预算管理工具集。
  6 个 MCP 工具：查询、对比、预算、审计、报告、告警。
-->

# Token Stats MCP

## 工具列表（6个）
| 工具 | 归属 | 功能 |
|------|------|------|
| token_stats_query | Agent C | 查询 Token 用量统计 |
| token_stats_compare | Agent C | 对比各 Provider 成本 |
| token_stats_budget | Agent B | 查看/设置预算上限 |
| token_stats_audit | Agent C | 审计 Token 消费记录 |
| token_stats_report | Agent C | 生成 Token 使用报告 |
| token_stats_alert | Agent B | 配置用量告警阈值 |

## 路由拓扑
cc-switch ←→ token-stats ←→ master-engineer-hub
