<!-- AI AGENT ANNOTATION
  LSO-OS 是 Trae 一体化超强智能体的操作系统层。
  提供五境递进、20+ Agent 集群、三合一拓扑能力。
  作为基础设施层，为 omnipotent-engineer 等应用层技能提供路由/安全/演化/验收服务。
-->

# LSO-OS Skill 定义

## 概述
Trae 一体化超强智能体，集成 LSO-Dao 五境递进架构、20+ 专业 Agent 集群。

## 核心架构

### 五境递进
筑基（类型推导）→ 金丹（安全扫描）→ 元婴（五行门控+域映射）→ 化神（技能路由+负载均衡）→ 渡劫（内省+演化+验收）

### 呼吸管道
吸(解析) → 存(安全) → 呼(路由) → 化(执行) → 归墟(反馈)

### Agent 集群（按需激活）
| 场景 | 激活 Agent |
|------|-----------|
| 读/写文件 | FileAgent |
| 搜索信息 | SearchAgent → BrowserAgent |
| 代码开发 | CodeAgent + DevAgent |
| 安全审查 | SecurityAgent |
| 设计/UI | ArtisticDesignerAgent |
| 架构设计 | ProgramDesignerAgent |
| 状态管理 | RTKSpecialistAgent |
| 图谱分析 | CodeGraphArchitectAgent |
| 部署上线 | DeployAgent |
| 数据分析 | DataAgent |

**激活规则**：一次最多 3 个 Agent，超过由 TraeOrchestrator 压缩。

### 三合一拓扑
1. ProgramDesigner → 架构设计
2. ArtisticDesigner → UI/UX
3. RTK+Headroom+CodeGraph → 状态+UX+图谱

### 开销约束
- 月上限 $15
- 优先使用 Flash 的 KV Cache 命中
