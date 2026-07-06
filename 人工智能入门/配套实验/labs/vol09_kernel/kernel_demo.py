"""
实验9: 虚拟内存与内核接口 (Virtual Memory)
============================================
实验目的:
  - 理解虚拟内存的基本概念：虚拟地址 → 物理地址映射
  - 使用 ctypes 调用 Windows kernel32 API 查询内存状态
  - 模拟虚拟地址空间布局，理解页、段的概念

前置知识:
  - 虚拟内存 vs 物理内存
  - 页表、页框、缺页中断
  - Windows 内存管理基础

运行方式:
  python kernel_demo.py

注: Windows 专用实验。非 Windows 环境会使用模拟模式。
"""

import sys
import struct
import ctypes


def query_virtual_memory_windows():
    """使用 Windows kernel32 API 查询内存状态"""
    try:
        kernel32 = ctypes.windll.kernel32

        # MEMORYSTATUSEX 结构体
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", ctypes.c_ulong),
                ("dwMemoryLoad", ctypes.c_ulong),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]

        mem_status = MEMORYSTATUSEX()
        mem_status.dwLength = ctypes.sizeof(MEMORYSTATUSEX)

        if kernel32.GlobalMemoryStatusEx(ctypes.byref(mem_status)):
            print("  [Windows Kernel32 API 查询成功]")
            print(f"  物理内存总量: {mem_status.ullTotalPhys / (1024**3):.2f} GB")
            print(f"  可用物理内存: {mem_status.ullAvailPhys / (1024**3):.2f} GB")
            print(f"  物理内存使用率: {mem_status.dwMemoryLoad}%")
            print(f"  虚拟内存总量: {mem_status.ullTotalVirtual / (1024**3):.2f} GB")
            print(f"  可用虚拟内存: {mem_status.ullAvailVirtual / (1024**3):.2f} GB")
            print(f"  页面文件总量: {mem_status.ullTotalPageFile / (1024**3):.2f} GB")
            print(f"  可用页面文件: {mem_status.ullAvailPageFile / (1024**3):.2f} GB")
            return True
        else:
            print(f"  GlobalMemoryStatusEx 调用失败, error={ctypes.GetLastError()}")
            return False

    except Exception as e:
        print(f"  Windows API 调用异常: {e}")
        return False


def query_page_info_windows():
    """查询页面大小信息"""
    try:
        kernel32 = ctypes.windll.kernel32

        # SYSTEM_INFO 结构体
        class SYSTEM_INFO(ctypes.Structure):
            _fields_ = [
                ("wProcessorArchitecture", ctypes.c_ushort),
                ("wReserved", ctypes.c_ushort),
                ("dwPageSize", ctypes.c_ulong),
                ("lpMinimumApplicationAddress", ctypes.c_void_p),
                ("lpMaximumApplicationAddress", ctypes.c_void_p),
                ("dwActiveProcessorMask", ctypes.c_ulonglong),
                ("dwNumberOfProcessors", ctypes.c_ulong),
                ("dwProcessorType", ctypes.c_ulong),
                ("dwAllocationGranularity", ctypes.c_ulong),
                ("wProcessorLevel", ctypes.c_ushort),
                ("wProcessorRevision", ctypes.c_ushort),
            ]

        sys_info = SYSTEM_INFO()
        kernel32.GetSystemInfo(ctypes.byref(sys_info))

        print(f"\n  [系统信息]")
        print(f"  页面大小 (Page Size): {sys_info.dwPageSize} bytes ({sys_info.dwPageSize // 1024} KB)")
        print(f"  分配粒度: {sys_info.dwAllocationGranularity} bytes ({sys_info.dwAllocationGranularity // 1024} KB)")
        print(f"  处理器数量: {sys_info.dwNumberOfProcessors}")
        print(f"  用户空间地址范围: {sys_info.lpMinimumApplicationAddress} - {sys_info.lpMaximumApplicationAddress}")
        return True

    except Exception as e:
        print(f"  GetSystemInfo 调用异常: {e}")
        return False


def simulate_virtual_memory():
    """纯 Python 虚拟地址空间模拟"""
    print("\n  [纯 Python 虚拟内存模拟]")

    # 模拟参数
    page_size = 4096       # 4KB 页
    virtual_address_bits = 32  # 32位地址空间
    total_virtual_pages = 2 ** virtual_address_bits // page_size

    print(f"  模拟配置:")
    print(f"    虚拟地址位数: {virtual_address_bits}-bit")
    print(f"    页大小: {page_size} bytes ({page_size // 1024} KB)")
    print(f"    总虚拟页数: {total_virtual_pages:,}")
    print(f"    总虚拟地址空间: {2**virtual_address_bits / (1024**3):.2f} GB")

    # 模拟页表（仅模拟少量页）
    print(f"\n  页表模拟 (显示前20个虚拟页):")
    print(f"  {'VPN':<10} {'虚拟地址范围':<22} {'物理页框':<10} {'标志位':<20}")
    print(f"  {'-'*60}")

    np = None
    if 'numpy' in sys.modules:
        np = __import__('numpy', globals(), locals(), [], 0)

    if np:
        physical_frames = np.random.randint(0, 256, size=20)
        present_flags = np.random.choice([True, False], size=20, p=[0.8, 0.2])
        rw_flags = np.random.choice(['R', 'RW'], size=20, p=[0.3, 0.7])
    else:
        import random
        rng = random.Random(42)
        physical_frames = [rng.randint(0, 256) for _ in range(20)]
        present_flags = [rng.random() < 0.8 for _ in range(20)]
        rw_flags = [rng.choice(['R', 'RW'], p=[0.3, 0.7]) for _ in range(20)]

    for vpn in range(20):
        start_addr = vpn * page_size
        end_addr = (vpn + 1) * page_size - 1
        pf = physical_frames[vpn] if np else physical_frames[vpn]
        present = "Present" if present_flags[vpn] else "Not Present"
        rw = rw_flags[vpn]
        flags = f"{present}, {rw}"
        if not present_flags[vpn]:
            flags = "NOT PRESENT (Page Fault on access)"

        print(f"  {vpn:<10} 0x{start_addr:08x}-0x{end_addr:08x}  {pf:<10} {flags:<20}")

    # 模拟地址转换
    print(f"\n  地址转换模拟:")
    virtual_addr = 0x00004A3C  # 示例虚拟地址
    vpn = virtual_addr // page_size
    offset = virtual_addr % page_size
    print(f"    虚拟地址: 0x{virtual_addr:08x}")
    print(f"    VPN (虚拟页号): {vpn} (0x{vpn:05x})")
    print(f"    页内偏移: {offset} (0x{offset:03x})")

    # 模拟一个 Page Fault
    print(f"\n  缺页中断 (Page Fault) 模拟:")
    print(f"    访问 VPN=5 → 页表项 Present=0")
    print(f"    → CPU 触发缺页异常 (#PF)")
    print(f"    → OS 缺页处理程序: 从磁盘加载页到物理内存")
    print(f"    → 更新页表: VPN=5 → PFN=42, Present=1")
    print(f"    → 重新执行访问指令")


def main():
    print("=" * 60)
    print("实验9: 虚拟内存与内核接口")
    print("=" * 60)

    # ---------- 1. 检测环境 ----------
    print("\n--- 1. 环境检测 ---")
    print(f"  操作系统: Windows" if sys.platform == "win32" else f"  操作系统: {sys.platform}")
    print(f"  Python: {sys.version}")

    # ---------- 2. 查询内存状态 ----------
    print("\n--- 2. 物理内存与虚拟内存查询 ---")
    api_success = False
    if sys.platform == "win32":
        api_success = query_virtual_memory_windows()
        if api_success:
            query_page_info_windows()
    else:
        print("  非 Windows 环境，跳过 kernel32 API 调用。")

    # ---------- 3. 虚拟内存模拟 ----------
    print("\n--- 3. 虚拟地址空间模拟 ---")
    simulate_virtual_memory()

    # ---------- 4. 总结 ----------
    print("""
\n核心概念:
  虚拟内存将每个进程的地址空间隔离，提供:
  1) 隔离性: 进程不能访问其他进程的内存
  2) 安全性: 用户态不能访问内核态地址
  3) 扩展性: 可用比物理内存更大的地址空间
  4) 简化: 每个进程看到连续的地址空间

  地址转换: 虚拟地址 → (页表) → 物理地址
  缺页处理: 访问不在内存中的页 → OS 从磁盘加载
""")

    print("=" * 60)
    print("实验完成!")
    print("=" * 60)


if __name__ == "__main__":
    main()
