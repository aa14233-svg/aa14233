"""
实验2: 张量基本操作 (Tensor Basics)
============================================
实验目的:
  - 理解张量（Tensor）作为多维数组的核心概念
  - 掌握 shape, reshape, transpose, broadcasting 等基础操作
  - 实践矩阵乘法（张量收缩）

前置知识:
  - 标量 = 0阶张量, 向量 = 1阶张量, 矩阵 = 2阶张量
  - numpy 基础数组操作
  - 矩阵乘法的维度规则: (M,N) @ (N,P) → (M,P)

运行方式:
  python tensor_ops.py

依赖:
  - numpy (pip install numpy)
"""

import sys
import time

try:
    import numpy as np
except ImportError:
    print("错误: 需要安装 numpy 才能运行此实验")
    print("请执行: pip install numpy")
    sys.exit(1)


def main():
    print("=" * 60)
    print("实验2: 张量基本操作 (Tensor Basics)")
    print("=" * 60)

    # ---------- 1. 创建张量与 shape ----------
    print("\n--- 1. 创建张量与 shape ---")
    scalar = np.float32(3.14)
    vector = np.array([1, 2, 3, 4, 5], dtype=np.float32)
    matrix = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)
    tensor3d = np.arange(24, dtype=np.float32).reshape(2, 3, 4)

    print(f"标量 (0阶): {scalar}, shape = {np.shape(scalar)}")
    print(f"向量 (1阶): {vector}, shape = {vector.shape}")
    print(f"矩阵 (2阶):\n{matrix}, shape = {matrix.shape}")
    print(f"3D张量 (3阶): shape = {tensor3d.shape}")
    print(f"  内容:\n{tensor3d}")

    # ---------- 2. Reshape ----------
    print("\n--- 2. Reshape ---")
    a = np.arange(12, dtype=np.float32)
    print(f"原始向量: {a}, shape = {a.shape}")

    a_3x4 = a.reshape(3, 4)
    print(f"reshape(3,4):\n{a_3x4}")

    a_2x2x3 = a.reshape(2, 2, 3)
    print(f"reshape(2,2,3):\n{a_2x2x3}")

    # -1 自动推断
    a_auto = a.reshape(2, -1)
    print(f"reshape(2,-1):\n{a_auto}, shape = {a_auto.shape}")

    # ---------- 3. Transpose ----------
    print("\n--- 3. 转置 (Transpose) ---")
    B = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)
    B_T = B.T
    print(f"原始矩阵 ({B.shape}):\n{B}")
    print(f"转置 ({B_T.shape}):\n{B_T}")

    # 高维转置
    C = np.arange(24, dtype=np.float32).reshape(2, 3, 4)
    C_trans = C.transpose(2, 0, 1)  # 重排轴: (2,0,1) → (4,2,3)
    print(f"3D张量原始 shape: {C.shape}")
    print(f"transpose(2,0,1) 后 shape: {C_trans.shape}")

    # ---------- 4. Broadcasting ----------
    print("\n--- 4. Broadcasting ---")
    print("Broadcasting 允许不同形状的数组进行算术运算")
    print("规则: 从后往前比较维度，要么相等，要么其中一个为1")

    vec = np.array([10, 20, 30], dtype=np.float32)      # shape (3,)
    mat = np.array([[1, 2, 3], [4, 5, 6]], dtype=np.float32)  # shape (2,3)

    result = mat + vec  # vec broadcast to (2,3)
    print(f"矩阵 ({mat.shape}) + 向量 ({vec.shape}):\n{result}")

    # 列向量 broadcast
    col = np.array([[10], [100]], dtype=np.float32)  # shape (2,1)
    result2 = mat + col  # col broadcast to (2,3)
    print(f"矩阵 ({mat.shape}) + 列向量 ({col.shape}):\n{result2}")

    # ---------- 5. 矩阵乘法 ----------
    print("\n--- 5. 矩阵乘法 ---")
    X = np.array([[1, 2], [3, 4], [5, 6]], dtype=np.float32)  # (3,2)
    W = np.array([[0.5, 0.4, 0.3], [0.2, 0.1, 0.0]], dtype=np.float32)  # (2,3)
    Y = X @ W  # (3,2) @ (2,3) → (3,3)
    print(f"X ({X.shape}):\n{X}")
    print(f"W ({W.shape}):\n{W}")
    print(f"X @ W ({Y.shape}):\n{Y}")

    # 批量矩阵乘法（神经网络的典型场景）
    print("\n--- 6. 批量矩阵乘法（模拟 batch inference）---")
    batch_size = 4
    input_dim = 8
    hidden_dim = 16
    batch_input = np.random.randn(batch_size, input_dim).astype(np.float32)
    weight = np.random.randn(input_dim, hidden_dim).astype(np.float32)
    bias = np.random.randn(hidden_dim).astype(np.float32)

    t0 = time.perf_counter()
    output = batch_input @ weight + bias  # broadcasting bias
    t = time.perf_counter() - t0
    print(f"batch_input ({batch_input.shape}) @ weight ({weight.shape}) + bias")
    print(f"output shape: {output.shape}")
    print(f"计算耗时: {t*1000:.3f} ms")
    print(f"output 前5个元素: {output[0, :5]}")

    print("\n" + "=" * 60)
    print("实验完成! 张量操作是深度学习框架（PyTorch/TF/JAX）的基石。")
    print("=" * 60)


if __name__ == "__main__":
    main()
