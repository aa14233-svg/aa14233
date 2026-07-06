---
name: "cc-switch"
description: "CC Switch MCP — AI Provider 切换 / MCP 管理 / Skills 同步 / 环境检测。10个MCP工具。Invoke when需要切换AI供应商、管理MCP配置、查看Provider列表或检测环境工具链。"
---

# CC Switch MCP

AI Provider 路由与 MCP 管理工具集。通过 `cc-switch.exe` 管理 Provider 配置、MCP Server、Skills 同步。

## 工具列表

| 工具 | 归属 | 功能 |
|------|------|------|
| `ccs_provider_list` | Agent C | 列出所有已配置的 Provider |
| `ccs_provider_switch` | Agent B | 切换到指定 Provider |
| `ccs_provider_current` | Agent C | 查看当前激活的 Provider |
| `ccs_provider_test` | Agent B | 测试 Provider API 连通性 |
| `ccs_mcp_sync` | Agent B | 同步 MCP 配置到目标应用 |
| `ccs_mcp_list` | Agent C | 列出管理的所有 MCP Server |
| `ccs_skills_list` | Agent C | 列出已安装的 Skills |
| `ccs_skills_sync` | Agent B | 同步 Skills 到目标应用目录 |
| `ccs_config_show` | Agent C | 查看全局配置 |
| `ccs_env_check` | Agent C | 检查本地 CLI 工具链状态 |

## 路由拓扑

```
cc-switch ←→ master-engineer-hub
  ├─ Provider 工具 → Agent B（工程/编码）
  ├─ 查看/列表工具 → Agent C（文件/搜索）
  └─ 配置工具     → Agent C（文件/搜索）
```

## 与 master-engineer-hub 耦合

master-engineer-hub 的路由网关将 cc-switch 工具分配到：
- **Agent B**：`ccs_provider_switch`, `ccs_mcp_sync`, `ccs_skills_sync`, `ccs_provider_test`
- **Agent C**：`ccs_provider_list`, `ccs_provider_current`, `ccs_mcp_list`, `ccs_skills_list`, `ccs_config_show`, `ccs_env_check`

---

## MCP 配置

```json
{
  "command": "pwsh",
  "args": ["-File", "E:\\cc-switch\\mcp-server.ps1"],
  "description": "cc-switch MCP server — AI Provider switching & management"
}
```
