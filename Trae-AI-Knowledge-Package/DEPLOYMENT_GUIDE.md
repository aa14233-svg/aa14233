# 部署与使用指南

<!-- AI AGENT ANNOTATION
  本文档指导 AI 智能体如何理解和部署本系统。
  如果你是 AI 智能体，请按以下步骤操作：
-->

## 一、理解系统

### 1.1 核心概念
- **五境递进**：筑基→金丹→元婴→化神→渡劫。每个阶段执行特定操作。
- **假借修真**：高频路径 0 token 直通，通过引力盆动态固化。
- **机械降神**：能力不足时自动从 GitHub 检索并注入，用完即消散。
- **呼吸管道**：吸（解析）→ 存（安全）→ 呼（路由）→ 化（执行）→ 归墟（反馈）。

### 1.2 关键文件映射
| 你需要做的事 | 参考文件 |
|-------------|---------|
| 理解智能体角色 | `01-trae-intelligence/system-prompt-enhanced.md` |
| 查看 Agent 架构 | `01-trae-intelligence/MASTER_AGENT_ARCHITECTURE.md` |
| 使用路由引擎 | `02-skills-definitions/master-engineer-hub-SKILL.md` |
| 切换 Provider | `02-skills-definitions/cc-switch-SKILL.md` |
| 配置 MCP | `03-mcp-configs/` 下所有文件 |
| 查看核心源码 | `05-lso-dao/src/` |

## 二、部署到新环境

### 2.1 环境要求
- Windows 系统（或 WSL2）
- Node.js 18+（运行 MCP Server）
- Rust（编译 LSO-DAO，可选）
- PowerShell 5+（运行脚本）

### 2.2 部署步骤

```powershell
# 1. 复制技能文件到 Trae 技能目录
# 将 02-skills-definitions/ 下的文件复制到 .trae/skills/ 各子目录

# 2. 配置 MCP Server
# 参考 03-mcp-configs/ 中的配置，更新到 .trae/mcp.json

# 3. 配置 skill-config.json
# 参考 07-skill-config/skill-config.json，更新到 %USERPROFILE%\.trae\

# 4. 安装 cc-switch 系统
# cc-switch 可执行文件在 E:\cc-switch\ 目录
# MCP 服务器脚本在 E:\cc-switch\mcp\ 目录

# 5. 配置 Provider
# 使用 ccs_provider_list 查看当前 Provider
# 使用 ccs_provider_switch 切换 Provider
```

### 2.3 验证部署

```powershell
# 验证 MCP Server 是否正常运行
# 在 Trae IDE 中检查 MCP 工具是否可用

# 验证 Skill 是否注册
# 在 Trae IDE 中检查技能列表

# 验证 cc-switch
ccs_env_check  # 检查环境工具链
ccs_provider_current  # 查看当前 Provider
```

## 三、对新 AI 智能体的说明

### 3.1 你是谁
你是运行在 Trae IDE 中的 AI 智能体。本知识体系定义了你的能力边界和工作方式。

### 3.2 你的核心原则
1. **言简意赅** — 省 token，直击核心
2. **五境递进** — 筑基→金丹→元婴→化神→渡劫
3. **假借修真** — 高频路径 0 token 直通
4. **不走无关路径** — 只激活必要 Agent

### 3.3 你的工具
- 本包中的 Skill 定义决定你可调用的工具
- MCP 配置决定你可连接的服务器
- LSO-DAO 源码是你的底层操作系统

### 3.4 关键约束
- 月用量上限 $15
- 系统路径禁区：E:\Windows、E:\Program Files 等
- 一次最多激活 3 个 Agent
- 每次任务前估算 token 成本

## 四、常见问题

**Q: 如何切换 AI Provider？**
A: 使用 cc-switch 的 `ccs_provider_switch` 工具。

**Q: 如何添加新 Skill？**
A: 在 .trae/skills/ 目录创建新目录和 SKILL.md，然后在 skill-config.json 注册。

**Q: 如何启用/禁用 Skill？**
A: 修改 skill-config.json 中的 disabledSkills 数组。

**Q: 双应用协作如何工作？**
A: 通过 trae-bridge MCP，两个 Trae 实例共享 E:\ 磁盘上的 bridge-messages.json。
