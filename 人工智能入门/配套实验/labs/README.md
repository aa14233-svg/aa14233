# 《人工智能入门》配套实验 — 实验映射总表

| 序号 | 目录 | 文件名 | 实验主题 | 对应卷章 | 核心概念 | 依赖 |
|------|------|--------|----------|----------|----------|------|
| 1 | `vol01_cache_simd/` | `check_cache.py` | 缓存行效应 | 卷1: 硬件基础 | CPU缓存、空间局部性、内存访问模式 | 标准库 |
| 2 | `vol02_tensor_basics/` | `tensor_ops.py` | 张量基本操作 | 卷2: Tensor基础 | shape/reshape/transpose/broadcasting/矩阵乘法 | numpy |
| 3 | `vol03_embedding/` | `embedding_demo.py` | Embedding与相似度 | 卷3: 词嵌入 | Embedding Lookup、Cosine相似度 | numpy |
| 4 | `vol04_rag/` | `rag_demo.py` | RAG检索流程模拟 | 卷4: RAG | 文档库构建、向量检索、Top-K | numpy |
| 5 | `vol05_memory/` | `memory_demo.py` | LRU Cache与命中率 | 卷5: 记忆系统 | LRU算法、缓存命中率、访问模式 | 标准库 |
| 6 | `vol06_manifold/` | `manifold_demo.py` | 流形学习与降维 | 卷6: 流形 | Swiss Roll、PCA、t-SNE、解释方差比 | numpy, sklearn* |
| 7 | `vol07_neurosymbolic/` | `logic_demo.py` | 约束求解 | 卷7: 神经符号 | Z3 SMT、回溯搜索、CSP | z3-solver* |
| 8 | `vol09_kernel/` | `kernel_demo.py` | 虚拟内存查询 | 卷9: 内核 | Windows API、页表、虚拟地址 | ctypes (Win) |
| 9 | `vol10_topology/` | `topology_demo.py` | 图拓扑分析 | 卷10: 拓扑 | PageRank、社区发现、中心性 | networkx* |
| 10 | `vol11_sae/` | `sae_demo.py` | 稀疏自编码器 | 卷11: SAE | L1正则化、稀疏度、重构误差 | numpy |
| 11 | `vol12_zkml/` | `zkml_demo.py` | Merkle Tree验证 | 卷12: ZKML | SHA-256、Merkle Proof、零知识 | 标准库 |
| 12 | `vol_ag01_model_selection/` | `model_benchmark.py` | 模型精度/速度权衡 | 附录01: 模型选择 | 复杂度权衡、过拟合、Pareto前沿 | numpy |

## 运行环境要求

### 必备依赖 (大部分实验)
- **Python 3.8+**
- **numpy** — 实验 2, 3, 4, 6, 11, AG01 需要（至少6个实验）

### 可选依赖 (有 fallback)
- **scikit-learn** — 实验 6 (t-SNE降维，无则提供模拟数据)
- **networkx** — 实验 10 (图分析，无则提供纯Python实现)
- **z3-solver** — 实验 7 (约束求解，无则提供回溯搜索)

### 无需依赖 (仅标准库即可运行)
- 实验 1 (`check_cache.py`)
- 实验 5 (`memory_demo.py`)
- 实验 9 (`kernel_demo.py`)
- 实验 12 (`zkml_demo.py`)

## 快速验证

```bash
# 检查所有实验是否能导入（不运行）
python -c "
import sys
tests = [
    ('vol01_cache_simd.check_cache', []),
    ('vol02_tensor_basics.tensor_ops', ['numpy']),
    ('vol03_embedding.embedding_demo', ['numpy']),
    ('vol04_rag.rag_demo', ['numpy']),
    ('vol05_memory.memory_demo', []),
    ('vol06_manifold.manifold_demo', ['numpy']),
    ('vol07_neurosymbolic.logic_demo', ['z3']),
    ('vol09_kernel.kernel_demo', []),
    ('vol10_topology.topology_demo', ['networkx']),
    ('vol11_sae.sae_demo', ['numpy']),
    ('vol12_zkml.zkml_demo', []),
    ('vol_ag01_model_selection.model_benchmark', ['numpy']),
]
for mod, deps in tests:
    for d in deps:
        try: __import__(d)
        except: print(f'[WARN] {mod}: {d} not installed')
    print(f'[OK] {mod}')
"
```

## 建议学习顺序

```
基础 → 应用 → 系统 → 前沿
 1         4         7         11
 2         5         8         12
 3         6         9         AG01
          \         /
          10 (交叉)
```

- **基础层** (1-3): 硬件感知、张量操作、Embedding
- **应用层** (4-6): RAG、缓存、降维
- **系统层** (7-10): 约束求解、内核、图分析、拓扑
- **前沿层** (11-12, AG01): SAE、ZK、模型选择
