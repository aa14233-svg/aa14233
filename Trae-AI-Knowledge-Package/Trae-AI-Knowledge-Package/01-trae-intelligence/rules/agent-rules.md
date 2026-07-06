<!-- AI AGENT ANNOTATION
  Agent 集群规则，定义 Agent 类型、路由和节点管理。
-->

# Agent 集群规则

## Agent 类型
| Agent | 域 | 职责 |
|-------|-----|------|
| FileAgent | Execution | 文件系统操作 |
| BrowserAgent | Execution | 网页浏览交互 |
| CodeAgent | Execution | 代码开发重构 |
| DevAgent | Execution | 开发工具流程 |
| DocAgent | Execution | 文档管理编辑 |
| SecurityAgent | Governance | 安全审计防护 |
| SearchAgent | Metacortex | 搜索信息检索 |
| DataAgent | Metacortex | 数据分析处理 |
| TraeHub | Meta | 协调和降级 |

## 路由规则
1. 精确匹配域的主要 Agent
2. 选择同域内负载最低的健康节点
3. 查找相关能力的其他 Agent
4. 最终降级到 TraeHub

## 节点健康
- 评分 > 0.8: 健康（绿色）
- 评分 0.5-0.8: 亚健康（黄色）
- 评分 < 0.5: 异常（红色）
