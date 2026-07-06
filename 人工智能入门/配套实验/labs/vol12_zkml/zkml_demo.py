"""
实验12: Merkle Tree 与零知识验证
============================================
实验目的:
  - 理解 Merkle Tree 的数据结构与构建方法
  - 掌握 Merkle Proof 的生成与验证流程
  - 体验"不暴露全部数据即可验证部分数据属于集合"的思想

前置知识:
  - 哈希函数（SHA-256）
  - 二叉树的基本概念
  - Merkle Tree 是区块链（Bitcoin/Ethereum）的核心数据结构

运行方式:
  python zkml_demo.py
"""

import hashlib
import math


def sha256(data: bytes) -> str:
    """计算 SHA-256 哈希"""
    return hashlib.sha256(data).hexdigest()


class MerkleTree:
    """Merkle Tree 实现"""

    def __init__(self, data_items: list):
        """
        从数据列表构建 Merkle Tree
        data_items: 原始数据（字符串列表）
        """
        self.leaves = []
        self.tree = []  # tree[0] = leaves, tree[-1] = root
        self._build(data_items)

    def _build(self, data_items):
        """构建 Merkle Tree"""
        if not data_items:
            raise ValueError("数据列表不能为空")

        # 1. 计算叶子节点哈希
        self.leaves = [sha256(item.encode('utf-8')) for item in data_items]

        # 2. 构建树（自底向上）
        current_level = self.leaves.copy()
        self.tree = [current_level]

        while len(current_level) > 1:
            next_level = []
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                # 如果节点数为奇数，复制最后一个节点
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                combined = left + right
                next_level.append(sha256(combined.encode('utf-8')))
            current_level = next_level
            self.tree.append(current_level)

    @property
    def root(self) -> str:
        """返回 Merkle Root"""
        return self.tree[-1][0] if self.tree else ""

    def get_proof(self, index: int) -> list:
        """
        获取指定叶子节点的 Merkle Proof
        返回: [(sibling_hash, is_left), ...]
        """
        if index < 0 or index >= len(self.leaves):
            raise IndexError(f"索引 {index} 超出范围 [0, {len(self.leaves)-1}]")

        proof = []
        idx = index

        for level in self.tree[:-1]:  # 不需要 root 层
            sibling_idx = idx ^ 1  # 兄弟节点索引（异或切换奇偶）
            if sibling_idx < len(level):
                sibling_hash = level[sibling_idx]
                is_left = (idx % 2 == 0)  # 如果自己是左子，兄弟在右
                proof.append((sibling_hash, is_left))
            idx //= 2  # 上升到父节点

        return proof

    def verify_proof(self, data: str, proof: list, root: str) -> bool:
        """
        验证 Merkle Proof
        data: 要验证的原始数据
        proof: [(sibling_hash, is_left), ...]
        root: Merkle Root
        """
        current_hash = sha256(data.encode('utf-8'))

        for sibling_hash, is_left in proof:
            if is_left:
                # 自己是左子 → 自己在前，兄弟在后
                combined = current_hash + sibling_hash
            else:
                # 自己是右子 → 兄弟在前，自己在后
                combined = sibling_hash + current_hash
            current_hash = sha256(combined.encode('utf-8'))

        return current_hash == root


def main():
    print("=" * 60)
    print("实验12: Merkle Tree 与零知识验证")
    print("=" * 60)

    # ---------- 1. 构建 Merkle Tree ----------
    print("\n--- 1. 构建 Merkle Tree ---")
    transactions = [
        "Alice 转账 10 BTC 给 Bob",
        "Bob 转账 5 BTC 给 Carol",
        "Carol 转账 2 BTC 给 Dave",
        "Dave 转账 1 BTC 给 Alice",
        "Eve 转账 3 BTC 给 Frank",
        "Frank 转账 7 BTC 给 Grace",
        "Grace 转账 4 BTC 给 Heidi",
        "Heidi 转账 6 BTC 给 Ivan",
    ]

    print(f"交易数量: {len(transactions)}")
    for i, tx in enumerate(transactions):
        print(f"  [{i}] {tx} → Hash: {sha256(tx.encode('utf-8'))[:16]}...")

    tree = MerkleTree(transactions)
    root = tree.root
    print(f"\nMerkle Root: {root}")
    print(f"树层数: {len(tree.tree)}")
    print(f"每层节点数: {[len(level) for level in tree.tree]}")

    # ---------- 2. 验证路径 ----------
    print("\n--- 2. Merkle Proof 验证 ---")
    target_idx = 2  # 验证第3笔交易
    target_tx = transactions[target_idx]
    print(f"目标交易 [{target_idx}]: \"{target_tx}\"")

    proof = tree.get_proof(target_idx)
    print(f"\nMerkle Proof (共 {len(proof)} 步):")
    for i, (s_hash, is_left) in enumerate(proof):
        direction = "左子" if is_left else "右子"
        print(f"  步骤 {i+1}: 兄弟节点（{direction}）= {s_hash[:20]}...")

    # ---------- 3. 验证 ----------
    print("\n--- 3. 验证结果 ---")
    is_valid = tree.verify_proof(target_tx, proof, root)
    print(f"验证 \"{target_tx}\" 是否属于集合:")
    print(f"  → {'✓ 验证通过! 该交易确属于这个区块' if is_valid else '✗ 验证失败!'}")

    # 尝试验证伪造数据
    fake_tx = "Alice 转账 999 BTC 给 Bob"
    is_fake_valid = tree.verify_proof(fake_tx, proof, root)
    print(f"\n验证伪造交易 \"{fake_tx}\":")
    print(f"  → {'✗ 验证应该失败!' if not is_fake_valid else '异常: 验证通过了!'}")

    # ---------- 4. 多棵树对比 ----------
    print("\n--- 4. 不同数据量对树结构的影响 ---")
    for n in [2, 4, 8, 16, 32]:
        data = [f"data_{i}" for i in range(n)]
        t = MerkleTree(data)
        print(f"  {n:3d} 条数据 → 树高={len(t.tree)}, Root={t.root[:20]}...")

    # ---------- 5. 核心思想总结 ----------
    print("""
\n零知识验证的核心思想:
  1) Merkle Root 是对整个数据集的"承诺" —— 一旦发布不能篡改
  2) 验证者不需要下载全部数据，只需要:
     - 知道 Merkle Root（通常公开，如区块头）
     - 获得目标数据 + 其验证路径（Proof）
  3) 验证路径大小 = O(log N)，而非 O(N)
  
  这体现了零知识证明的核心思想:
  "在不暴露全部数据的情况下，证明某数据属于某个集合"
  
  扩展应用:
  - 区块链轻节点 (SPV): 只存区块头，验证交易
  - 证书透明度 (Certificate Transparency)
  - 文件完整性校验 (如 IPFS, Git)
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
