"""
实验11: 稀疏自编码器 (Sparse Autoencoder)
============================================
实验目的:
  - 理解自编码器的基本结构：编码器 → 隐层 → 解码器
  - 掌握 L1 正则化实现稀疏性的原理
  - 观察稀疏度指标如何反映隐层激活的稀疏程度

前置知识:
  - 自编码器: 以自身为监督信号的神经网络
  - 稀疏编码: 用少量活跃神经元表示输入
  - L1 正则化: 通过惩罚绝对值之和促进稀疏性

运行方式:
  python sae_demo.py

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


class SparseAutoencoder:
    """极简稀疏自编码器（单隐层）"""

    def __init__(self, input_dim: int, hidden_dim: int, l1_lambda: float = 0.01):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.l1_lambda = l1_lambda  # L1 正则化强度

        # Xavier 初始化
        limit = np.sqrt(6.0 / (input_dim + hidden_dim))
        self.W1 = np.random.uniform(-limit, limit, (input_dim, hidden_dim)).astype(np.float32)
        self.b1 = np.zeros(hidden_dim, dtype=np.float32)
        self.W2 = np.random.uniform(-limit, limit, (hidden_dim, input_dim)).astype(np.float32)
        self.b2 = np.zeros(input_dim, dtype=np.float32)

        self.hidden = None  # 保存隐层激活值

    def forward(self, x):
        """前向传播"""
        # 编码: x → hidden (使用 ReLU 激活)
        z1 = x @ self.W1 + self.b1
        self.hidden = np.maximum(0, z1)  # ReLU
        # 解码: hidden → reconstructed
        z2 = self.hidden @ self.W2 + self.b2
        reconstructed = 1.0 / (1.0 + np.exp(-z2))  # Sigmoid
        return reconstructed

    def compute_loss(self, x, reconstructed):
        """计算损失 = 重构误差 + L1 稀疏正则项"""
        # MSE 重构损失
        recon_loss = np.mean((x - reconstructed) ** 2)
        # L1 稀疏正则: 鼓励隐层激活接近 0
        l1_penalty = self.l1_lambda * np.mean(np.abs(self.hidden))
        return recon_loss + l1_penalty, recon_loss, l1_penalty

    def compute_sparsity(self, threshold=0.1):
        """计算稀疏度指标"""
        if self.hidden is None:
            return 0.0, 0.0
        # 激活率: 激活值 > threshold 的比例
        activation_rate = np.mean(self.hidden > threshold)
        # 稀疏度: 1 - 激活率
        sparsity = 1.0 - activation_rate
        # 平均激活值
        mean_activation = np.mean(self.hidden)
        # 活跃神经元占比（整体维度上）
        per_neuron_rate = np.mean(self.hidden > threshold, axis=0)
        dead_neurons = np.mean(per_neuron_rate < 0.01)  # 几乎永不激活的神经元比例
        return sparsity, activation_rate, mean_activation, dead_neurons


def main():
    print("=" * 60)
    print("实验11: 稀疏自编码器 (Sparse Autoencoder)")
    print("=" * 60)

    np.random.seed(42)

    # ---------- 生成数据 ----------
    print("\n--- 1. 生成模拟数据 ---")
    input_dim = 20
    n_samples = 200
    # 生成稀疏特征数据：每个样本只有少数几个非零特征
    X = np.zeros((n_samples, input_dim), dtype=np.float32)
    for i in range(n_samples):
        n_active = np.random.randint(2, 5)  # 每个样本 2-4 个非零特征
        active_idx = np.random.choice(input_dim, n_active, replace=False)
        X[i, active_idx] = np.random.uniform(0.5, 1.0, n_active)

    print(f"数据 shape: {X.shape}")
    print(f"每样本平均非零特征: {np.mean(np.count_nonzero(X, axis=1)):.1f}")
    print(f"整体稀疏度: {1.0 - np.mean(X > 0):.2%}")

    # ---------- 初始化 SAE ----------
    print("\n--- 2. 初始化稀疏自编码器 ---")
    hidden_dim = 10
    sae = SparseAutoencoder(input_dim, hidden_dim, l1_lambda=0.05)
    print(f"输入维度: {input_dim}")
    print(f"隐层维度: {hidden_dim}")
    print(f"L1 正则系数: {sae.l1_lambda}")
    print(f"参数总量: {input_dim * hidden_dim + hidden_dim + hidden_dim * input_dim + input_dim}")

    # ---------- 前向传播 ----------
    print("\n--- 3. 前向传播 ---")
    sample = X[:5]  # 取前5个样本
    recon = sae.forward(sample)
    loss, recon_loss, l1_loss = sae.compute_loss(sample, recon)
    sparsity, act_rate, mean_act, dead_ratio = sae.compute_sparsity()

    print(f"输入 (前5样本, 前8维):")
    print(sample[:, :8])
    print(f"\n重构输出 (前5样本, 前8维):")
    print(np.round(recon[:, :8], 4))
    print(f"\n隐层激活 (前5样本):")
    print(np.round(sae.hidden, 4))

    # ---------- 损失分析 ----------
    print("\n--- 4. 损失分析 ---")
    print(f"总损失: {loss:.6f}")
    print(f"重构误差 (MSE): {recon_loss:.6f}")
    print(f"L1 稀疏正则: {l1_loss:.6f}")

    # ---------- 稀疏度指标 ----------
    print("\n--- 5. 稀疏度指标 ---")
    sparsity, act_rate, mean_act, dead_ratio = sae.compute_sparsity(threshold=0.1)
    print(f"隐层稀疏度: {sparsity:.2%} (值越高越稀疏)")
    print(f"激活率 (active > 0.1): {act_rate:.2%}")
    print(f"平均激活值: {mean_act:.4f}")

    # ---------- 不同 L1 系数对比 ----------
    print("\n--- 6. 不同 L1 系数的效果对比 ---")
    l1_values = [0.0, 0.001, 0.01, 0.05, 0.1]
    print(f"{'L1系数':<12} {'重构误差':<14} {'L1损失':<14} {'稀疏度':<12} {'激活率':<12}")
    print("-" * 65)
    for l1 in l1_values:
        test_sae = SparseAutoencoder(input_dim, hidden_dim, l1_lambda=l1)
        test_recon = test_sae.forward(sample)
        _, t_recon, t_l1 = test_sae.compute_loss(sample, test_recon)
        t_sparsity, t_act, _, _ = test_sae.compute_sparsity()
        print(f"{l1:<12.3f} {t_recon:<+14.6f} {t_l1:<+14.6f} {t_sparsity:<+11.2%} {t_act:<+11.2%}")

    # ---------- 总结 ----------
    print("""
\n核心要点:
  1) 自编码器通过"压缩→重构"学习数据的有效表示
  2) L1 正则化惩罚隐层激活的绝对值之和 → 强制稀疏
  3) L1 系数越大 → 隐层越稀疏 → 但重构误差可能变大
  4) 稀疏自编码器在以下场景有用:
     - 特征学习（无监督预训练）
     - 异常检测（重构误差大的样本可能是异常）
     - 字典学习（学到基函数）

注意: 实际 SAE 需要梯度下降训练多个 epoch，
      本实验仅展示了单次前向传播和稀疏度测量。
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
