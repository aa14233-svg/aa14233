"""
实验4: 检索增强生成 (RAG) 流程模拟
============================================
实验目的:
  - 理解 RAG (Retrieval-Augmented Generation) 的核心流程
  - 掌握 Embedding + Cosine 相似度检索的基本方法
  - 体验"检索→融合"的 pipeline

前置知识:
  - 文本向量化（用随机向量模拟 embedding）
  - Cosine 相似度
  - Top-K 检索

运行方式:
  python rag_demo.py

依赖:
  - numpy (pip install numpy)
"""

import sys

try:
    import numpy as np
except ImportError:
    print("错误: 需要安装 numpy 才能运行此实验")
    print("请执行: pip install numpy")
    sys.exit(1)


def cosine_similarity(a, b):
    dot = np.dot(a, b)
    return dot / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12)


def main():
    print("=" * 60)
    print("实验4: 检索增强生成 (RAG) 流程模拟")
    print("=" * 60)

    # ---------- 1. 构建小型文档库 ----------
    print("\n--- 1. 文档库 ---")
    documents = [
        "Python是一种广泛使用的高级编程语言",
        "深度学习是机器学习的一个子领域",
        "Transformer架构彻底改变了自然语言处理",
        "卷积神经网络(CNN)擅长处理图像数据",
        "循环神经网络(RNN)用于处理序列数据",
        "注意力机制允许模型关注输入的不同部分",
        "向量数据库专门用于存储和检索向量嵌入",
        "大语言模型(LLM)能够理解和生成自然语言",
        "RAG结合了检索系统和生成模型的优势",
        "梯度下降是最常用的优化算法之一",
    ]

    doc_ids = [f"doc_{i:02d}" for i in range(len(documents))]
    print(f"共 {len(documents)} 篇文档:")
    for i, doc in enumerate(documents):
        print(f"  {doc_ids[i]}: {doc}")

    # ---------- 2. 模拟 Embedding ----------
    print("\n--- 2. 文档 Embedding (随机向量模拟) ---")
    np.random.seed(42)
    embedding_dim = 16
    doc_embeddings = np.random.randn(len(documents), embedding_dim).astype(np.float32)
    doc_embeddings = doc_embeddings / np.linalg.norm(doc_embeddings, axis=1, keepdims=True)
    print(f"文档 Embedding 矩阵 shape: {doc_embeddings.shape}")
    print(f"每个文档用 {embedding_dim} 维向量表示")

    # ---------- 3. 查询 ----------
    print("\n--- 3. 查询 (Query) ---")
    queries = [
        "什么是Transformer",
        "图像识别技术",
        "检索增强生成",
    ]

    query_embeddings = np.random.randn(len(queries), embedding_dim).astype(np.float32)
    query_embeddings = query_embeddings / np.linalg.norm(query_embeddings, axis=1, keepdims=True)

    # 为了让检索结果更有区分度，手动调整 query embedding 使其与相关文档更接近
    # 实际上在真实RAG中，同一个编码器会编码query和doc
    # 这里我们模拟：query_0 ≈ doc_2 (Transformer), query_1 ≈ doc_3 (CNN), query_2 ≈ doc_8 (RAG)
    query_embeddings[0] = doc_embeddings[2] * 0.8 + np.random.randn(embedding_dim) * 0.2
    query_embeddings[0] = query_embeddings[0] / np.linalg.norm(query_embeddings[0])
    query_embeddings[1] = doc_embeddings[3] * 0.8 + np.random.randn(embedding_dim) * 0.2
    query_embeddings[1] = query_embeddings[1] / np.linalg.norm(query_embeddings[1])
    query_embeddings[2] = doc_embeddings[8] * 0.8 + np.random.randn(embedding_dim) * 0.2
    query_embeddings[2] = query_embeddings[2] / np.linalg.norm(query_embeddings[2])

    for qi, q in enumerate(queries):
        print(f"  Query [{qi}]: \"{q}\"")

    # ---------- 4. 检索 ----------
    print("\n--- 4. 检索 (Top-K Retrieval) ---")
    K = 3
    for qi, q in enumerate(queries):
        q_vec = query_embeddings[qi]
        scores = [cosine_similarity(q_vec, doc_embeddings[i]) for i in range(len(documents))]
        top_k = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:K]

        print(f"\n  Query: \"{q}\"")
        print(f"  Top-{K} 检索结果:")
        for rank, (doc_idx, score) in enumerate(top_k):
            print(f"    #{rank+1}  {doc_ids[doc_idx]} (相似度: {score:.4f}) → {documents[doc_idx]}")

    # ---------- 5. 完整 RAG 流程展示 ----------
    print("\n--- 5. 完整 RAG 流程演示 ---")
    print("""
  用户输入: "Transformer是什么？"
      │
      ▼
  ┌─────────────┐
  │  Query编码   │  (将文本转为向量)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     ┌──────────────────┐
  │  向量检索    │ ──→ │ 文档向量库 (10篇) │
  │  (Top-3)    │     └──────────────────┘
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  检索结果    │
  │  doc_02     │  "Transformer架构彻底改变了自然语言处理"
  │  doc_04     │  "循环神经网络(RNN)用于处理序列数据"
  │  doc_05     │  "注意力机制允许模型关注输入的不同部分"
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  LLM生成    │  (将query + 检索结果送入LLM)
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  最终回答    │  "Transformer是一种基于注意力机制的..."
  └─────────────┘
""")

    print("=" * 60)
    print("实验完成! 本实验模拟了 RAG 的核心检索环节。")
    print("实际 RAG 系统使用真实预训练 Embedding 模型并集成 LLM。")
    print("=" * 60)


if __name__ == "__main__":
    main()
