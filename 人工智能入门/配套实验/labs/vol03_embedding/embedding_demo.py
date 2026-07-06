"""
实验3: Embedding 与 Cosine 相似度
============================================
实验目的:
  - 理解 Embedding 的本质：将离散符号映射到稠密向量空间
  - 掌握 Embedding Lookup 操作
  - 通过 Cosine 相似度理解"语义相近 = 向量方向相近"

前置知识:
  - 词嵌入基本概念：Word2Vec, GloVe
  - 向量点积与余弦相似度公式: cos(a,b) = a·b / (|a|*|b|)
  - Embedding 矩阵的形状: vocab_size × embedding_dim

运行方式:
  python embedding_demo.py

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
    """计算两个向量之间的余弦相似度，值域 [-1, 1]"""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def main():
    print("=" * 60)
    print("实验3: Embedding 与 Cosine 相似度 (Simulated Word2Vec Skip-Gram)")
    print("=" * 60)

    # ---------- 配置 ----------
    vocab = ["king", "queen", "man", "woman", "prince", "princess",
             "apple", "banana", "fruit", "car", "truck", "vehicle"]
    vocab_size = len(vocab)
    embedding_dim = 8  # 低维方便观察

    word_to_idx = {w: i for i, w in enumerate(vocab)}
    idx_to_word = {i: w for i, w in enumerate(vocab)}

    print(f"\n词表大小: {vocab_size}")
    print(f"嵌入维度: {embedding_dim}")
    print(f"词表: {vocab}")

    # ---------- 2. 随机初始化 Embedding 矩阵 ----------
    np.random.seed(42)
    embedding_matrix = np.random.randn(vocab_size, embedding_dim).astype(np.float32)
    # 归一化每一行，使 cosine 计算更直观
    embedding_matrix = embedding_matrix / np.linalg.norm(embedding_matrix, axis=1, keepdims=True)

    print(f"\nEmbedding 矩阵 shape: {embedding_matrix.shape}")
    print(f"前3个词嵌入向量 (截断显示):")
    for i in range(3):
        print(f"  {idx_to_word[i]}: {embedding_matrix[i, :6]}...")

    # ---------- 3. Embedding Lookup ----------
    print("\n--- Embedding Lookup ---")
    words = ["king", "queen", "apple"]
    for w in words:
        idx = word_to_idx[w]
        vec = embedding_matrix[idx]
        print(f"  '{w}' (idx={idx}) → 向量前6维: {vec[:6]}")

    # ---------- 4. Cosine 相似度计算 ----------
    print("\n--- Cosine 相似度对比 ---")
    test_pairs = [
        ("king", "queen"),
        ("man", "woman"),
        ("king", "man"),
        ("apple", "banana"),
        ("apple", "car"),
        ("apple", "fruit"),
        ("car", "truck"),
        ("car", "vehicle"),
        ("king", "apple"),   # 应该很低（随机初始化下）
    ]

    print(f"{'词A':<10} {'词B':<10} {'Cosine相似度':<15}")
    print("-" * 40)
    for w1, w2 in test_pairs:
        i1, i2 = word_to_idx[w1], word_to_idx[w2]
        sim = cosine_similarity(embedding_matrix[i1], embedding_matrix[i2])
        bar = "█" * max(1, int(abs(sim) * 30))
        print(f"{w1:<10} {w2:<10} {sim:<+10.4f}  {bar}")

    # ---------- 5. 最相似词查询 ----------
    print("\n--- 最相似词查询 ---")
    query_words = ["king", "apple", "car"]
    for q in query_words:
        q_idx = word_to_idx[q]
        q_vec = embedding_matrix[q_idx]
        similarities = []
        for i in range(vocab_size):
            if i == q_idx:
                continue
            sim = cosine_similarity(q_vec, embedding_matrix[i])
            similarities.append((idx_to_word[i], sim))
        similarities.sort(key=lambda x: x[1], reverse=True)
        top3 = similarities[:3]
        top3_str = ", ".join([f"'{w}' ({s:.4f})" for w, s in top3])
        print(f"  '{q}' 最相似的3个词: {top3_str}")

    # ---------- 6. 解释说明 ----------
    print("""
\n注意:
  由于 embedding 是随机初始化的（未经过训练），
  相似度结果反映的是随机向量间的方向接近程度，
  而非真实的语义关系。

  真实的 Word2Vec 需要通过大量语料训练来学习
  有意义的语义空间分布。本实验仅展示了:
    1) Embedding Lookup 的机制
    2) Cosine 相似度的计算方法
    3) 向量空间的基本操作框架
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
