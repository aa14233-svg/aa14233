# 太白炁渊 · 命理全栈 — 项目上下文

## 一、项目概览

独立全栈命理应用程序。由三层构成：
- **Rust 引擎层** — 四柱八字/六爻/紫微斗数/奇门遁甲 计算
- **Node.js 服务层** — REST API + LM Studio 代理
- **前端 UI 层** — 纯 HTML/CSS/JS 单页应用

---

## 二、文件清单与路径

### 2.1 应用发布目录 — `E:\trae work\taibai-release\`

```
E:\trae work\taibai-release\
├── taibai_engine.exe          ← Rust 编译引擎 (417KB, 四引擎合一)
├── taibai_engine.rs           ← Rust 源码 (1239行, 无外部依赖)
├── taibai_engine.pdb          ← 调试符号文件
├── server.js                  ← Node.js API 服务 (304行, Express)
├── package.json               ← Node 依赖声明
├── package-lock.json          ← 依赖锁文件
├── node_modules\              ← npm 依赖 (express, cors, body-parser)
├── public\
│   ├── index.html             ← SPA 前端 (369行, 9个页面切换)
│   └── style.css              ← 暗色主题 (内联变量)
├── data\
│   ├── history.json           ← 排盘历史记录 (数组, JSON)
│   └── settings.json          ← 应用设置 (当前为空对象 {})
├── build_with_vs.cmd          ← MSVC 构建脚本
└── 启动命理应用.bat           ← 一键启动脚本
```

### 2.2 LM Studio 模型目录 — `E:\LM Studio\models\`

```
E:\LM Studio\models\
├── lm-kit\bge-m3-gguf\
│   └── bge-m3-Q4_K_M.gguf           ← 向量检索 (417 MB)
├── lmstudio-community\Qwen3.5-0.8B-GGUF\
│   └── Qwen3.5-0.8B-Q4_K_M.gguf     ← 路由调度 (503 MB)
├── Qwen\Qwen2.5-1.5B-Instruct-GGUF\
│   └── qwen2.5-1.5b-instruct-q4_k_m.gguf  ← 质检校验 (1.04 GB)
└── Qwen\Qwen2.5-3B-Instruct-GGUF\
    └── qwen2.5-3b-instruct-q4_k_m.gguf     ← 对话推理 (1.96 GB)
```

LM Studio 配置路径: `C:\Users\Acer\.lmstudio\settings.json`
- `downloadsFolder`: `E:\\LM Studio\\models` (已配置为 E 盘)
- LM Studio API 地址: `http://127.0.0.1:1234/v1`

### 2.3 Obsidian 提示词注入 — `E:\obsidian\taibai-命理全栈\`

```
E:\obsidian\taibai-命理全栈\
├── 提示词注入\
│   ├── 对话注入.md         ← 主对话 prompt (Qwen2.5-3B, 太白炁渊 persona)
│   ├── 路由器注入.md       ← 路由调度 prompt (Qwen3.5-0.8B)
│   ├── 质检注入.md         ← 质检校验 prompt (Qwen2.5-1.5B)
│   └── 嵌入注入.md         ← BGE-M3 embedding 文档
├── 世界观.md
├── 引擎拓扑.md
├── 规则体系.md
└── 太白炁渊经.md
```

### 2.4 其他重要路径

| 组件 | 路径 |
|------|------|
| Rust 工具链 | `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\` |
| Cargo 全局配置 | `C:\Users\Acer\.cargo\config.toml` (含 sccache 配置) |
| Cargo 项目目录 | `c:\Users\Acer\.trae\work\6a4a39910f5de83636729f60\` (旧工作区) |
| 引力量子体 (LSO) | `E:\LM Studio\lso_server.py` |

---

## 三、架构流程图

```
 ┌─────────────┐      ┌──────────────────────┐      ┌──────────────────┐
 │  前端 SPA   │◄────►│  Node.js API Server  │◄────►│  LM Studio API   │
 │ index.html  │ HTTP │  server.js :3456     │ HTTP │  :1234/v1        │
 │ style.css   │      │                      │      │  ├─ Qwen2.5-3B   │
 │ (app.js)    │      │  routes:             │      │  ├─ Qwen3.5-0.8B │
 └─────────────┘      │  GET  /api/ping      │      │  ├─ Qwen2.5-1.5B │
       │              │  POST /api/bazi      │      │  └─ BGE-M3       │
       ▼              │  POST /api/liuyao    │      └──────────────────┘
 ┌─────────────┐      │  POST /api/ziwei            │
 │ Rust 引擎   │◄────►│  POST /api/qimen            │
 │ .exe        │stdin │  POST /api/route             │
 │ stdin/stdout│/out  │  POST /api/dialog ───────────┘
 └─────────────┘      │  POST /api/embed  ───────────┘
                      │  GET/POST/DEL /api/history
                      │  GET/POST /api/settings
                      └──────────────────────┘
```

---

## 四、引擎计算 API 协议

所有引擎调用统一通过 `spawn taibai_engine.exe` + stdin/stdout JSON 通信。

### 请求格式 (stdin 单行 JSON)

| type | 参数 | 说明 |
|------|------|------|
| `bazi` | `year, month, day, hour, gender` | 四柱八字排盘 |
| `liuyao` | `seed` (可选, 默认 Date.now()) | 六爻起卦 |
| `ziwei` | `year, month, day, hour, gender` | 紫微斗数排盘 |
| `qimen` | `year, month, day, hour` | 奇门遁甲排盘 |

### 响应格式 (stdout JSON)

```json
{
  "type": "bazi",
  "nian_zhu": { "gan": "庚", "zhi": "午", "gan_idx": 6, "zhi_idx": 6, "wu_xing": "金", "cang_gan": ["庚","己"] },
  "yue_zhu": { ... },
  "ri_zhu": { ... },
  "shi_zhu": { ... },
  "sheng_xiao": "马",
  "wu_xing_stat": { "mu": 1, "huo": 0, "tu": 4, "jin": 6, "shui": 2 },
  "cang_gan_detail": [[...],[...],[...],[...]],
  "shi_shen": [["正财"],["偏财"],["比肩"],["食神"]],
  "da_yun": [{"start_age":0,"gan":"庚","zhi":"巳"},...],
  "shen_sha": {"华盖":["戌"],"天乙贵人":["子","申"],"桃花":["卯"],"驿马":["申"]}
}
```

---

## 五、Server API 路由表

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/ping` | 健康检查 |
| POST | `/api/bazi` | 八字排盘 |
| POST | `/api/liuyao` | 六爻起卦 |
| POST | `/api/ziwei` | 紫微排盘 |
| POST | `/api/qimen` | 奇门排盘 |
| POST | `/api/route` | 意图路由 |
| POST | `/api/dialog` | 对话 (→ LM Studio) |
| POST | `/api/embed` | 向量嵌入 (→ LM Studio) |
| GET | `/api/history` | 排盘历史 |
| POST | `/api/history` | 添加历史记录 |
| DELETE | `/api/history/:id` | 删除历史 |
| GET | `/api/settings` | 获取设置 |
| POST | `/api/settings` | 更新设置 |

---

## 六、对话 + 模型调度流程

```
用户输入 ──► /api/route ──► Qwen3.5-0.8B (路由分类)
                              │
                     ┌────────┼────────┐
                     ▼        ▼        ▼
                  八字     六爻     其他对话 ──► /api/dialog ──► Qwen2.5-3B (主对话)
                    │         │                           │
                    ▼         ▼                  ┌─────────┴──────────┐
               taibai_engine.exe              系统提示词来自 Obsidian:
                                                 对话注入.md (太白炁渊 persona)
                                                 质检完成 → Qwen2.5-1.5B (可选)
                                                 向量检索 → BGE-M3 (可选)
```

---

## 七、LM Studio 模型配置

| 模型 | 文件 | 用途 | 量化 | 温度 | 显存 |
|------|------|------|------|------|------|
| BGE-M3 | `bge-m3-Q4_K_M.gguf` | 向量嵌入 | Q4_K_M | - | CPU 可跑 |
| Qwen3.5-0.8B | `Qwen3.5-0.8B-Q4_K_M.gguf` | 路由调度 | Q4_K_M | 0.0 | CPU 可跑 |
| Qwen2.5-1.5B | `qwen2.5-1.5b-instruct-q4_k_m.gguf` | 质检校验 | Q4_K_M | 0.1 | CPU 可跑 |
| Qwen2.5-3B | `qwen2.5-3b-instruct-q4_k_m.gguf` | 对话推理 | Q4_K_M | 0.65 | GPU 推荐 |

---

## 八、启动方式

### 方式一：双击启动脚本
```
E:\trae work\taibai-release\启动命理应用.bat
```

### 方式二：手动启动
```bash
cd /d "E:\trae work\taibai-release"
node server.js
# 服务运行于 http://127.0.0.1:3456
```

### 前提条件
1. Node.js 已安装
2. Rust 引擎 `taibai_engine.exe` 存在
3. LM Studio 已启动 (端口 1234) — 可选，纯引擎模式不依赖

---

## 九、注意事项

1. **前端 JS 缺失**：`index.html` 引用了 `/js/nebula-bg.js` 和 `/js/app.js`，但 `public/` 下暂无这些文件（引用的是根目录的旧版本 `nebula-bg.js`；`app.js` 暂未生成/迁移）
2. **CDN 外部依赖**：`index.html` 引用了 `three.js` CDN — 如需完全离线需内联或本地化
3. **LM Studio 需手动启动**：当前无自动启动 LM Studio 的脚本
4. **纯引擎模式可用**：即使 LM Studio 未启动，`/api/bazi`/`/api/liuyao`/`/api/ziwei`/`/api/qimen` 等计算接口仍可正常工作

---

## 十、已删除的旧模型 (供参考)

已从这两个路径完全删除：
- `E:\LM Studio\models\Qwen3-8B-Aldaris\qwen3-8b-q4_k_m.gguf` (4.68 GB)
- `C:\Users\Acer\.lmstudio\models\` 下所有旧文件及链接/junction
- 模型索引缓存 `model-index-cache.json` 等已清空
