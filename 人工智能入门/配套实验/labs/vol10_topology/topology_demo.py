"""
实验10: 图拓扑分析 (Topological Analysis)
============================================
实验目的:
  - 理解图的基本概念：节点、边、度、连通性
  - 掌握 PageRank 算法（Google 搜索引擎核心）
  - 了解社区发现（Community Detection）的基本方法

前置知识:
  - 图论基础: 有向图、无向图、邻接矩阵
  - PageRank: 基于随机游走的节点重要性度量
  - 社区结构: 社群内部连接紧密，社群间连接稀疏

运行方式:
  python topology_demo.py

依赖:
  - networkx (pip install networkx)
  - numpy (pip install numpy, 可选)
"""

import sys

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    NETWORKX_AVAILABLE = False

try:
    import numpy as np
except ImportError:
    pass


def demo_pure_python():
    """纯 Python 实现 PageRank 和社区发现（教学用）"""

    print("  [纯 Python 简易实现]")

    # ---------- 图表示 ----------
    # 用邻接表表示有向图
    graph = {
        'A': ['B', 'C'],
        'B': ['C'],
        'C': ['A'],
        'D': ['C'],
        'E': ['F'],
        'F': ['E'],
    }
    nodes = list(graph.keys())
    n = len(nodes)
    node_idx = {node: i for i, node in enumerate(nodes)}

    print(f"\n  图: {n}个节点, 边: {sum(len(v) for v in graph.values())}条")
    for src, tgts in graph.items():
        for tgt in tgts:
            print(f"    {src} → {tgt}")

    # ---------- 简易 PageRank ----------
    print("\n  简易 PageRank 计算:")
    damping = 0.85
    ranks = {node: 1.0 / n for node in nodes}

    for iteration in range(20):
        new_ranks = {}
        for node in nodes:
            # 基础随机跳转概率
            rank_sum = (1 - damping) / n
            # 从入边累计
            for src, tgts in graph.items():
                if node in tgts:
                    rank_sum += damping * ranks[src] / len(tgts)
            new_ranks[node] = rank_sum
        ranks = new_ranks

    for node in sorted(ranks.keys()):
        bar = "█" * max(1, int(ranks[node] * 100))
        print(f"    {node}: {ranks[node]:.6f}  {bar}")

    # ---------- 简易社区发现 ----------
    print("\n  连通分量分析 (基础社区):")
    visited = set()
    communities = []
    for node in nodes:
        if node not in visited:
            # BFS 找连通分量
            community = []
            stack = [node]
            while stack:
                curr = stack.pop()
                if curr not in visited:
                    visited.add(curr)
                    community.append(curr)
                    for neighbor in graph.get(curr, []) + [n for n, tgts in graph.items() if curr in tgts]:
                        if neighbor not in visited:
                            stack.append(neighbor)
            communities.append(community)

    for i, comm in enumerate(communities):
        print(f"    社区 {i+1}: {sorted(comm)} (共{len(comm)}个节点)")

    return ranks


def demo_networkx():
    """使用 networkx 进行图分析"""
    print("  [使用 NetworkX]")
    G = nx.karate_club_graph()
    print(f"  加载 Zachary's Karate Club 图")
    print(f"    节点数: {G.number_of_nodes()}")
    print(f"    边数: {G.number_of_edges()}")
    print(f"    平均度: {sum(dict(G.degree()).values()) / G.number_of_nodes():.2f}")

    # ---------- 基础统计 ----------
    print("\n--- 1. 基础图统计 ---")
    print(f"  密度: {nx.density(G):.4f}")
    print(f"  直径: {nx.diameter(G)} (最长最短路径)")
    print(f"  平均聚类系数: {nx.average_clustering(G):.4f}")
    print(f"  是否是连通图: {nx.is_connected(G)}")

    # ---------- 节点中心性 ----------
    print("\n--- 2. 节点中心性 ---")
    degree_centrality = nx.degree_centrality(G)
    top_degree = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)[:5]
    print("  Top 5 度中心性:")
    for node, val in top_degree:
        print(f"    Node {node}: {val:.4f}")

    betweenness = nx.betweenness_centrality(G)
    top_btw = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:5]
    print("  Top 5 介数中心性:")
    for node, val in top_btw:
        print(f"    Node {node}: {val:.4f}")

    # ---------- PageRank ----------
    print("\n--- 3. PageRank ---")
    pr = nx.pagerank(G, alpha=0.85)
    print(f"  {'Node':<6} {'PageRank':<12} {'Bar'}")
    print(f"  {'-'*35}")
    for node, val in sorted(pr.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * max(1, int(val * 100))
        print(f"  {node:<6} {val:<+12.6f} {bar}")

    # ---------- 社区发现 ----------
    print("\n--- 4. 社区发现 ---")
    communities = list(nx.community.greedy_modularity_communities(G, best_n=4))
    print(f"  使用 Greedy Modularity 发现 {len(communities)} 个社区:")
    for i, comm in enumerate(communities):
        members = sorted(comm)
        print(f"    社区 {i+1} (size={len(comm)}): {members}")

    # ---------- 最短路径 ----------
    print("\n--- 5. 最短路径示例 ---")
    source, target = 0, 33
    try:
        path = nx.shortest_path(G, source=source, target=target)
        length = nx.shortest_path_length(G, source=source, target=target)
        print(f"  Node {source} → Node {target}: 路径长度={length}")
        print(f"  路径: {' → '.join(map(str, path))}")
    except nx.NetworkXNoPath:
        print(f"  Node {source} → Node {target}: 无路径")

    return pr


def main():
    print("=" * 60)
    print("实验10: 图拓扑分析 (Topological Analysis)")
    print("=" * 60)

    # ---------- 1. 创建简单图并展示 ----------
    print("\n--- 1. 图表示 ---")
    if NETWORKX_AVAILABLE:
        # 创建有向图
        G = nx.DiGraph()
        edges = [
            ("A", "B"), ("A", "C"), ("B", "C"),
            ("C", "A"), ("D", "C"), ("E", "F"), ("F", "E"),
        ]
        G.add_edges_from(edges)

        print(f"  有向图: {G.number_of_nodes()} 节点, {G.number_of_edges()} 边")
        print(f"  节点: {list(G.nodes())}")
        print(f"  边: {list(G.edges())}")
        print(f"\n  节点度数:")
        for node, deg in G.degree():
            print(f"    {node}: 入度={G.in_degree(node)}, 出度={G.out_degree(node)}, 总度={deg}")

        # 切换到主要分析
        print("\n" + "=" * 50)
        pr = demo_networkx()
    else:
        print("  NetworkX 未安装, 使用纯 Python 实现")
        print("  建议安装: pip install networkx\n")
        pr = demo_pure_python()

    # ---------- 6. 总结 ----------
    print("""
\n图拓扑分析的应用:
  - PageRank: Google 搜索引擎排序网页重要性
  - 社区发现: 社交网络群体识别、推荐系统
  - 中心性分析: 识别网络中最有影响力的节点
  - 最短路径: GPS 导航、网络路由

  实际应用中，图数据库 (Neo4j, ArangoDB) 和
  大规模图计算框架 (GraphX, PyG) 处理更大规模图。
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
