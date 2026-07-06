# 仓库导入 Trae 操作指南

<!-- AI AGENT ANNOTATION
  本文档是给 AI 和人类阅读的部署指南，说明如何将本仓库内容分别导入到
  Trae IDE（主开发环境）和 Trae Work（工作区管理）两个版本中。
  两个版本需要导入的"绿色"配置不同，请按需选择。
-->

## 概览

本仓库包含两类内容，分别对应两个 Trae 版本：

| 仓库内容 | 导入目标 | 说明 |
|---------|---------|------|
| `.trae-config/`（绿色配置） | **Trae IDE** ← 重点 | MCP 配置、Skill 定义、用户规则、用户画像 |
| `Trae-AI-Knowledge-Package/`（知识体系） | **Trae IDE** | 智能体知识、Skill 定义、MCP 配置、LSO-DAO 源码 |
| 项目产出物（taibai-release/ 等） | **Trae Work** | 工作区文件、项目代码、文档、教材 |

---

## 一、Trae IDE 需要导入的内容

### 1.1 绿色配置文件（MCP 配置 + Skill 配置）

这组文件是 Trae IDE 的**核心配置**，在 IDE 设置面板中显示为绿色：

```
从仓库 .trae-config/ 复制到本地 C:\Users\<用户名>\.trae\
```

| 仓库文件 | 本地目标路径 | 说明 |
|---------|------------|------|
| `.trae-config/mcp.json` | `.trae/work/<work-id>/mcp.json` | **MCP Server 配置** — 5 个 MCP Server（cc-switch / token-stats / hub / relay / bridge） |
| `.trae-config/skill-config.json` | `.trae/skill-config.json` | **Skill 注册表** — 禁用/启用哪些 Skill |
| `.trae-config/argv.json` | `.trae/argv.json` | **Trae 启动参数** — 语言、崩溃报告 |
| `.trae-config/user_profile.md` | `.trae/memory/user_profile.md` | **用户画像** — 偏好、预算、审美 |
| `.trae-config/skills/` | `.trae/skills/` | **3 个自定义 Skill** — cc-switch / master-engineer-hub / token-stats |
| `.trae-config/user_rules/` | `.trae/user_rules/` | **2 条用户规则** — 言简意赅、先建模后拆解 |

#### 前置条件：MCP Server 依赖

绿色 MCP 配置依赖 `E:\cc-switch\` 目录，需要确保以下文件存在：

```
E:\cc-switch\
├── mcp\
│   ├── cc-switch-server.js       ← CC Switch MCP
│   ├── token-stats-server.js      ← Token Stats MCP
│   └── hub-server.js              ← Master Engineer Hub MCP
├── trae-ws-relay.js               ← WebSocket 中继
└── trae-bridge-server.js          ← 双应用消息桥
```

### 1.2 知识体系文件

```
从仓库 Trae-AI-Knowledge-Package/ 复制到本地任意位置
```

| 子模块 | 作用 |
|-------|------|
| `01-trae-intelligence/` | 智能体核心知识（System Prompt、Agent 架构、规则） |
| `02-skills-definitions/` | 8+1 个核心 Skill 定义文档 |
| `03-mcp-configs/` | MCP Server 配置参考 |
| `04-cc-switch-system/` | Provider 切换系统说明 |
| `05-lso-dao/` | LSO-DAO Rust 源码 |
| `06-programhub/` | 辅助工具 |
| `07-skill-config/` | 全局 Skill 配置 |

---

## 二、Trae Work 需要导入的内容

Trae Work 需要导入的是**工作区项目文件**，即 `e:\trae work` 下的所有项目产出物：

| 项目 | 路径 | 导入方式 |
|------|------|---------|
| 太白炁渊·命理全栈 | `taibai-release/` | 拖入 Trae Work 工作区 |
| WebGPU 粒子系统 | `particle-system/` | 拖入 Trae Work 工作区 |
| 形而上全栈设计 | `metaphysical-fullstack-design/` | 拖入 Trae Work 工作区 |
| 暗黑知识应用 | `dark-knowledge-app/` | 拖入 Trae Work 工作区 |
| AI 学习教材 | `人工智能入门/` | 拖入 Trae Work 工作区 |
| 独立 HTML 可视化 | `*.html` | 拖入 Trae Work 工作区 |
| Word 文档 | `*.docx` | 直接打开 |

---

## 三、如何区分两个 Trae 版本

| 特征 | Trae IDE | Trae Work |
|------|---------|-----------|
| 主要用途 | 开发编码、AI 对话、配置管理 | 工作区文件管理、项目浏览 |
| 配置目录 | `C:\Users\<用户名>\.trae\` | 无独立配置目录 |
| 绿色配置 | ✅ **需要导入 `.trae-config/`** | ❌ 不需要 |
| MCP Server | ✅ **需要配置** | ❌ 不需要 |
| Skill 注册 | ✅ **需要注册** | ❌ 不需要 |
| 项目文件 | 仅作为引用 | ✅ **需要导入全部项目** |
| 知识体系 | ✅ **需要参考** | 可选 |

---

## 四、完整导入流程

### 步骤 1：从 GitHub 拉取仓库

```bash
git clone https://github.com/aa14233-svg/aa14233.git
cd aa14233
```

### 步骤 2：Trae IDE — 导入绿色配置

```bash
# 复制 MCP 配置（需要先确认工作区 ID）
# 查看 .trae/work/ 下面有哪些工作区目录
# 选择一个活跃的工作区 ID，例如 6a4b5eaad912719f5e3c09e5
$workId = "你的工作区ID"
Copy-Item -Path "aa14233\.trae-config\mcp.json" -Destination "$env:USERPROFILE\.trae\work\$workId\mcp.json" -Force

# 复制 Skill 注册表
Copy-Item -Path "aa14233\.trae-config\skill-config.json" -Destination "$env:USERPROFILE\.trae\skill-config.json" -Force

# 复制启动参数
Copy-Item -Path "aa14233\.trae-config\argv.json" -Destination "$env:USERPROFILE\.trae\argv.json" -Force

# 复制用户画像
Copy-Item -Path "aa14233\.trae-config\user_profile.md" -Destination "$env:USERPROFILE\.trae\memory\user_profile.md" -Force

# 复制自定义 Skill
Copy-Item -Path "aa14233\.trae-config\skills\*" -Destination "$env:USERPROFILE\.trae\skills\" -Recurse -Force

# 复制用户规则
Copy-Item -Path "aa14233\.trae-config\user_rules\*" -Destination "$env:USERPROFILE\.trae\user_rules\" -Force
```

### 步骤 3：Trae IDE — 导入知识体系

```bash
# 复制到任意学习目录
Copy-Item -Path "aa14233\Trae-AI-Knowledge-Package" -Destination "E:\Trae-AI-Knowledge-Package" -Recurse -Force
```

### 步骤 4：Trae Work — 导入项目文件

```bash
# 复制全部项目到工作区
Copy-Item -Path "aa14233\*" -Destination "E:\trae work\" -Recurse -Force
```

### 步骤 5：重启 Trae IDE

复制完成后重启 Trae IDE，MCP 配置和 Skill 注册表会自动生效。

---

## 五、绿色 MCP 配置依赖检查

导入后，在 Trae IDE 中检查 MCP 连接状态：

```bash
# 确认 MCP Server 文件存在
ls E:\cc-switch\mcp\*.js
ls E:\cc-switch\trae-ws-relay.js
ls E:\cc-switch\trae-bridge-server.js

# 测试 MCP 连接
# 在 Trae IDE 中调用任意 MCP 工具，如：
# ccs_provider_list  → 查看 Provider 列表
# token_stats_query  → 查询 Token 用量
```

---

## 六、常见问题

**Q: 导入后 MCP 工具不可用？**
A: 检查 `mcp.json` 中的路径是否与本地 `E:\cc-switch\` 目录一致，确认 `node` 命令可用。

**Q: Skill 导入后不生效？**
A: 检查 `skill-config.json` 中的 `managedSkills` 是否包含正确的 Skill 名称，重启 Trae IDE。

**Q: 两个 Trae 版本如何切换？**
A: Trae IDE 和 Trae Work 是独立应用，各自加载自己的配置。导入时按上表区分即可。

**Q: 绿色配置文件修改后如何同步？**
A: 可以在这个仓库中更新 `.trae-config/` 下的文件，然后通过 `git pull` 同步到任意机器。

---

> 本指南对应仓库版本：`main` 分支
> 最后更新：2026-07-06