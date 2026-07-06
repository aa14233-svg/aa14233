# 系统架构总览

<!-- AI AGENT ANNOTATION
  本文档是系统的架构骨架。AI 智能体应先读此文理解全局拓扑，
  再深入到各子目录。
-->

## 一、整体架构拓扑

```
用户输入
    │
    ▼
TraeOrchestrator（主调度 Agent）
    │
    ├── Hook 1: 任务准备（安全检查、资源确认）
    │
    ├── 任务分解 → 子任务清单
    │
    ├── 路由决策（通过 master-engineer-hub）
    │   ├── Level 0: 引力盆命中 → 直通（0 token）
    │   ├── Level 1: 特征词典 → 路由 A/B/C
    │   ├── Level 2: 工具签名匹配
    │   └── Level 3: LLM 兜底 → 机械降神
    │
    ├── Agent 执行（通过 lso-os 基础设施）
    │   ├── 筑基 → 金丹 → 元婴 → 化神 → 渡劫
    │   └── 吸 → 存 → 呼 → 化 → 归墟
    │
    ├── Hook 2: 执行中检查（进度、质量）
    ├── D1/D2/D3 三级验收
    └── 交付
```

## 二、五层架构

### 第1层：应用层（omnipotent-engineer）
- 七维拓扑：构思 → 设计 → 美工 → 动画 → 工程 → 建模 → 审计
- 运行于 lso-os 基础设施之上

### 第2层：路由编排层（master-engineer-hub）
- 假借修真：0 token 直通高频路径
- 机械降神：按需从 GitHub 注入能力
- 引力盆：动态固化高频模式

### 第3层：基础设施层（lso-os）
- 20+ Agent 集群（CodeAgent、ArtisticDesignerAgent 等）
- 五境递进执行管道
- 安全扫描 + 域映射 + 保真度检查

### 第4层：Provider 管理层（cc-switch + token-stats）
- Provider 切换（OpenAI / DeepSeek / OpenRouter 等）
- Token 审计和预算管理
- MCP Server 同步管理

### 第5层：MCP 工具层
- cc-switch MCP（10 工具）
- token-stats MCP（6 工具）
- master-engineer-hub MCP（6 工具）
- integrated-web-dev MCP（Supabase / Stripe / 部署）

## 三、Agent 集群（共 20+）

### 核心 Agent（7 个）
FileAgent | BrowserAgent | AppAgent | ComputerAgent | SearchAgent | TraeHub | CapabilityHub

### 工程 Agent（8 个）
CodeAgent | DevAgent | DocAgent | DataAgent | SecurityAgent | DeployAgent | CreativeAgent | LearningAgent

### 三合一 Agent（5 个）
ProgramDesignerAgent | ArtisticDesignerAgent | RTKSpecialistAgent | HeadroomDesignerAgent | CodeGraphArchitectAgent

## 四、数据流

```
Q → hub_route(q)
  ├─ Level 0/1 命中 → execute → tks_record
  └─ 未命中 → hub_deus → GitHub检索 → 注入 → execute → clean
  ```

## 五、关键路径

| 组件 | 位置 |
|------|------|
| 五境源码 | `05-lso-dao/src/` |
| Skill 定义 | `02-skills-definitions/` |
| MCP 配置 | `03-mcp-configs/` |
| 智能体知识 | `01-trae-intelligence/` |
| Provider 切换 | 通过 cc-switch（配置在 04/） |
