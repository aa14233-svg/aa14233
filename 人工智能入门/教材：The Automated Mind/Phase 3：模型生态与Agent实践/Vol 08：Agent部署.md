> **👨‍🏫 教授说**
> 前置条件：Phase 2 + AG-01
> 概念阶梯：部署架构（★★）→ 服务化（★★★）
>
> **🧑‍💻 TA说**
> 动手入口 → 先跑起来：无配套实验。可使用以下FastAPI模板快速部署一个Agent服务：
> ```python
> from fastapi import FastAPI
> from pydantic import BaseModel
>
> app = FastAPI()
>
> class Query(BaseModel):
>     prompt: str
>     session_id: str
>
> @app.post("/agent")
> async def agent_endpoint(q: Query):
>     # Agent推理逻辑
>     result = await run_agent(q.prompt, q.session_id)
>     return {"response": result}
> ```
>
> **🧑‍💻 TA说**
> 部署Agent和部署普通Web服务完全不一样。Agent是无状态的（每次调用独立），但Agent的工作流是有状态的（多步推理需要保持上下文）。这给负载均衡上了难度——你不能简单地把请求轮询到任意实例。

---

# Vol 08：Agent部署

## 开章

Agent的本质是**自动控制系统**——感知环境、做出决策、执行动作、观察结果。

## 8.1 ReAct框架

Thought → Action → Observation → Thought → ...

> 💡 **通俗解释**：ReAct = "想一下→做一下→看一下结果→再想一下"的循环。普通LLM就像"考官直接给答案"——一步到位但可能错。ReAct让LLM像"侦探破案"：先推理（"根据线索X，窃贼可能从窗户进入"）→然后行动（"查窗户是否有撬痕"）→观察结果（"确认被撬"）→再推理（"下一步查指纹"）。每一步都可以自我纠偏。

Thought让LLM可以自我纠偏。

## 8.2 状态机对Agent的硬性约束

纯LLM驱动的Agent：幻觉沿行动链传播。FSM定义合法状态和转移路径：

> 💡 **通俗解释**：FSM（有限状态机）= 给Agent画了一张"只能走红线的地图"。LLM自由发挥的后果是"想去哪就去哪，可能掉坑里"。FSM预先定义好合法状态（空闲/搜索中/分析中/等待确认/执行中/完成/错误）和允许的跳转（比如"等待确认"之后只能去"执行中"或"空闲"，不能直接跳"完成"）。LLM只能在地图红线内做选择，从根本上杜绝了非法路径。

```
状态: {IDLE, SEARCHING, ANALYZING, WAITING_CONFIRM, EXECUTING, DONE, ERROR}
```

→ 这是[[教材：The Automated Mind/Phase 5：规则重塑/Vol 07：数字城邦秩序(Neuro-Symbolic)|Neuro-Symbolic]]在Agent层的最小实现。

## 8.3 异步并发：多Agent通信

```python
await asyncio.gather(researcher_agent("LoRA"), writer_agent(corpus), reviewer_agent(draft))
```

Asyncio允许数十个Agent实例并行，"等待LLM响应"期间不阻塞其他Agent。

## 8.4 具身智能

| 约束 | 云端Agent | 具身Agent |
|------|-----------|-----------|
| 延迟 | 秒级 | 毫秒级 |
| 模型 | 无限制 | <1GB |
| 功耗 | 不限 | 电池约束 |

---

**→ 相关降维概念：** [[手册：核心概念降维缓存/Concept明细/Concept_07：搭建乐高|Concept_07：搭建乐高 (Agent编排)]] · [[手册：核心概念降维缓存/Concept明细/Concept_08：减速带|Concept_08：减速带 (状态机约束)]]

→ [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol 08.5：AI工程项目实战|下一章：Vol 08.5 实践插章]]
