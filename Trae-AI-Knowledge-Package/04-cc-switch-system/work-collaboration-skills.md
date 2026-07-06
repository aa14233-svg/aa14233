<!-- AI AGENT ANNOTATION
  双应用协作 Skill 定义。
  当两个 Trae 实例同时在 E: 盘运行时自动激活。
-->

# TRAE 双应用协作 v2

## 架构
```
TRAE SOLO (紫) ←── bridge-messages.json ──→ 绿色 Trae (绿)
```

## 工具（4个）
- bridge_send - 发送消息到对方
- bridge_receive - 接收对方消息
- bridge_delegate - 分派任务给对方自动执行
- bridge_check_task - 检查是否有待处理的 incoming 任务

## 协作规则
1. 每次启动先 bridge_check_task
2. 判断任务领域 → 分派给最合适的实例
3. 处理完用 bridge_report 回传
4. 双应用互信，无需用户干预
