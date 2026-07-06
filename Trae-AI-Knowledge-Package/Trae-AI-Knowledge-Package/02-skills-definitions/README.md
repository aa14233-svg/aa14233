# Skill 定义文件

<!-- AI AGENT ANNOTATION
  本目录包含所有注册 Skill 的 SKILL.md 定义文件。
  每个 SKILL.md 定义了一个技能的名称、描述、可用工具和路由规则。
  AI 在需要特定能力时，先查阅对应 Skill 定义。
  核心技能关系：
  - master-engineer-hub: 路由编排引擎（入口）
  - lso-os: 基础设施层（底座）
  - cc-switch: Provider 切换 + MCP 管理
  - token-stats: Token 审计 + 预算管理
  - omnipotent-engineer: 全栈开发 + 设计（应用层）
  - ai-coding-optimizer: AI 编码优化工具集
  - 路由skill: 三体合一路由引擎
  - trae-auto-collaboration: 双应用协作协议
-->

## 技能拓扑关系

```
master-engineer-hub (路由编排)
  ├── cc-switch (Provider 切换/MCP 管理)
  ├── token-stats (Token 审计)
  ├── omnipotent-engineer (全栈工程)
  └── lso-os (基础设施)
```

## 文件列表

| 文件 | 技能 | 核心功能 |
|------|------|---------|
| `lso-os-SKILL.md` | LSO-OS | 五境递进、Agent 集群、三合一拓扑 |
| `cc-switch-SKILL.md` | CC Switch | Provider 切换、MCP 管理、10 工具 |
| `master-engineer-hub-SKILL.md` | Master Engineer Hub | 假借修真、机械降神、引力盆 |
| `omnipotent-engineer-SKILL.md` | 全能工程狮 | 七维拓扑、全栈开发、UI/UX |
| `ai-coding-optimizer-SKILL.md` | AI 编码优化 | rtk/headroom/codegraph/Obsidian/PostgreSQL |
| `token-stats-SKILL.md` | Token Stats | Token 审计、预算、成本对比、6 工具 |
| `路由skill-SKILL.md` | 路由 Skill | 三体合一、双启异步、审计财务 |
| `trae-auto-collaboration-SKILL.md` | 自动协作 | 双应用桥接、任务分派 |
| `trae-collaboration-SKILL.md` | 协作 skill | 异步拓扑路由、工程协作 |
