# MCP 配置

<!-- AI AGENT ANNOTATION
  本目录包含所有 MCP Server 的配置文件。
  MCP (Model Context Protocol) 是 AI 智能体与外部工具通信的协议。
  每个 JSON 文件定义了一组 MCP Server 的启动命令和参数。
  
  配置方式：
  1. 将对应配置合并到项目的 .trae/mcp.json 中
  2. 或在 Trae 的工作区配置中添加
  3. 重启 Trae IDE 使配置生效
-->

## MCP 服务器总览

| MCP Server | 工具数 | 用途 | 配置来源 |
|-----------|--------|------|---------|
| cc-switch | 10 | Provider 切换、MCP 管理 | `cc-switch-mcp-config.json` |
| token-stats | 6 | Token 审计、预算管理 | `cc-switch-mcp-config.json` |
| master-engineer-hub | 6 | 路由编排、引力盆 | `cc-switch-mcp-config.json` |
| trae-relay | 1 | WebSocket 中继 (port 9877) | `cc-switch-mcp-config.json` |
| trae-bridge | 4 | 双应用消息桥 | `cc-switch-mcp-config.json` |
| obsidian-files | 1 | Obsidian 文件访问 | `ai-coding-optimizer-mcp.json` |
| obsidian-search | 1 | Obsidian 混合搜索 | `ai-coding-optimizer-mcp.json` |
| postgres | 1 | PostgreSQL 数据库 | `ai-coding-optimizer-mcp.json` |
| postgres-admin | 1 | PostgreSQL 管理 | `ai-coding-optimizer-mcp.json` |
| rag-search | 1 | RAG 混合搜索 | `ai-coding-optimizer-mcp.json` |
