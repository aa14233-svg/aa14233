"""
实验7: 约束求解与符号推理 (Constraint Solving)
============================================
实验目的:
  - 理解符号推理与约束求解的基本概念
  - 使用 Z3 SMT Solver 解决会议时间安排问题
  - 对比符号求解与回溯搜索的思维方式差异

前置知识:
  - 命题逻辑基础: AND, OR, NOT
  - 约束满足问题 (CSP) 的概念
  - 变量、域、约束三元组

运行方式:
  python logic_demo.py

依赖:
  - z3-solver (可选, pip install z3-solver)
    若未安装则使用纯 Python 回溯搜索实现
"""

import sys
import itertools

# ---------- 尝试导入 z3 ----------
try:
    from z3 import Int, And, Or, Not, Distinct, Solver, sat
    Z3_AVAILABLE = True
except ImportError:
    Z3_AVAILABLE = False


# ===================== 纯 Python 回溯搜索 =====================

def backtrack_search(variables, domains, constraints):
    """
    简单的回溯搜索求解器
    variables: 变量名列表
    domains: dict {var: [possible_values]}
    constraints: list of (var1, var2, constraint_func) 或 dict of all vars
    """

    assignment = {}

    def is_consistent(var, value, assignment):
        """检查将 var=value 加入当前赋值是否满足所有已涉及约束"""
        assignment[var] = value
        for constraint in constraints:
            # 约束可能涉及多个变量，只有当所有涉及的变量都已赋值时才检查
            involved = constraint.get('vars', [])
            if all(v in assignment for v in involved):
                if not constraint['check'](assignment):
                    del assignment[var]
                    return False
        del assignment[var]
        return True

    def backtrack(assignment):
        if len(assignment) == len(variables):
            return assignment.copy()

        # 选择下一个未赋值的变量
        unassigned = [v for v in variables if v not in assignment]
        var = unassigned[0]

        for value in domains[var]:
            if is_consistent(var, value, assignment):
                assignment[var] = value
                result = backtrack(assignment)
                if result is not None:
                    return result
                del assignment[var]

        return None

    return backtrack({})


def solve_meeting_python():
    """
    使用回溯搜索解决会议时间安排问题
    问题: 3个人要安排1小时会议，每人有可用时间段，会议室有开放时间
    """
    print("  使用纯 Python 回溯搜索求解...")

    # 定义变量：每个人的时间段
    # 时间段: 9:00=0, 10:00=1, 11:00=2, 14:00=3, 15:00=4, 16:00=5
    variables = ["Alice_time", "Bob_time", "Carol_time"]

    # 每个人的可用时间段
    domains = {
        "Alice_time": [0, 1, 2],    # 9:00-12:00
        "Bob_time": [1, 2, 3],      # 10:00-15:00
        "Carol_time": [3, 4, 5],    # 14:00-17:00
    }

    # 约束: 三个人必须在同一时间（否则不是开会）
    constraints = [
        {
            'vars': ["Alice_time", "Bob_time", "Carol_time"],
            'check': lambda a: a["Alice_time"] == a["Bob_time"] == a["Carol_time"]
        },
    ]

    solution = backtrack_search(variables, domains, constraints)
    if solution:
        time_map = {0: "09:00", 1: "10:00", 2: "11:00", 3: "14:00", 4: "15:00", 5: "16:00"}
        t = solution["Alice_time"]
        print(f"  ✓ 找到可行时间: {time_map[t]}")
        print(f"     Alice → {time_map[t]}, Bob → {time_map[t]}, Carol → {time_map[t]}")
    else:
        print("  ✗ 无解: 没有三人同时可用的时间段")

    return solution


# ===================== Z3 求解（如果可用）=====================

def solve_meeting_z3():
    """使用 Z3 解决会议安排问题"""
    print("  使用 Z3 SMT Solver 求解...")

    # 时间段映射
    time_slots = [0, 1, 2, 3, 4, 5]  # 对应 9,10,11,14,15,16 点
    time_map = {0: "09:00", 1: "10:00", 2: "11:00", 3: "14:00", 4: "15:00", 5: "16:00"}

    # 创建整数变量
    A = Int('Alice')
    B = Int('Bob')
    C = Int('Carol')

    solver = Solver()

    # 约束1: 每个人时间必须在可用范围内
    solver.add(And(A >= 0, A <= 2))    # Alice: 9-12
    solver.add(And(B >= 1, B <= 3))    # Bob: 10-15
    solver.add(And(C >= 3, C <= 5))    # Carol: 14-17

    # 约束2: 所有人必须在同一时间（开会）
    solver.add(And(A == B, B == C))

    # 也可以添加更多约束，例如：
    # 不要安排在12点（午饭时间）
    # solver.add(A != 2)

    print(f"  Z3 约束: {solver}")

    if solver.check() == sat:
        model = solver.model()
        t = model[A].as_long()
        print(f"  ✓ Z3 找到满足方案: 时间 = {time_map[t]}")
        print(f"     Alice={model[A]}, Bob={model[B]}, Carol={model[C]}")
        return True
    else:
        print("  ✗ Z3: 无解")
        return False


# ===================== 扩展问题 =====================

def solve_advanced_python():
    """
    更复杂的约束: 多房间 + 多时间段
    3个人可选3个会议室，不同会议室容量不同
    """
    print("\n  扩展问题: 会议室选择...")
    print("  约束: 3人 + 3会议室(容量不同) + 每人必须参与")

    # 时间段同上
    # Alice: 9-12, Bob: 10-15, Carol: 14-17
    # 会议室: RoomA(3人), RoomB(4人), RoomC(6人)
    # 项目要求: 至少要有2台投影仪，只有RoomB和RoomC有

    variables = ["T", "Room"]
    domains = {
        "T": [0, 1, 2, 3, 4, 5],
        "Room": ["RoomA", "RoomB", "RoomC"],
    }

    # 约束1: 所有人必须都能参加该时间
    def all_available(t):
        alice_ok = t in [0, 1, 2]
        bob_ok = t in [1, 2, 3]
        carol_ok = t in [3, 4, 5]
        return alice_ok and bob_ok and carol_ok

    # 约束2: 必须选有投影仪的会议室
    def has_projector(room):
        return room in ["RoomB", "RoomC"]

    constraints = [
        {
            'vars': ["T"],
            'check': lambda a: all_available(a["T"])
        },
        {
            'vars': ["Room"],
            'check': lambda a: has_projector(a["Room"])
        },
    ]

    solution = backtrack_search(variables, domains, constraints)
    time_map = {0: "09:00", 1: "10:00", 2: "11:00", 3: "14:00", 4: "15:00", 5: "16:00"}
    if solution:
        print(f"  ✓ 找到方案: {time_map[solution['T']]}, {solution['Room']}")
    else:
        print("  ✗ 无解: 不满足所有约束的组合")

    return solution


def main():
    print("=" * 60)
    print("实验7: 约束求解与符号推理")
    print("=" * 60)

    print("\n问题描述:")
    print("  需要安排一次3人会议，每人有各自的空闲时间段:")
    print("    Alice: 9:00-12:00")
    print("    Bob:   10:00-15:00")
    print("    Carol: 14:00-17:00")
    print("  求一个所有人都有空的时间。")

    # ---------- 方法1: Z3 (如果可用) ----------
    print("\n--- 方法1: SMT 约束求解 ---")
    z3_solution = None
    if Z3_AVAILABLE:
        z3_solution = solve_meeting_z3()
    else:
        print("  z3-solver 未安装。")
        print("  提示: pip install z3-solver 可体验更强大的约束求解能力。")
        print("  将使用纯 Python 回溯搜索替代...\n")

    # ---------- 方法2: 回溯搜索 ----------
    print("\n--- 方法2: Python 回溯搜索 ---")
    py_solution = solve_meeting_python()

    # ---------- 扩展问题 ----------
    print("\n--- 扩展: 多约束会议安排 ---")
    solve_advanced_python()

    # ---------- 对比总结 ----------
    print("\n--- 对比总结 ---")
    if Z3_AVAILABLE:
        print(f"{'特性':<20} {'Z3 SMT Solver':<25} {'Python 回溯搜索'}")
        print("-" * 65)
        print(f"{'求解方法':<20} {'DPLL + 理论求解':<25} {'DFS + 剪枝'}")
        print(f"{'表达能力':<20} {'一阶逻辑 + 算术':<25} {'需要手写约束函数'}")
        print(f"{{'性能':<20}} {'大规模求解优化':<25} {'小规模可用'}")
        print(f"{'局限性':<20} {'需安装额外包':<25} {'不支持非线性约束'}")
    else:
        print("  Z3 未安装。回溯搜索适合小规模 CSP 问题。")
        print("  安装 z3-solver 后可体验工业级约束求解器。")

    print("""
\n应用场景:
  - 自动调度: 课程表、航班安排、员工排班
  - 硬件验证: 芯片设计正确性证明
  - 程序分析: 符号执行、漏洞检测
  - 组合优化: 背包问题、图着色

Z3 不仅支持整数，还支持位向量、数组、浮点等理论。
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
