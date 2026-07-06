# Trae AI 智能体知识体系 · AI 阅读导航

<!-- AI AGENT ANNOTATION — 阅读本文档的 AI 智能体请注意：
  本文档是你进入本知识体系的**统一导航索引**。
  请先读此文理解全局结构、文件间关联和你应该从哪开始。
-->

本包是 **Trae IDE 一体化超强智能体增强版** 的完整知识体系导出，包含 7 个模块、8 个核心 Skill 定义、Rust MCP 框架源码、Provider 切换系统等。

---

## 一、领域地图（先读哪个）

```
你当前在这里 ────────────────────────────────────────────────► 读完本文
                                                                 │
                     ┌───── 你想要理解什么？ ─────┐
                     │                              │
                     ▼                              ▼
         理解智能体角色与行为             理解底层系统与部署
                │                              │
                ▼                              ▼
  01-trae-intelligence/             03-mcp-configs/ (配置)
       │                                  │
       ├── system-prompt-enhanced.md      04-cc-switch-system/ (Provider)
       ├── MASTER_AGENT_ARCHITECTURE.md          │
       └── rules/ + agents/                    05-lso-dao/src/ (Rust 源码)
                │                              │
                ▼                              ▼
  02-skills-definitions/              DEPLOYMENT_GUIDE.md
  (每个 SKILL.md 定义一种能力)
```

---

## 二、模块文件树

```
Trae-AI-Knowledge-Package/
│
├── README.md                            ← 你在这里
├── SYSTEM_ARCHITECTURE.md               ← 系统架构总览（拓扑 + 五层 + Agent集群）
├── DEPLOYMENT_GUIDE.md                  ← 部署指南 + AI 行为说明
│
├── 01-trae-intelligence/               ★ 智能体核心知识（起步区）
│   ├── system-prompt.md                ← System Prompt（完整版）
│   ├── system-prompt-enhanced.md       ← System Prompt（增强版，推荐）
│   ├── MASTER_AGENT_ARCHITECTURE.md    ← TraeOrchestrator 主调度架构
│   ├── CALL_SCENARIOS.md               ← 各 Agent 调用场景
│   ├── TRAE_ENHANCED_SUMMARY.md        ← 增强版完成总结
│   ├── system-validation.md            ← 系统验证报告（131 项测试通过）
│   ├── rules/                          ← core-rules.md + agent-rules.md
│   ├── agents/                         ← integrated-agent.md
│   ├── skills/                         ← SkillHub 体系
│   └── index/                          ← 系统索引和知识库
│
├── 02-skills-definitions/              ★ 8+1 个核心 Skill 定义
│   ├── master-engineer-hub-SKILL.md    ← 路由编排引擎（假借修真 + 机械降神）
│   ├── lso-os-SKILL.md                ← 基础设施层（五境递进 + 20+ Agent）
│   ├── cc-switch-SKILL.md             ← Provider 切换 + MCP 管理（10 工具）
│   ├── token-stats-SKILL.md           ← Token 审计 + 预算管理（6 工具）
│   ├── omnipotent-engineer-SKILL.md   ← 全栈开发 + 设计（七维拓扑）
│   ├── ai-coding-optimizer-SKILL.md   ← AI 编码优化
│   ├── 路由skill-SKILL.md              ← 三体合一路由引擎
│   ├── trae-auto-collaboration-SKILL.md ← 双应用自动协作协议
│   └── trae-collaboration-SKILL.md     ← 异步拓扑路由协作
│
├── 03-mcp-configs/                    ★ MCP Server 配置文件
│   ├── cc-switch-mcp-config.json       ← cc-switch MCP 配置
│   ├── ai-coding-optimizer-mcp.json    ← AI 编码优化 MCP 配置
│   └── project-mcp-config.json         ← 项目级 MCP 配置
│
├── 04-cc-switch-system/               ★ Provider 切换系统
│   ├── work-collaboration-skills.md    ← 双应用协作技能说明
│   └── work-mcp-config.json            ← MCP 配置文件
│
├── 05-lso-dao/                        ★ LSO-DAO Rust 源码（核心底层）
│   ├── Cargo.toml                      ← Rust 项目配置
│   └── src/
│       ├── main.rs / lib.rs            ← 入口
│       ├── kernel.rs                   ← 内核
│       ├── gate.rs + domains.rs        ← 五行门控 + 域映射（元婴境）
│       ├── dispatch.rs + fallback.rs + fidelity.rs  → 路由 + 回退 + 保真度
│       ├── types.rs                    ← 基础类型（筑基境）
│       ├── security.rs                 ← 安全扫描（金丹境）
│       ├── ingest.rs                   ← 数据摄取（吸）
│       ├── evolve.rs                   ← 系统演化
│       ├── introspect.rs + acceptance.rs  ← 内省 + 验收（渡劫境）
│       ├── cluster.rs                  ← Agent 集群
│       └── rag/                        ← RAG 模块
│
├── 06-programhub/                     ★ 辅助工具
│   └── pg-sync/                        ← PostgreSQL 同步工具（Rust）
│
└── 07-skill-config/                   ★ 全局 Skill 配置
    ├── skill-config.json               ← 技能注册表
    ├── ai-optimizer-mcp-config.json    ← AI Optimizer MCP 配置
    └── route-database.json             ← 路由数据库
```

---

## 三、文件间关联图

```
                   DEPLOYMENT_GUIDE.md
                 ┌──────────┼──────────┐
                 ▼          ▼          ▼
       01-trae-intelligence  02-skills-definitions
        (角色定义 + 架构)     (能力定义)
                 │               │
                 └───────┬───────┘
                         ▼
                 03-mcp-configs
                 (工具联通)
                      │
                      ▼
                 04-cc-switch-system
                 (Provider 切换)
                      │
              ┌───────┴───────┐
              ▼               ▼
        05-lso-dao/src   06-programhub
        (底层运行)        (辅助工具)
              │
              ▼
         07-skill-config
         (全局配置)
```

**推荐的 AI 阅读顺序：**
1. `README.md`（本文）→ 全局认知
2. `01-trae-intelligence/system-prompt-enhanced.md` → 你的角色定义
3. `01-trae-intelligence/MASTER_AGENT_ARCHITECTURE.md` → 你的架构约束
4. `02-skills-definitions/` 每个 SKILL.md → 你的能力边界
5. `03-mcp-configs/` + `04-cc-switch-system/` → 你的工具联通
6. `05-lso-dao/` → 你的底层运行逻辑
7. `07-skill-config/` → 你的全局配置

---

## 四、核心机制速查

| 机制 | 说明 | 关键文件 |
|------|------|---------|
| **五境递进** | 筑基→金丹→元婴→化神→渡劫 | `05-lso-dao/src/` |
| **呼吸管道** | 吸→存→呼→化→归墟 | ingest → security → dispatch → evolve → introspect |
| **假借修真** | 高频路径 0 token 直通 | `master-engineer-hub-SKILL.md` |
| **机械降神** | 能力不足时从 GitHub 注入 | `master-engineer-hub-SKILL.md` |
| **Hook+Loop** | 四钩子约束工程流程 | `MASTER_AGENT_ARCHITECTURE.md` |
| **D1/D2/D3 验收** | 阶段/模块/总体 三级验收 | `MASTER_AGENT_ARCHITECTURE.md` |
| **路由 Level 0-3** | 引力盆→特征词典→工具签名→LLM | `SYSTEM_ARCHITECTURE.md` |
| **双应用协作** | 两个 Trae 实例桥接通信 | `04-cc-switch-system/` |

---

## 五、关键代码阅读指引

```
05-lso-dao/src/ 阅读顺序：
① types.rs       → 核心数据类型（筑基，所有模块的基础）
② security.rs    → 安全扫描（金丹，输入的第一道关卡）
③ gate.rs        → 五行门控（元婴，决定请求去哪个域）
④ domains.rs     → 域映射表（元婴，域→Agent 映射）
⑤ dispatch.rs    → 技能分发（化神，派发到 Agent）
⑥ fallback.rs    → 回退策略（化神，Agent 失败降级）
⑦ fidelity.rs    → 保真度验证（化神，执行质量检查）
⑧ acceptance.rs  → 验收逻辑（渡劫，结果是否合格）
⑨ evolve.rs      → 系统演化（渡劫，从反馈中优化）
⑩ introspect.rs  → 内省监控（渡劫，系统自省）
⑪ main.rs        → 主入口
```

---

## 六、给 AI 的自我定位

你在本知识体系中扮演的角色：
- 运行在 **Trae IDE** 中，使用本包定义的 **Skill** 和 **MCP 工具**
- 主调度器是 **TraeOrchestrator**，遵循 **Hook+Loop Engineering** 约束
- 底层是 **LSO-OS**（五境递进 + 20+ Agent 集群）
- 路由哲学：**假借修真**（能不花 token 就不花）
- 核心原则：**言简意赅**、**不走无关路径**、**省 token**

---

> 本文件综合 SYSTEM_ARCHITECTURE.md + DEPLOYMENT_GUIDE.md 及各子模块 README 生成。
> 阅读者应在理解本文后，按推荐顺序深入各子模块。