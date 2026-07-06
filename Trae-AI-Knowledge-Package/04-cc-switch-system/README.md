# CC Switch 系统

<!-- AI AGENT ANNOTATION
  CC Switch 是 AI Provider 路由和 MCP 管理系统的核心。
  负责 Provider 切换、MCP Server 管理、Skills 同步和双应用桥接。
  所有 MCP Server 通过 cc-switch.exe 管理。
-->

## 架构

```
cc-switch.exe (可执行文件)
  ├── MCP Server: cc-switch-server.js (10 工具)
  ├── MCP Server: token-stats-server.js (6 工具)
  ├── MCP Server: hub-server.js (6 工具)
  ├── WebSocket: trae-ws-relay.js (port 9877)
  └── 桥接: trae-bridge-server.js (JSON-RPC 2.0)
```

## 文件

| 文件 | 说明 |
|------|------|
| `bridge-messages.json` | 双应用协作消息队列格式 |
| `work-mcp-config.json` | 工作区 MCP 配置 |
| `work-collaboration-skills.md` | 协作技能定义 |

## 关键路径
- 可执行文件: `E:\cc-switch\cc-switch.exe`
- MCP 服务器: `E:\cc-switch\mcp\`
- 桥接消息: `E:\cc-switch\bridge-messages.json`
