# LSO-DAO 源码体系

<!-- AI AGENT ANNOTATION
  LSO-DAO 是系统的核心 Rust 实现，实现了五境递进架构。
  源码在 e:\lso\lso-dao\src\。
  AI 如需理解系统底层运行机制，请深入阅读各模块。
-->

## 架构总览

```
src/
├── main.rs          # 主入口
├── lib.rs           # 库入口
├── kernel.rs        # 内核模块
├── gate.rs          # 五行门控（元婴境）
├── dispatch.rs      # 技能路由（化神境）
├── domains.rs       # 域映射（元婴境）
├── types.rs         # 类型定义（筑基境）
├── api.rs           # API 接口
├── security.rs      # 安全扫描（金丹境）
├── cluster.rs       # Agent 集群
├── ingest.rs        # 数据摄取（吸）
├── evolve.rs        # 系统演化（化→归墟）
├── introspect.rs    # 内省（渡劫境）
├── acceptance.rs    # 验收（渡劫境）
├── fidelity.rs      # 保真度（化神境）
├── fallback.rs      # 回退（化神境）
└── rag/
    ├── mod.rs       # RAG 模块入口
    ├── correction.rs # 纠正逻辑
    ├── division.rs  # 划分逻辑
    └── ripgrep.rs   # ripgrep 集成
```

## 五境源码映射

| 境界 | 源文件 | 职责 |
|------|--------|------|
| 筑基 | types.rs | 基础类型和数据结构 |
| 金丹 | security.rs | 安全扫描和验证 |
| 元婴 | gate.rs, domains.rs | 五行门控 + 域映射 |
| 化神 | dispatch.rs, fallback.rs, fidelity.rs | 路由 + 回退 + 保真度 |
| 渡劫 | acceptance.rs, evolve.rs, introspect.rs | 验收 + 演化 + 内省 |

## 呼吸管道映射

| 阶段 | 源文件 | 操作 |
|------|--------|------|
| 吸(ingest) | ingest.rs | 解析输入，提取实体/意图 |
| 存(hold) | security.rs | 验证安全，检查禁区 |
| 呼(exhale) | dispatch.rs | 路由到 Agent |
| 化(evolve) | evolve.rs | 系统执行和优化 |
| 归墟(feedback) | introspect.rs + acceptance.rs | 内省 + 验收 |
