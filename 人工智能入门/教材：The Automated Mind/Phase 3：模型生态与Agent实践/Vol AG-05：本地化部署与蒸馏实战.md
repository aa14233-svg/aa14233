> **👨‍🏫 教授说**
> 前置条件：AG-01 模型理解
> 概念阶梯：量化（★★）→ 蒸馏（★★★）→ 部署工具链（★★）
>
> **🧑‍💻 TA说**
> 动手入口 → 先跑起来：无配套实验。以下是一键量化脚本示例：
> ```bash
> # 使用llama.cpp量化模型为INT4
> git clone https://github.com/ggerganov/llama.cpp
> cd llama.cpp && make
> python convert.py your_model.gguf --outtype q4_0
> ```
>
> **🧑‍💻 TA说**
> 本地部署不是在"选模型"而是在"建管道"。模型本身只占50%的工程复杂度，剩下的是：预处理→批处理→后处理→缓存→降级策略。我用ncnn部署时，最耗时的不是模型推理，是输入输出的格式转换。

---

# Vol AG-05：本地化部署与蒸馏实战

## 开章

前四卷讲的是"用什么模型"和"在哪些场景用"。这一卷要解决的是**实物落地的最后一公里**：

- 你的电脑/服务器上怎么真正跑起一个大模型？
- Ollama、LM Studio、Hermes 这些工具各有什么设计哲学，怎么选？
- Windows 和 Linux 在推理底层有什么不同？
- 如果模型太大跑不动，怎么蒸馏/剪枝把它变小？

---

## 5.1 本地推理引擎生态

### 5.1.1 Ollama — "模型即容器"

**设计理念：** 把大模型当作 Docker 镜像来管理。Ollama 的核心抽象是 `Modelfile`——一个描述模型来源、量化方式、对话模板的纯文本清单。

**技术栈：**
- 底层推理引擎：llama.cpp（C++ 实现，CPU/GPU 混合推理）
- 架构：Go 编写的 HTTP 控制层 + C++ 推理后端
- 关键创新：自动 GPU offloading、Prompt caching、并发请求排队

**核心操作流程：**

```
1. 安装：curl -fsSL https://ollama.com/install.sh | bash (Linux)
         或下载 Windows 安装包

2. 拉取模型：ollama pull qwen2.5:7b
   → 自动下载 GGUF 量化文件到 ~/.ollama/models/

3. 自定义模型：创建 Modelfile
   FROM qwen2.5:7b
   SYSTEM "你是一个代码审查助手"
   PARAMETER temperature 0.2
   
   ollama create my-coder -f Modelfile

4. API 调用：curl http://localhost:11434/api/generate -d '{
     "model": "my-coder",
     "prompt": "Review this Python function"
   }'
```

**适用场景：** 个人开发者、快速原型、单机推理。**不擅长**：高并发生产、多模型负载均衡。

---

### 5.1.2 LM Studio — "模型即 GUI"

**设计理念：** 让非程序员也能跑私有模型。Ollama 用命令行，LM Studio 用图形界面——搜索模型→下载→选量化→点运行。

**技术栈：**
- 推理引擎：同 llama.cpp（因此与 Ollama 的 GGUF 文件完全兼容）
- 架构：Electron 桌面应用 + C++ 推理后端
- 关键差异：内置 HuggingFace 模型浏览器、可视化参数调节、多模型并行

**两个设计选择的权衡：**

| 维度 | Ollama | LM Studio |
|------|--------|-----------|
| 学习曲线 | 需命令行 | 零门槛 |
| 脚本化/CI集成 | ✅ 容易 | ❌ GUI 依赖 |
| 多模型切换 | 命令行切换 | 可视化面板 |
| API 兼容 | OpenAI 兼容 | OpenAI 兼容 |
| 资源占用 | 轻量 | Electron 开销较大 |

**核心原理：** 两者底层都依赖 llama.cpp 对 GGUF 格式的加载。GGUF 不仅存储了量化后的权重，还编码了模型架构信息（层数、头数、词表大小等），使同一个二进制文件可以被不同前端加载。

---

### 5.1.3 Hermes — "Agent 即角色"

**设计理念：** Hermes（特指 Nous Research 的 Hermes 系列 + 衍生的 Hermes Agent 框架）强调**角色绑定**——模型不是通用聊天机器人，而是被系统提示和函数调用 schema 约束的特定角色。

**与 Ollama/LM Studio 的层次关系：**

```
┌─────────────────────────┐
│     Hermes Agent        │ ← 角色/工具层
│  (系统提示 + 函数调用)    │
├─────────────────────────┤
│     Ollama / LM Studio  │ ← 引擎层
│  (模型加载 + 推理调度)    │
├─────────────────────────┤
│     llama.cpp           │ ← 推理层
│  (量化 + GPU offload)   │
├─────────────────────────┤
│     CUDA / Vulkan / CPU │ ← 硬件层
└─────────────────────────┘
```

**设计理念核心：**
- **系统提示即合约**：Hermes 类模型训练时就使用结构化系统提示，使其天然理解角色切换
- **函数调用即接口**：模型输出 `tool_calls` 字段描述要调用的函数和参数，Agent 框架负责执行
- **多 Agent 即编排**：每个 Hermes 实例可以是一个独立角色，多个实例通过消息队列或共享上下文组成 Agent 网络

**实战项目结构：**

```python
# Hermes Agent 风格的多角色系统（伪代码）
agents = {
    "planner": HermesAgent(model="hermes-3-llama-3.1-8b", role="架构设计师"),
    "coder":   HermesAgent(model="qwen2.5-coder:7b",     role="编码实现者"),
    "reviewer":HermesAgent(model="hermes-3-llama-3.1-8b", role="代码审查者"),
}

# 编排逻辑
request = "写一个 Markdown 转 HTML 的 Python 工具"
plan = agents["planner"].plan(request)        # LLM 生成 plan
code = agents["coder"].generate(plan.code)    # LLM 生成代码
review = agents["reviewer"].review(code)      # LLM 审查代码
```

**与框架关系：** Hermes 的设计理念被 LangChain、AutoGen、CrewAI 等框架采纳为 Agent 编排的核心模式。

---

## 5.2 硬件选型与量化策略

### 5.2.1 硬件需求速算

大模型推理的核心瓶颈是**显存带宽**和**显存容量**：

| 模型规模 | 参数量 | FP16 显存 | 4bit 量化后 | 最低推荐硬件 |
|----------|--------|-----------|-------------|-------------|
| 小模型 | 1B-3B | 2GB-6GB | 0.5GB-1.5GB | 任何 4GB+ GPU 或 CPU |
| 中等 | 7B-14B | 14GB-28GB | 4GB-8GB | RTX 3060 12GB / M2 Pro |
| 大模型 | 30B-72B | 60GB-144GB | 16GB-40GB | RTX 4090 24GB / A100 80GB |
| 超大 | 120B-180B | 240GB-360GB | 60GB-90GB | 多卡 A100 / Mac Ultra 192GB |

**量化格式选型：**

| 格式 | 精度 | 显存节约 | 原理 | 推荐工具 |
|------|------|---------|------|---------|
| GGUF | 2-8 bit | 4-16x | 按 block 分块量化，CPU 友好 | llama.cpp, Ollama |
| GPTQ | 4 bit | 4x | 基于 Hessian 矩阵的权重补偿 | AutoGPTQ, vLLM |
| AWQ | 4 bit | 4x | 激活感知的量化，保留重要通道 | AutoAWQ, vLLM |
| Bitsandbytes | 4/8 bit | 2-4x | 按 tensor 缩放，加载时量化 | HuggingFace Transformers |

**决策规则：**
1. 显存够用 → 优先 FP16/BF16（质量最高）
2. 显存有限但有一张 NVIDIA 卡 → AWQ 或 GPTQ（GPU 友好）
3. 无 GPU / Mac → GGUF（CPU 内存友好，Mac Metal 加速）
4. 想在不同设备间便携 → GGUF（唯一跨平台文件格式）

---

### 5.2.2 硬件加速背后的原理

**NVIDIA CUDA：**
- 推理计算以 Tensor Core 为主（Ampere 架构以上）
- 关键瓶颈是显存带宽（H100: 3.35TB/s, RTX 4090: 1TB/s）
- 推理时 GPU 利用率通常很低（10-30%），瓶颈在**数据传输**而非计算
- ollama/llama.cpp 用 `--num-gpu-layers` 控制有多少层 offload 到 GPU

**Apple Metal / M 系列统一内存：**
- M2 Ultra 有 192GB 统一内存 = 可跑 70B 模型
- 不需要 CPU↔GPU 数据传输（统一内存架构）
- 但 FLOPS 远低于 NVIDIA 独显（M2 Ultra ~13 TFLOPS vs RTX 4090 ~82 TFLOPS）
- 适合**大模型 + 低延迟批量处理**的场景

**CPU 推理（无 GPU）：**
- 纯 CPU 推理比 GPU 慢 10-50 倍
- 依赖 AVX-512 / AMX 指令集加速矩阵乘
- 大模型（>7B）需要 32GB+ 系统内存
- llama.cpp 使用 mmap() 将模型文件映射到虚拟内存，避免全量加载

---

## 5.3 操作系统底层原理

### 5.3.1 Linux vs Windows 推理栈对比

| 层面 | Linux | Windows |
|------|-------|---------|
| GPU 驱动 | NVIDIA 开源驱动 + CUDA toolkit | 闭源驱动 + CUDA on WSL / DirectML |
| 内存管理 | `mmap` + `madvise` 精细控制 | 虚拟内存 mmap 有限制 |
| 容器化 | Docker/Podman 原生 | Docker Desktop / WSL2 |
| CUDA 版本 | 系统级安装，兼容性易控 | WSL2 内运行 Linux CUDA |
| 性能 | 基准线（延迟低 5-15%） | WSL2 接近原生，纯 Windows 略低 |
| 推荐推理引擎 | Ollama, vLLM, TGI | Ollama (WSL2), LM Studio (原生) |

**关键差异详解：**

**1. CUDA 集成方式**
- **Linux**：NVIDIA 驱动 + CUDA toolkit 直接安装，`nvidia-smi` 直接可见。推理引擎通过 `libcuda.so` 直接调用 GPU。
- **Windows**：传统方式通过 CUDA on Windows（成熟但兼容性差）。**推荐方式**：WSL2 + Ubuntu + CUDA toolkit。Ollama 在 Windows 上实质是在后台启动 WSL2 容器。

**2. 内存映射（mmap）**
- **Linux**：`mmap()` 是 llama.cpp 加载 GGUF 的核心机制——模型文件映射为虚拟地址空间，操作系统按需加载页面。
- **Windows**：`CreateFileMapping` + `MapViewOfFile` 实现类似 mmap，但在大文件（>16GB）映射时碎片化更严重。这是 llama.cpp 在 Windows 上偶发加载失败的主因。

**3. NUMA 感知**
- **Linux**：`numactl` 控制内存分配策略，多路服务器上至关重要——跨 NUMA 节点访问内存延迟翻倍。
- **Windows**：无原生 NUMA 亲和性 API，多路服务器性能不佳。这也是专业推理服务器几乎全跑 Linux 的原因之一。

### 5.3.2 WSL2：Windows 上的最佳推理方案

WSL2 的工作原理：Hyper-V 虚拟机 + 定制 Linux 内核 → GPU 通过 `GPU-PV`（Paravirtualized GPU）透传。

**WSL2 推理的优缺点：**

```
优点：
  ✅ 兼容所有 Linux CUDA 工具链
  ✅ 性能损失 < 5%
  ✅ 和 Windows 文件系统互通
  ✅ Systemd 支持自动启动 Ollama 服务

缺点：
  ❌ 无法直接访问 Windows 原生 GPU API（DirectML）
  ❌ 虚拟机内存上限可配置但需手动设置 (.wslconfig)
  ❌ 跨文件系统（Windows ↔ WSL）IO 性能差
```

**.wslconfig 优化配置：**

```ini
[wsl2]
memory=32GB
processors=8
localhostForwarding=true
nestedVirtualization=true
```

---

## 5.4 MoE 蒸馏实战流程

### 5.4.1 预备知识：MoE 与蒸馏

**MoE（Mixture of Experts）架构快速回顾：**
- 传统 Transformer 的 FFN 层被替换为多个"专家"子网络 + 一个路由器（Router）
- 每个 token 只激活 Top-K 个专家（DeepSeek-V3 使用 Top-2，激活 37B / 671B）
- 所以虽然参数总量大，推理计算量约等于同规模 Dense 模型
- MoE 的稀疏性使其天然适合**蒸馏**——保留路由结构，只压缩每个专家

**蒸馏的核心公式：**

```
L_distill = α · L_CE(soft_labels, student_logits) + (1-α) · L_task(y_true, student_output)

其中 soft_labels = softmax(teacher_logits / temperature)
```

- **Teacher（教师模型）：** 大模型（如 DeepSeek-V2-236B），输出软标签（概率分布中的知识）
- **Student（学生模型）：** 小模型（如 DeepSeek-V2-Lite-16B），学习软标签分布
- **Temperature（温度）：** 温度越高，软标签的分布越平滑（小概率类别的相对差异被放大）

---

### 5.4.2 企业级 MoE 蒸馏标准流程

```
第一阶段：数据准备（2-4 周）
  原始数据 → 清洗 → 去重 → 质量过滤 → 领域均衡采样 → 训练/验证/测试划分

第二阶段：教师推理（1-2 周，依赖 GPU 集群）
  教师模型加载 → Forward pass（不反向传播） → 
  保存 logits + hidden states → 生成软标签文件

第三阶段：学生训练（1-4 周，依赖 GPU 集群）
  加载软标签 → 蒸馏损失 + 任务损失 → 
  梯度更新学生参数 → 周期性验证

第四阶段：评估与迭代（1-2 周）
  Benchmark 测试 → 对抗样本测试 → 蒸馏失败分析 →
  调整 α/T/数据配比 → 回到第一阶段
```

**企业级实操细节：**

**A. 数据策略**
- 来源：通用语料（FineWeb、RedPajama）+ 领域专有数据（代码、医学、法律）
- 配比调度：前期通用语料（学语言能力）→ 后期领域数据（学专长）
- 多样性优先于数量：1000 条高质量多样本 > 1 万条相似样本

**B. 教师模型选择**
- 如果蒸馏 MoE → 教师也最好是 MoE（架构对齐，蒸馏效率更高）
- 教师不是越大越好——教师精度超过一定程度后，学生无法吸收
- 经验法则：教师参数 < 学生参数 * 10

**C. 损失函数设计**

```python
# 蒸馏损失核心实现（PyTorch 伪代码）
def distill_loss(student_logits, teacher_logits, labels, alpha=0.5, T=4.0):
    # 软标签损失（KL 散度）
    soft_teacher = F.softmax(teacher_logits / T, dim=-1)
    soft_student = F.log_softmax(student_logits / T, dim=-1)
    kl_loss = F.kl_div(soft_student, soft_teacher, reduction='batchmean') * (T ** 2)
    
    # 硬标签损失（交叉熵）
    ce_loss = F.cross_entropy(student_logits, labels)
    
    return alpha * kl_loss + (1 - alpha) * ce_loss
```

**D. 工程基建**

| 组件 | 推荐方案 | 原因 |
|------|---------|------|
| 分布式训练框架 | DeepSpeed / Megatron-LM | ZeRO 优化、MoE 路由定制 |
| 模型并行 | Tensor Parallel + Expert Parallel | MoE Expert 天然可分布到不同 GPU |
| 数据加载 | WebDataset / Mosaic Streaming | 海量数据无需下载到本地 |
| 日志与监控 | WandB + TensorBoard | 软标签分布可视化 |
| 检查点管理 | HF Hub / NFS + 定期清理 | 蒸馏一个月可能产生数 TB 检查点 |

---

### 5.4.3 个人/小团队蒸馏简化方案

企业流程太复杂？个人可以用这些替代方案：

**方案一：LoRA 蒸馏（最实用）**

```python
# 使用 Unsloth 快速蒸馏
from unsloth import FastLanguageModel
import torch.nn.functional as F

teacher, tokenizer = FastLanguageModel.from_pretrained("teacher-model")
student = FastLanguageModel.from_pretrained("student-model")

# 冻结 student 主体，只训练 LoRA 参数
# 训练时 teacher 输出 logits，student 对齐
for batch in dataloader:
    with torch.no_grad():
        t_logits = teacher(batch["input_ids"]).logits
    s_logits = student(batch["input_ids"]).logits
    
    # KL 散度蒸馏
    loss = F.kl_div(
        F.log_softmax(s_logits / 4.0, dim=-1),
        F.softmax(t_logits / 4.0, dim=-1),
        reduction='batchmean'
    ) * 16.0  # T² 缩放
    loss.backward()
    optimizer.step()
```

**方案二：数据集蒸馏（零 GPU 训练）**

不自己蒸馏模型，而是用教师模型生成**高质量合成数据**，然后用这些数据微调小模型：

```
1. 选取 1000-5000 条高难度样本
2. 用 GPT-4o / Claude（强教师）生成详细推理链
3. 筛选：标注一致性 > 80% 的样本保留
4. 用这些数据微调 Qwen2.5-7B / Llama-3.1-8B
5. 评估：在目标 benchmark 上的提升通常为 5-15%
```

**方案三：模型合并（零训练技巧）**

用 MergeKit / TIES-Merging 将多个微调模型合并，不训练也能获得类似蒸馏的效果：

```bash
# 安装 mergekit
pip install mergekit

# 合并两个专长模型
mergekit-yaml -c config.yaml merge_output/
```

```yaml
# config.yaml
slices:
  - sources:
    - model: Qwen2.5-7B-Coder  # 代码专长
      layer_range: [0, 28]
    - model: Qwen2.5-7B-Instruct  # 对话专长
      layer_range: [0, 28]
merge_method: ties
base_model: Qwen2.5-7B
dtype: bfloat16
```

---

### 5.4.4 MoE 特化蒸馏要点

MoE 架构的蒸馏需要额外处理**路由器对齐**：

**路由一致性损失：**
- 不仅让学生学习教师的输出分布，还要学习教师的专家路由分布
- 如果学生和教师的架构相同（同构蒸馏），直接对齐路由权重
- 如果学生是 Dense 架构（异构蒸馏），路由器信息通过 Distill-aware Routing 隐式传递

**通用 MoE 蒸馏流程：**

```
教师 MoE 模型
    ↓
提取 expert 输出 + router weights
    ↓
对齐方案选择：
  ├→ 同构：保留 MoE 结构，压缩专家宽度/深度
  ├→ 异构：蒸馏到 Dense 模型（信息损失，但部署简单）
  └→ 部分 MoE：保留前 K 个高频专家，其余合并
    ↓
蒸馏训练（路由损失 + 输出损失）
    ↓
部署量化的学生模型
```

**行业案例参考：**

| 案例 | 教师 | 学生 | 方法 | 效果 |
|------|------|------|------|------|
| DeepSeek-V2 → V2-Lite | 236B MoE | 16B MoE | 同构蒸馏 + 路由对齐 | 保持 80% 能力，1/15 参数 |
| Qwen1.5 → Qwen1.5-14B | 72B | 14B | 异构蒸馏 | Code 能力保持 90% |
| Phi-3 → Phi-3-mini | 14B Dense | 3.8B Dense | 合成数据 + 课程蒸馏 | 3.8B 超同尺寸模型 |

---

## 章节小结

这一卷完成了从"理论"到"实物"的最后一跳：

1. **工具层：** Ollama 把模型当镜像管理，LM Studio 把模型当 APP 管理，Hermes 把模型当角色管理——同一套底层引擎（llama.cpp），不同抽象层次
2. **硬件层：** 显存容量决定能跑什么模型，显存带宽决定跑得多快，量化技术在两者之间做权衡
3. **系统层：** Linux 是推理的主战场（稳定性、NUMA、mmap），WSL2 是 Windows 用户的最佳妥协
4. **蒸馏层：** 企业级蒸馏是系统工程（数据→教师→学生→评估），个人可以用 LoRA 蒸馏、数据集蒸馏、模型合并三种简化方案

从 AG-01 到 AG-05，你已经掌握了从模型选型到场景设计再到本地部署与性能优化的完整闭环。

---

**→ 相关降维概念：** [[手册：核心概念降维缓存/Concept明细/Concept_09：快递分拣线|Concept_09：快递分拣线 (SIMD/量化加速)]] · [[手册：核心概念降维缓存/Concept明细/Concept_07：搭建乐高|Concept_07：搭建乐高 (Agent编排)]]

→ [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol AG-06：Agent持久记忆与智能编排|下一章：Vol AG-06 Agent持久记忆与智能编排]]
