"""
实验5: LRU Cache 与缓存命中率
============================================
实验目的:
  - 理解缓存（Cache）的核心概念：有限空间 + 替换策略
  - 实现 LRU (Least Recently Used) 替换算法
  - 观察不同缓存大小对命中率的影响

前置知识:
  - 缓存的三种经典策略: FIFO, LRU, LFU
  - LRU 原理: 淘汰最久未被访问的数据
  - 空间局部性与时间局部性

运行方式:
  python memory_demo.py
"""

import time
from collections import deque, OrderedDict


class LRUCache:
    """基于 OrderedDict 的 LRU Cache 实现"""

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
        self.hits = 0
        self.misses = 0

    def get(self, key):
        """获取缓存值，若不存在返回 -1"""
        if key in self.cache:
            self.hits += 1
            # 移动到末尾（表示最近使用）
            self.cache.move_to_end(key)
            return self.cache[key]
        else:
            self.misses += 1
            return -1

    def put(self, key, value):
        """存入缓存"""
        if key in self.cache:
            # 更新已存在的键，移动到末尾
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            # 弹出最久未使用的（第一个）
            self.cache.popitem(last=False)

    @property
    def hit_rate(self):
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    def reset_stats(self):
        self.hits = 0
        self.misses = 0


class LRUCacheDeque:
    """基于 dict + deque 的 LRU Cache（教学用，更直观）"""

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}          # key → value
        self.order = deque()     # 维护访问顺序
        self.hits = 0
        self.misses = 0

    def get(self, key):
        if key in self.cache:
            self.hits += 1
            # 更新访问顺序：删掉旧位置，追加到末尾
            self._update_order(key)
            return self.cache[key]
        else:
            self.misses += 1
            return -1

    def put(self, key, value):
        if key in self.cache:
            self.cache[key] = value
            self._update_order(key)
        else:
            if len(self.cache) >= self.capacity:
                # 淘汰最久未使用的
                oldest = self.order.popleft()
                del self.cache[oldest]
            self.cache[key] = value
            self.order.append(key)

    def _update_order(self, key):
        """将 key 移动到 order 末尾"""
        self.order.remove(key)  # O(n), 但教学上清晰
        self.order.append(key)

    @property
    def hit_rate(self):
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0

    def reset_stats(self):
        self.hits = 0
        self.misses = 0


def simulate_workload(cache, keys, label=""):
    """模拟访问模式"""
    cache.reset_stats()
    t0 = time.perf_counter()
    for k in keys:
        if cache.get(k) == -1:
            cache.put(k, k * 10)
    t = time.perf_counter() - t0
    print(f"  {label:20s}  命中率: {cache.hit_rate:6.2%}  |  耗时: {t*1000:8.3f} ms  |  容量={cache.capacity}")


def main():
    print("=" * 60)
    print("实验5: LRU Cache 与缓存命中率")
    print("=" * 60)

    # ---------- 1. LRU Cache 基本原理演示 ----------
    print("\n--- 1. LRU Cache 基本原理 ---")
    cache = LRUCacheDeque(capacity=4)
    print("容量 = 4, 依次访问: 1,2,3,4,5,2,3,6")
    for v in [1, 2, 3, 4, 5, 2, 3, 6]:
        if cache.get(v) == -1:
            cache.put(v, v * 10)
        print(f"  访问 {v} → 缓存状态: {dict(cache.cache)}")

    print(f"  命中率: {cache.hit_rate:.2%}")
    print("  解释: 访问5时淘汰1, 访问6时淘汰4, 2和3因被重新访问而保留")

    # ---------- 2. 不同缓存大小的命中率对比 ----------
    print("\n--- 2. 不同缓存大小的命中率对比 ---")
    total_items = 100
    # 生成一个 zipf-like 访问模式：少量热key被高频访问
    np = __import__('numpy', globals(), locals(), [], 0) if 'numpy' in sys.modules else None

    # 使用带偏好的访问模式：前20%的key占80%的访问
    hot_keys = list(range(20))       # 20个热key
    cold_keys = list(range(20, 100))  # 80个冷key
    access_pattern = []
    for i in range(500):
        if i % 5 < 4:  # 80% 访问热key
            access_pattern.append(hot_keys[i % len(hot_keys)])
        else:
            access_pattern.append(cold_keys[i % len(cold_keys)])

    print(f"总访问次数: {len(access_pattern)}")
    print(f"唯一key数: {len(set(access_pattern))}")
    print(f"热key(前20%): 80%访问 | 冷key(后80%): 20%访问")

    for cap in [4, 8, 16, 32, 64]:
        cache = LRUCache(capacity=cap)
        simulate_workload(cache, access_pattern, label=f"容量={cap}")

    # ---------- 3. 两种实现的性能对比 ----------
    print("\n--- 3. 顺序 vs 随机访问模式对比 ---")
    n_access = 2000

    # 顺序访问: cache-friendly
    seq_pattern = list(range(n_access)) * 3

    # 随机访问: cache-unfriendly
    import random
    rng = random.Random(42)
    rand_pattern = [rng.randint(0, n_access - 1) for _ in range(n_access * 3)]

    cache_seq = LRUCache(capacity=64)
    cache_rand = LRUCache(capacity=64)

    simulate_workload(cache_seq, seq_pattern, "顺序访问模式")
    simulate_workload(cache_rand, rand_pattern, "随机访问模式")

    # ---------- 4. 总结 ----------
    print("""
\n总结:
  1) 缓存容量越大 → 命中率越高（但成本也越高）
  2) 访问模式越集中（时间局部性好）→ 命中率越高
  3) 顺序访问比随机访问有更好的缓存效率
  4) LRU 在实际系统中广泛使用（Redis, CPU缓存, 数据库Buffer Pool）
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
