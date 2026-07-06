# Concept_09：快递分拣线

## 数学/逻辑本质
**SIMD 向量化**

## 降维直觉
一次搬运一筐，不是一次搬一个。

## 展开说明
AVX-512允许一条指令完成16个float的乘法。1024维余弦相似度计算：朴素需要1024次乘加，SIMD只需64个周期。vLLM/llama.cpp中Attention Score的计算正是用这种方式向量化的。

## 教材对应章节
→ [[教材：The Automated Mind/Phase 1：秩序的底座/Vol 01：C++与算力剥削|Vol 01：C++与算力剥削 §SIMD]]
→ [[教材：The Automated Mind/Phase 2：语义空间与认知具象/Vol 03：Embedding映射|Vol 03：Embedding映射 §余弦相似度]]

## 关联概念
→ [[手册：核心概念降维缓存/Concept明细/Concept_06：图书馆管理员|Concept_06：图书馆管理员 (RAG检索加速)]]
