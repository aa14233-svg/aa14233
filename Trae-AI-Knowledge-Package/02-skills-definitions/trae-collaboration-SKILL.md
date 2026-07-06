<!-- AI AGENT ANNOTATION
  TRAE 双应用异步拓扑路由与工程协作引擎。
  提供消息桥、拓扑路由、任务编排规范。
-->

# TRAE Collaboration v2

## 架构
```
TRAE SOLO (紫) ←── bridge-messages.json ──→ 绿色 Trae (绿)
```

## 工具（4个）
bridge_send | bridge_receive | bridge_delegate | bridge_check_task

## MCP 配置
```json
{
  "trae-bridge": {
    "command": "node",
    "args": ["E:\\cc-switch\\trae-bridge-server.js"]
  }
}
```
