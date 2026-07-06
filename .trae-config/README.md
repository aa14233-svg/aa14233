# Trae IDE 系统配置文件

<!-- AI AGENT ANNOTATION
  本目录是 Trae IDE 运行所需的系统级配置快照。
  包含：MCP Server 配置、Skill 注册表、用户规则、用户画像、系统参数。
  不同版本之间可直接复用，助你快速部署一致的 Trae 环境。
-->

## 文件清单

| 文件 | 来自路径 | 用途 |
|------|---------|------|
| `mcp.json` | `.trae/work/.../mcp.json` | **MCP Server 配置** — 5 个 MCP Server 定义（cc-switch / token-stats / master-engineer-hub / trae-relay / trae-bridge），每个指定了可执行文件路径和参数 |
| `skill-config.json` | `.trae/skill-config.json` | **Skill 注册表** — 禁用的内置 Skill 列表、已启用的内置 Skill 状态、3 个用户上传的托管 Skill（master-engineer-hub / token-stats / cc-switch） |
| `argv.json` | `.trae/argv.json` | **Trae 启动参数** — 语言（zh-cn）、崩溃报告器 |
| `user_profile.md` | `.trae/memory/user_profile.md` | **用户画像** — 偏好（简体中文、一切从简、Hook+Loop 工程约束）、预算限制（$15/月）、视觉审美（A+C 折中、玄色底色）、协作风格 |

### 子目录

| 目录 | 来自路径 | 内容 |
|------|---------|------|
| `skills/` | `.trae/skills/` | 3 个自定义 Skill 定义（cc-switch / master-engineer-hub / token-stats），每个含 SKILL.md |
| `user_rules/` | `.trae/user_rules/` | 2 条用户自定义规则（言简意赅省 token / 先建模再拆解任务） |

---

## MCP Server 配置一览

```json
{
  "cc-switch":           "node E:\\cc-switch\\mcp\\cc-switch-server.js",
  "token-stats":         "node E:\\cc-switch\\mcp\\token-stats-server.js",
  "master-engineer-hub": "node E:\\cc-switch\\mcp\\hub-server.js",
  "trae-relay":          "node E:\\cc-switch\\trae-ws-relay.js",
  "trae-bridge":         "node E:\\cc-switch\\trae-bridge-server.js"
}
```

所有 MCP Server 均部署在 `E:\cc-switch\` 目录下。

---

## Skill 注册状态

| Skill | 状态 | 来源 |
|-------|------|------|
| `master-engineer-hub` | ✅ 已启用（user_upload） | `.trae/skills/master-engineer-hub/SKILL.md` |
| `token-stats` | ✅ 已启用（user_upload） | `.trae/skills/token-stats/SKILL.md` |
| `cc-switch` | ✅ 已启用（user_upload） | `.trae/skills/cc-switch/SKILL.md` |
| `TRAE-code-review` | ✅ 内置 | - |
| `TRAE-debugger` | ✅ 内置 | - |
| `TRAE-dynamic-ui` | ❌ 禁用 | - |
| `TRAE-generate-mini-app` | ✅ 内置 | - |
| 其他（omnipotent-engineer/lso-os 等） | ❌ 禁用 | - |

---

## 用户规则

1. **规则 1** — 言简意赅，只提取任务核心需求，节省 token，不走无关路径
2. **规则 2** — 把流程和系统性的结构进行建模，先分析预算进行对齐步骤，先进行图谱化构建再去拆解任务流程以最大化省决策成本

---

> 本配置快照取自 `C:\Users\Acer\.trae\`，不包含敏感凭证（JWT Token 等）。
> 部署到新环境时按需修改 `mcp.json` 中的路径和 `skill-config.json` 中的 Skill 列表。