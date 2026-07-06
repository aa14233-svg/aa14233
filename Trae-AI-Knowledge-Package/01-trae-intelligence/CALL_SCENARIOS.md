<!-- AI AGENT ANNOTATION
  本文档定义各 Agent 的调用时机和场景。
  AI 在收到任务后，可参考此文档决定调用哪些 Agent。
-->

# Trae 智能体 - 调用场景与时机

## Agent 调用场景

| Agent | 调用时机 | 典型场景 |
|-------|---------|---------|
| CodeAgent | 编写/重构/优化代码 | 新建功能、重构、性能优化 |
| DevAgent | 项目管理、工具配置 | Git操作、CI/CD、环境搭建 |
| DocAgent | 文档编辑、整理、翻译 | README、API文档、翻译 |
| DataAgent | 数据处理、分析、可视化 | 数据清洗、统计、图表 |
| SecurityAgent | 安全审计、漏洞检测 | 安全审计、配置检查 |
| DeployAgent | 部署运维、环境配置 | 服务部署、环境搭建 |
| CreativeAgent | 创意设计、内容生成 | 文案、设计灵感、命名 |
| LearningAgent | 学习优化、知识整理 | 吸收新知识、技能提升 |
| ProgramDesignerAgent | 架构设计、技术选型 | 新项目架构、系统设计 |
| ArtisticDesignerAgent | UI/UX、视觉设计 | 界面设计、动效、品牌 |
| RTKSpecialistAgent | Redux状态管理 | React项目、状态架构 |
| HeadroomDesignerAgent | 用户体验优化 | 滚动交互、导航、动效 |
| CodeGraphArchitectAgent | 代码分析、图谱构建 | 代码理解、重构分析 |

## 协同工作流

### 完整应用开发
1. ProgramDesignerAgent → 架构设计
2. ArtisticDesignerAgent → 视觉设计
3. RTKSpecialistAgent → 状态管理
4. CodeAgent + DevAgent → 编码
5. CodeGraphArchitectAgent → 代码分析
6. SecurityAgent → 安全检查
7. DeployAgent → 部署

### UI 翻新
1. ArtisticDesignerAgent → 视觉设计
2. HeadroomDesignerAgent → UX 优化
3. CodeAgent → 实现
