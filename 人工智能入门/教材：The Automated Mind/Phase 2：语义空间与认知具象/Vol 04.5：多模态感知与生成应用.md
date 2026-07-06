> **👨‍🏫 教授说**  
> 前置条件：Vol 03 Embedding映射  
> 概念阶梯：模态对齐（★）→ CLIP/ImageBind原理（★★）→ 跨模态生成（★★★）
> 
> **🧑‍💻 TA说**  
> 动手入口 → 先跑起来（用随机向量模拟CLIP对齐）：
> ```python
> import numpy as np
> # 模拟文本和图像的Embedding对齐
> text_emb = np.random.randn(512)   # 文本embedding
> image_emb = np.random.randn(512)  # 图像embedding
> similarity = np.dot(text_emb, image_emb) / (np.linalg.norm(text_emb) * np.linalg.norm(image_emb))
> print(f"图文相似度: {similarity:.4f}")
> # 对齐训练：让配对的图文对cosine相似度趋近1
> ```

---

# Vol 04.5：多模态感知与生成应用

## 4.5.1 视觉模型应用

| 任务 | 推荐模型 |
|------|----------|
| 图像分类 | CLIP / SigLIP |
| 目标检测 | YOLOv8 / DETR |
| 语义分割 | SAM 2 |
| 图像生成 | SDXL / FLUX |
| 视频理解 | Gemini 2.0 / Qwen2.5-VL |

Agent集成：用CLIP对所有照片Embedding → 用户说"找海边照片" → 文本Embedding匹配 → 返回。

> **🧑‍💻 TA说**  
> "对齐"这个词听起来很玄，但在代码层面就是让图文embedding在向量空间里靠得更近。我做penguin-vl-ncnn项目时，最核心的优化就是减少文本和图像embedding之间的对齐损失——直接影响了多模态模型的召回率。

→ 底层基于[[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射|Embedding映射]]。

## 4.5.2 音频模型应用

| 任务 | 推荐模型 | 指标 |
|------|----------|------|
| 语音识别 | Whisper large-v3 | WER <3% |
| 语音合成 | Coqui-AI / Bark | MOS >4.0 |
| 音乐生成 | MusicGen / Suno | 主观质量 |

会议纪要Agent：Whisper转写 → LLM摘要 → 提取待办 → 发送邮件。

## 4.5.3 多模态融合Agent（MoA）

视频 → 视觉模型(关键帧) + 音频模型(旁白) + LLM(综合) → 结构化报告

## 章节小结

多模态不是"一个大模型做所有事"，而是"多个专用模型 + 聪明编排器"。

---

**→ 相关降维概念：** [[手册：核心概念降维缓存/Concept明细/Concept_07：搭建乐高|Concept_07：搭建乐高 (Agent编排)]]

→ [[教材：The Automated Mind/Phase 3：模型生态与Agent实践/Vol 08：Agent部署|下一章：Vol 08 Agent部署]]
