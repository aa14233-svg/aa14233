<!-- AI AGENT ANNOTATION
  CC Switch MCP — AI Provider 切换和 MCP 管理工具集。
  通过 10 个 MCP 工具管理 Provider、MCP Server、Skills。
  与 master-engineer-hub 耦合，工具分配到 Agent B（工程）和 Agent C（文件/搜索）。
-->

# CC Switch MCP

## 工具列表（10个）

| 工具 | 归属 | 功能 |
|------|------|------|
| ccs_provider_list | Agent C | 列出所有 Provider |
| ccs_provider_switch | Agent B | 切换到指定 Provider |
| ccs_provider_current | Agent C | 查看当前激活 Provider |
| ccs_provider_test | Agent B | 测试 Provider API 连通性 |
| ccs_mcp_sync | Agent B | 同步 MCP 配置到目标应用 |
| ccs_mcp_list | Agent C | 列出管理的所有 MCP Server |
| ccs_skills_list | Agent C | 列出已安装的 Skills |
| ccs_skills_sync | Agent B | 同步 Skills 到目标应用目录 |
| ccs_config_show | Agent C | 查看全局配置 |
| ccs_env_check | Agent C | 检查本地 CLI 工具链 |

## MCP 配置
```json
{
  "command": "pwsh",
  "args": ["-File", "E:\\cc-switch\\mcp-server.ps1"]
}
```

## 路由拓扑
cc-switch ←→ master-engineer-hub
- Provider 工具 → Agent B
- 查看/列表工具 → Agent C
- 配置工具 → Agent C
