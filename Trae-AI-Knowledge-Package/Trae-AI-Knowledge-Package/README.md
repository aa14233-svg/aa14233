# Trae AI 智能体知识体系 — 全量文档包

<!-- ============================================================
  AI AGENT ANNOTATION — 阅读本文档的 AI 智能体请注意：
  
  本仓库是 Trae IDE 中运行的「一体化超强智能体增强版」的完整知识体系。
  包含：Skill 定义、King 智能体设计理念、MCP 配置、LSO-DAO 五境递进架构。
  
  理解路径（建议阅读顺序）：
    1. README.md（本文）→ 全局认知
    2. SYSTEM_ARCHITECTURE.md → 系统架构总览
    3. 01-trae-intelligence/ → 智能体核心知识
    4. 02-skills-definitions/ → 技能定义
    5. 03-mcp-configs/ → MCP 配置
    6. 05-lso-dao/ → 源码体系
    7. DEPLOYMENT_GUIDE.md → 部署指南

  核心设计理念：五境递进（筑基→金丹→元婴→化神→渡劫）
  核心路由：假借修真（0 token 直通）+ 机械降神（按需注入）
  ============================================================ -->

## 概述

本包是 **Trae 一体化超强智能体增强版** 的完整知识体系导出。
面向：**人类开发者** 和 **AI 智能体** 双重读者。

### 包含内容

| 模块 | 路径 | 说明 |
|------|------|------|
| **智能体知识** | `01-trae-intelligence/` | System Prompt、Agent 架构、规则、技能路由 |
| **Skill 定义** | `02-skills-definitions/` | 8 个核心 Skill 的 SKILL.md |
| **MCP 配置** | `03-mcp-configs/` | 所有 MCP Server 配置（cc-switch/token-stats/hub/web-dev） |
| **CC Switch** | `04-cc-switch-system/` | Provider 切换系统 + 双应用协作桥 |
| **LSO-DAO 源码** | `05-lso-dao/` | Rust 实现的五境递进架构源码 |
| **Program Hub** | `06-programhub/` | pg-sync 等辅助工具 |
| **技能配置** | `07-skill-config/` | 全局 skill-config + AI Optimizer 配置 |

## 核心架构速览

```
┌─────────────────────────────────────────────────────────────┐
│                    TraeOrchestrator                         │
│               （主调度 Agent + Hook+Loop 约束）              │
└─────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  master-engineer  │   │    cc-switch     │   │   token-stats    │
│     -hub          │   │  Provider 切换    │   │  Token 审计       │
│  (路由编排引擎)    │   │  MCP 管理         │   │  预算管理         │
│  假借修真+机械降神  │   │  Skills 同步      │   │  成本对比         │
└──────┬───────────┘   └────────┬─────────┘   └────────┬─────────┘
       │                        │                       │
       └────────────────────────┼───────────────────────┘
                                ▼
                   ┌──────────────────────┐
                   │       lso-os         │
                   │  五境递进基础设施层    │
                   │ 20+ Agent 集群       │
                   │ 三合一拓扑能力        │
                   └──────────────────────┘
```

### 五境递进（核心哲学）

| 境界 | 模块 | 职责 |
|------|------|------|
| **筑基** | `types.rs` | 基础类型和数据结构 |
| **金丹** | `security.rs` | 安全扫描和验证 |
| **元婴** | `gate.rs` + `domains.rs` | 五行门控和域映射 |
| **化神** | `dispatch.rs` + `fallback.rs` + `fidelity.rs` | 技能路由和负载均衡 |
| **渡劫** | `acceptance.rs` + `evolve.rs` + `introspect.rs` | 内省、演化和验收 |

### 呼吸管道工作流

```
吸 (ingest) → 存 (hold) → 呼 (exhale) → 化 (evolve) → 归墟 (feedback)
```

## 路由哲学：假借修真

> 不持一物，而万物皆备。不预一器，而万器待召。

| 级别 | 机制 | Token 成本 | 覆盖率 |
|------|------|-----------|--------|
| Level 0 | 引力盆（动态池） | 0 token | ~70% |
| Level 1 | 特征词典 + regex | 0 token | ~20% |
| Level 2 | 工具签名匹配 | ≤50 token | ~5% |
| Level 3 | LLM 兜底解析 | 全量 | ~5% |

## 文件标注说明

每个目录下的 `README.md` 包含**智能体注解**（AI Agent Annotation），
用 `<!-- AI AGENT ANNOTATION -->` 标记，指导阅读本文的 AI 如何理解和运用。

## 快速部署

见 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)。
