"""
实验AG01: 模型精度与速度的权衡 (Model Benchmark)
============================================
实验目的:
  - 理解不同"模型复杂度"对预测精度和推理速度的影响
  - 通过模拟实验对比几种"模型"的 accuracy-speed trade-off
  - 体会模型选择中的核心工程权衡

前置知识:
  - 过拟合 vs 欠拟合
  - 模型复杂度与偏差-方差权衡
  - 推理延迟的概念

运行方式:
  python model_benchmark.py

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


# ===================== 模拟"模型" =====================

def model_simple(x, params):
    """简单线性模型: y = w0 + w1*x"""
    return params[0] + params[1] * x


def model_polynomial(x, params):
    """多项式模型: y = sum(w_i * x^i) for i in range(order+1)"""
    order = len(params) - 1
    result = np.zeros_like(x)
    for i, w in enumerate(params):
        result += w * (x ** i)
    return result


def model_neural_like(x, params):
    """模拟神经网络: 两层非线性变换"""
    # 假设参数被组织为 [w0_bias, w0_weight1, ..., w1_bias, w1_weight1, ...]
    n_hidden = 8
    n_input = 1
    W1 = np.array(params[:n_hidden * n_input]).reshape(n_hidden, n_input)
    b1 = np.array(params[n_hidden * n_input:n_hidden * (n_input + 1)])
    W2 = np.array(params[n_hidden * (n_input + 1):]).reshape(1, n_hidden)

    # 前向
    z1 = x.reshape(-1, 1) @ W1.T + b1
    h1 = np.maximum(0, z1)  # ReLU
    y = h1 @ W2.T
    return y.flatten()


def model_ensemble(x, models_and_params):
    """集成模型: 多个模型的加权平均"""
    predictions = []
    weights = []
    for model_fn, model_params, weight in models_and_params:
        pred = model_fn(x, model_params)
        predictions.append(pred)
        weights.append(weight)
    predictions = np.array(predictions)
    weights = np.array(weights) / sum(weights)
    return np.dot(weights, predictions)


# ===================== 模拟数据生成 =====================

def generate_data(n_samples=200, noise=0.3, seed=42):
    """生成带噪声的非线性数据"""
    np.random.seed(seed)
    x = np.random.uniform(-3, 3, n_samples)
    # 真实函数: y = 2 + 0.5*x + 0.3*x^2 - 0.1*x^3 + noise
    y_true = 2 + 0.5 * x + 0.3 * x ** 2 - 0.1 * x ** 3
    y = y_true + np.random.randn(n_samples) * noise
    return x, y


# ===================== 模型训练（模拟）=====================

def train_model_simple(x, y):
    """用最小二乘法拟合线性模型"""
    A = np.vstack([np.ones_like(x), x]).T
    params = np.linalg.lstsq(A, y, rcond=None)[0]
    return lambda xi: model_simple(xi, params), params


def train_model_polynomial(x, y, order):
    """拟合多项式"""
    A = np.vstack([x ** i for i in range(order + 1)]).T
    params = np.linalg.lstsq(A, y, rcond=None)[0]
    return lambda xi: model_polynomial(xi, params), params


def train_model_nn_sim(x, y):
    """模拟神经网络拟合（随机搜索近似）"""
    np.random.seed(42)
    n_hidden = 8
    best_params = None
    best_loss = float('inf')

    for _ in range(50):
        params = np.random.randn(n_hidden * (1 + 1) + 1 * n_hidden) * 0.5
        pred = model_neural_like(x, params)
        loss = np.mean((pred - y) ** 2)
        if loss < best_loss:
            best_loss = loss
            best_params = params

    return lambda xi: model_neural_like(xi, best_params), best_params


# ===================== 评估 =====================

def evaluate_model(model_fn, x_test, y_test, label=""):
    """评估模型精度和速度"""
    # 精度
    t0 = time.perf_counter()
    y_pred = model_fn(x_test)
    t = time.perf_counter() - t0

    mse = np.mean((y_pred - y_test) ** 2)
    rmse = np.sqrt(mse)
    # R²
    ss_res = np.sum((y_test - y_pred) ** 2)
    ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
    r2 = 1 - ss_res / ss_tot

    return {
        'label': label,
        'rmse': rmse,
        'r2': r2,
        'time_ms': t * 1000,
        'speed': f"{t*1000:.4f} ms",
    }


def main():
    print("=" * 60)
    print("实验AG01: 模型精度与速度权衡")
    print("=" * 60)

    # ---------- 生成数据 ----------
    print("\n--- 1. 生成数据 ---")
    x_train, y_train = generate_data(n_samples=200, noise=0.3, seed=42)
    x_test, y_test = generate_data(n_samples=100, noise=0.3, seed=99)

    print(f"训练集: {len(x_train)} 样本")
    print(f"测试集: {len(x_test)} 样本")
    print(f"真实函数: y = 2 + 0.5x + 0.3x^2 - 0.1x^3 + noise")

    # ---------- 训练各种模型 ----------
    print("\n--- 2. 训练不同模型 ---")

    # 模型1: 线性
    print("  训练 Linear Model...")
    linear_fn, linear_params = train_model_simple(x_train, y_train)
    print(f"    参数: y = {linear_params[0]:.4f} + {linear_params[1]:.4f}x")

    # 模型2: 二次多项式
    print("  训练 Quadratic Model (order=2)...")
    quad_fn, quad_params = train_model_polynomial(x_train, y_train, 2)
    print(f"    参数: {len(quad_params)} 个系数")

    # 模型3: 三次多项式（真实阶数）
    print("  训练 Cubic Model (order=3)...")
    cubic_fn, cubic_params = train_model_polynomial(x_train, y_train, 3)
    print(f"    参数: {len(cubic_params)} 个系数")

    # 模型4: 高次多项式（过拟合）
    print("  训练 High-order Poly (order=15)...")
    high_fn, high_params = train_model_polynomial(x_train, y_train, 15)
    print(f"    参数: {len(high_params)} 个系数")

    # 模型5: 模拟神经网络
    print("  训练 NN-like Model...")
    nn_fn, nn_params = train_model_nn_sim(x_train, y_train)
    print(f"    参数: {len(nn_params)} 个 (随机搜索拟合)")

    # 模型6: 集成模型（线性 + 三次）
    print("  训练 Ensemble Model (Linear + Cubic)...")
    ensemble_fn = lambda xi: model_ensemble(xi, [
        (model_simple, linear_params, 0.3),
        (lambda x, p=quad_params: model_polynomial(x, p), quad_params, 0.3),
        (lambda x, p=cubic_params: model_polynomial(x, p), cubic_params, 0.4),
    ])

    # ---------- 评估对比 ----------
    print("\n--- 3. 模型对比评估 ---")
    models = [
        (linear_fn, "Linear (1 param)"),
        (quad_fn, "Quadratic (3 params)"),
        (cubic_fn, "Cubic (4 params)"),
        (high_fn, "High-Order Poly (16 params)"),
        (nn_fn, "NN-like (25 params)"),
        (ensemble_fn, "Ensemble (3 models)"),
    ]

    results = []
    for fn, label in models:
        result = evaluate_model(fn, x_test, y_test, label)
        results.append(result)

    print(f"\n{'模型':<28} {'RMSE':<12} {'R²':<12} {'推理延迟':<12} {'复杂度'}")
    print("-" * 75)
    for r in results:
        # 复杂度等级
        if "1 param" in r['label'] or "3 params" in r['label']:
            complexity = "低"
        elif "4 params" in r['label'] or "25 params" in r['label']:
            complexity = "中"
        else:
            complexity = "高"
        print(f"{r['label']:<28} {r['rmse']:<+12.4f} {r['r2']:<+12.4f} {r['speed']:<12} {complexity}")

    # ---------- 分析 ----------
    print("\n--- 4. 分析 ---")
    # 找最佳模型
    best_r2 = max(results, key=lambda r: r['r2'])
    fastest = min(results, key=lambda r: r['time_ms'])

    print(f"最高精度: {best_r2['label']} (R²={best_r2['r2']:.4f})")
    print(f"最快推理: {fastest['label']} ({fastest['speed']})")

    # 找 Pareto 最优（精度 vs 速度的权衡）
    print("\n  Pareto 前沿分析:")
    sorted_results = sorted(results, key=lambda r: r['time_ms'])
    best_r2_so_far = -float('inf')
    for r in sorted_results:
        if r['r2'] > best_r2_so_far:
            print(f"    Pareto 最优: {r['label']} — RMSE={r['rmse']:.4f}, {r['speed']}")
            best_r2_so_far = r['r2']

    print("""
\n结论:
  1) 简单模型（线性）: 速度快但精度有限（欠拟合）
  2) 复杂模型（高次多项式）: 训练集精度高但泛化差（过拟合）
  3) 适中模型（三次）: 在精度和速度间取得最佳平衡
  4) 集成模型: 通过组合多个模型获得稳健性能

  模型选择的关键原则:
  - 从简单开始 (Occam's Razor)
  - 用验证集评估泛化性能，而非训练集
  - 考虑部署环境的延迟约束
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
