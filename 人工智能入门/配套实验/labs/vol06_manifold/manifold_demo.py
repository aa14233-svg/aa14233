"""
实验6: 流形学习与降维 (Manifold Learning)
============================================
实验目的:
  - 理解"流形假设"：高维数据通常位于低维流形上
  - 对比线性降维 (PCA) 与非线性降维 (t-SNE) 的效果
  - 观察 Swiss Roll 数据集在降维过程中的结构保持

前置知识:
  - PCA: 主成分分析，保留最大方差方向
  - t-SNE: t-分布邻域嵌入，保持局部邻域结构
  - 流形学习的基本概念

运行方式:
  python manifold_demo.py

依赖:
  - numpy (pip install numpy)
  - scikit-learn (pip install scikit-learn)
"""

import sys

try:
    import numpy as np
except ImportError:
    print("错误: 需要安装 numpy 才能运行此实验")
    print("请执行: pip install numpy")
    sys.exit(1)

try:
    from sklearn.datasets import make_swiss_roll
    from sklearn.decomposition import PCA
    from sklearn.manifold import TSNE
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("警告: sklearn 未安装，将使用模拟数据")
    print("建议安装: pip install scikit-learn\n")


def generate_swiss_roll(n_samples=1500, noise=0.1):
    """模拟生成瑞士卷数据"""
    np.random.seed(42)
    t = 1.5 * np.pi * (1 + 2 * np.random.rand(n_samples))
    x = t * np.cos(t)
    y = 2 * np.random.rand(n_samples)
    z = t * np.sin(t)
    data = np.column_stack([x, y, z])
    # 添加噪声
    data += noise * np.random.randn(n_samples, 3)
    # 颜色映射（用于可视化，这里用 t 值）
    colors = t / t.max()
    return data, colors


def main():
    print("=" * 60)
    print("实验6: 流形学习与降维 (Manifold Learning)")
    print("=" * 60)

    # ---------- 1. 生成瑞士卷数据 ----------
    print("\n--- 1. 生成或加载数据 ---")
    if SKLEARN_AVAILABLE:
        X, t = make_swiss_roll(n_samples=1500, noise=0.1, random_state=42)
        print(f"使用 sklearn.make_swiss_roll 生成")
    else:
        X, t = generate_swiss_roll()
        print(f"使用模拟生成器")

    print(f"数据 shape: {X.shape}")
    print(f"原始维度: {X.shape[1]}D (3维空间)")
    print(f"样本数: {X.shape[0]}")
    print(f"本征维度: 2D (瑞士卷本质上是卷曲的2D平面)")

    # ---------- 2. PCA 降维 ----------
    print("\n--- 2. PCA 降维 (线性) ---")
    if SKLEARN_AVAILABLE:
        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(X)
        # 输出解释方差比
        print(f"各主成分解释方差比 (Explained Variance Ratio):")
        for i, ratio in enumerate(pca.explained_variance_ratio_):
            print(f"  PC{i+1}: {ratio:.4f} ({ratio*100:.2f}%)")
        print(f"累计解释方差 (2 components): {pca.explained_variance_ratio_.sum():.4f} ({pca.explained_variance_ratio_.sum()*100:.2f}%)")
        print(f"\nPCA 降维后 shape: {X_pca.shape}")
    else:
        print("sklearn 不可用，执行简化版 PCA...")
        # 手动 PCA
        X_centered = X - X.mean(axis=0)
        cov = np.cov(X_centered.T)
        eigenvalues, eigenvectors = np.linalg.eigh(cov)
        # 降序排序
        idx = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]
        total = eigenvalues.sum()
        print(f"各主成分解释方差比:")
        for i in range(2):
            print(f"  PC{i+1}: {eigenvalues[i]/total:.4f} ({eigenvalues[i]/total*100:.2f}%)")
        print(f"累计解释方差 (2 components): {eigenvalues[:2].sum()/total:.4f} ({(eigenvalues[:2].sum()/total)*100:.2f}%)")
        X_pca = X_centered @ eigenvectors[:, :2]

    # ---------- 3. t-SNE 降维 ----------
    print("\n--- 3. t-SNE 降维 (非线性) ---")
    if SKLEARN_AVAILABLE:
        print("运行 t-SNE（可能需要几秒钟）...")
        tsne = TSNE(n_components=2, perplexity=30, random_state=42, init='random')
        X_tsne = tsne.fit_transform(X)
        print(f"t-SNE 降维后 shape: {X_tsne.shape}")
        print(f"t-SNE 迭代次数: {tsne.n_iter_}")
    else:
        print("sklearn 不可用，跳过 t-SNE 降维")
        print("提示: 安装 scikit-learn 后可以体验 t-SNE 效果")
        X_tsne = None

    # ---------- 4. 对比分析 ----------
    print("\n--- 4. 降维结果对比 ---")
    print(f"{'指标':<30} {'PCA (线性)':<18} {'t-SNE (非线性)'}")
    print("-" * 65)
    print(f"{'数据类型':<30} {'全局结构保持':<18} {'局部邻域保持'}")
    print(f"{'计算速度':<30} {'快':<18} {'慢'}")
    print(f"{'可解释性':<30} {'高 (有数学意义)':<18} {'低 (仅可视化)'}")
    print(f"{'对新数据的支持':<30} {'支持 (transform)':<18} {'不支持 (必须重跑)'}")

    # ---------- 5. 输出用于绘图的降维数据 ----------
    print("\n--- 5. 前10个样本降维结果 ---")
    print(f"{'样本':<8} {'PCA_x':<12} {'PCA_y':<12}", end="")
    if X_tsne is not None:
        print(f"{'t-SNE_x':<12} {'t-SNE_y':<12}", end="")
    print()
    print("-" * (35 if X_tsne is None else 55))
    for i in range(10):
        print(f"{i:<8} {X_pca[i,0]:<+12.4f} {X_pca[i,1]:<+12.4f}", end="")
        if X_tsne is not None:
            print(f" {X_tsne[i,0]:<+12.4f} {X_tsne[i,1]:<+12.4f}", end="")
        print()

    # ---------- 6. 总结 ----------
    print("""
\n流形学习核心思想:
  - 高维数据往往位于一个低维流形上
  - PCA 擅长保持全局方差（展开瑞士卷时会破坏拓扑）
  - t-SNE 擅长保持局部邻域关系（能展开瑞士卷）
  - 降维常用于: 可视化、去噪、特征提取、加速下游算法

扩展阅读:
  - UMAP: 比 t-SNE 更快的流形降维方法
  - Isomap: 使用测地线距离保持全局几何
  - LLE: 局部线性嵌入
""")

    print("=" * 60)
    print("实验完成! 降维结果数据可在 Python 中进一步可视化。")
    print("=" * 60)


if __name__ == "__main__":
    main()
