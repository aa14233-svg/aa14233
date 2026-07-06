"""
实验1: 缓存行效应 (Cache Line Effect)
============================================
实验目的:
  - 理解CPU缓存行的概念（通常64字节）
  - 观察按行访问（顺序内存布局）vs 按列访问（跳跃式内存布局）的性能差异
  - 直观感受"内存访问模式"对程序性能的影响

前置知识:
  - Python列表本质上是连续存储的指针数组
  - CPU读取内存时以一整块（缓存行）为单位加载
  - 按行访问能充分利用缓存空间局部性，按列访问则会反复刷新缓存

运行方式:
  python check_cache.py

预期输出:
  - 矩阵大小信息
  - 按行访问总耗时
  - 按列访问总耗时
  - 速度倍数差异
"""

import time
import sys


def main():
    print("=" * 60)
    print("实验1: 缓存行效应 (Cache Line Effect)")
    print("=" * 60)

    # 使用一个较大的方阵来凸显差异（单位：行/列数）
    # 注意：这里不使用numpy，纯Python list模拟
    N = 4000
    print(f"\n矩阵大小: {N} x {N}")
    print(f"元素总数: {N * N:,}")
    print("构建矩阵...")

    # 创建一个 N x N 的矩阵（二维列表）
    # 用单精度浮点数填充，使数据量更大
    matrix = [[float(i * N + j) for j in range(N)] for i in range(N)]

    print("矩阵构建完成，开始计时测试...\n")

    # ---------- 按行访问（cache-friendly）----------
    row_sum = 0.0
    t0 = time.perf_counter()
    for i in range(N):
        for j in range(N):
            row_sum += matrix[i][j]
    t_row = time.perf_counter() - t0
    print(f"[按行访问] 耗时: {t_row:.4f} 秒  (校验和: {row_sum:.2e})")

    # ---------- 按列访问（cache-unfriendly）----------
    col_sum = 0.0
    t0 = time.perf_counter()
    for j in range(N):          # 外层循环 = 列
        for i in range(N):      # 内层循环 = 行
            col_sum += matrix[i][j]
    t_col = time.perf_counter() - t0
    print(f"[按列访问] 耗时: {t_col:.4f} 秒  (校验和: {col_sum:.2e})")

    # ---------- 结果对比 ----------
    ratio = t_col / t_row if t_row > 0 else float('inf')
    print(f"\n{'=' * 40}")
    print(f"按列 / 按行 耗时比: {ratio:.2f}x")
    if ratio > 1.5:
        print("结论: 按列访问显著慢于按行访问 — 缓存行效应明显!")
    else:
        print("结论: 差异不大 — 可能矩阵较小或缓存预取掩盖了差异。")
    print("=" * 40)

    # ---------- 原理解释 ----------
    print("""
原理说明:
  Python的二维列表 matrix[i][j] 在内存中的布局是:
    matrix → [row0_ptr, row1_ptr, ...]  (连续)
              row0_ptr → [v00, v01, v02, ...]  (连续)
              row1_ptr → [v10, v11, v12, ...]  (连续)
  
  按行访问 (i外层, j内层): 顺序读取同一行 → CPU预取连续缓存行 → 命中率高
  按列访问 (j外层, i内层): 来回在不同行间跳跃 → 每读一个元素都大概率缓存未命中

  CPU缓存行一般大小为 64 字节 = 8 个 double (或 16 个 float)。
  实际项目中，将热数据排列为连续内存访问模式是重要的优化手段。
""")


if __name__ == "__main__":
    main()
