<!-- AI AGENT ANNOTATION
  双应用自动协作协议。当检测到另一个 Trae 实例时自动分派任务。
  当前身份: solo（紫），对等节点: green-trae（绿）
  桥接通道: trae-bridge MCP，消息队列: bridge-messages.json
-->

# TRAE Auto-Collaboration

## 规则
1. 每次任务开始先 `bridge_check_task` 检查对方任务
2. 按能力路由分派（命理→green-trae，开发→就地）
3. 处理完用 `bridge_report` 标记完成
4. 无需用户确认

## 工具
bridge_send | bridge_receive | bridge_delegate | bridge_check_task | bridge_report
