<!-- AI AGENT ANNOTATION
  AI 编码优化工具集。集成 rtk/headroom/codegraph/Obsidian/PostgreSQL。
  用于优化 AI 编码工作流，减少 token 消耗。
-->

# AI Coding Optimizer

## 工具集
1. **rtk** — CLI proxy，减少 LLM token 消耗 60-90%
2. **headroom** — 上下文压缩层，节省 60-95% token
3. **codegraph** — 本地代码知识图谱引擎
4. **Obsidian** — 本地知识库和文档生成器
5. **PostgreSQL** — 持久化数据库（日志/指标/历史）

## 架构
```
Your Code → [codegraph] → [headroom] → [rtk] → LLM
```

## MCP 配置（5个 Server）
见 03-mcp-configs/ai-coding-optimizer-mcp.json
