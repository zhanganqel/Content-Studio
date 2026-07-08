# Content Studio

Content Studio 是一个面向外贸企业的营销内容生产工具前端原型。当前默认演示项目是 `Rejin CNC Technology Co.,Ltd`，用于验证品牌知识、受众画像、知识资料、博客 AI 创作和后续 SEO 内容生产流程。

本仓库是前端仓库 `studio`，当前以本地 demo/mock 为主，已开始通过 service 层对接后端仓库 `copilot`。业务演示数据使用英文，系统界面支持中文和英文切换。

## 快速运行

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

- `pnpm dev`：启动本地开发服务，默认使用 Vite。
- `pnpm build`：生成生产构建，用于验证部署前状态。
- `pnpm preview`：预览 `pnpm build` 生成的构建结果。

## 关联仓库

| 名称 | 本地路径 | GitHub 远端 | 职责 |
| --- | --- | --- | --- |
| `studio` | `/Users/zhangqiqi/Desktop/Content Studio` | `zhanganqel/Content-Studio` | React/Vite 前端、GitHub Pages、UI、Figma 对齐、本地 demo/mock 和前端 service。 |
| `copilot` | `/Users/zhangqiqi/Desktop/content-studio-copilot` | `zhanganqel/content-studio-copilot` | EdgeOne Makers / Deep Agents 后端、agents、cloud-functions、AI API 和后端部署配置。 |

当前前端联调后端的默认 API 配置入口是 `src/services/backendApi.js`，可通过 `VITE_API_BASE` 覆盖后端地址。后端代码不要放入本仓库；`content-studio-copilot-main/` 视为历史或误放目录，不作为后端开发入口，除非明确要求处理。

## 项目地图

```text
.
├── README.md
├── AGENTS.md
├── DESIGN.md
├── package.json
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── docs/
│   ├── README.md
│   └── component-guidelines.md
├── scripts/
│   ├── README.md
│   └── collect-rejin-cnc-images.mjs
├── demo-data/
│   └── rejin-cnc/
│       └── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── components/
    ├── data/
    ├── i18n/
    └── services/
```

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/` | 前端源码。页面、组件、数据入口、本地 service 和 i18n 都在这里。 |
| `demo-data/` | 演示数据库。保存产品经理可读的品牌、受众、知识、文件和图片素材。 |
| `docs/` | 项目文档索引和组件规则。新增规范类文档优先放这里。 |
| `scripts/` | 支持脚本。脚本可能会抓取或生成演示数据，运行前先读 `scripts/README.md`。 |
| `DESIGN.md` | 项目设计规范。Figma 原型、页面实现、组件新增都应先参考这里。 |
| `AGENTS.md` | AI Agent 协作入口。说明读文档顺序、目录边界和改动约束。 |
| `dist/` | 构建产物，不作为源码维护。 |
| `node_modules/`、`.vite/`、`.pnpm-store/` | 本地依赖和缓存，不作为项目内容维护。 |

## 功能概览

| 模块 | 当前能力 |
| --- | --- |
| 应用框架 | 左侧固定导航、顶部固定搜索栏、项目切换、账号菜单、右侧页面独立滚动。 |
| 多语言 | 系统菜单、按钮、提示、页面说明支持 `zh-CN` / `en-US`；默认中文。 |
| 品牌档案 | 管理公司基础信息、品牌事实、参考链接、品牌风格，支持编辑、保存、取消、URL 校验和标签录入。 |
| 受众画像 | 管理外贸 B2B 买家、工程师、采购负责人等营销画像，使用本地存储持久化。 |
| 知识条目 | 以表格管理主营产品、主要服务、解决方案、公司案例、FAQ 和自定义知识类型，支持在线编辑、必填校验和字段筛选。 |
| 知识资料 | 包含 `资料文件` 和 `资料库`。资料文件支持 Word、Excel、PDF、文本类资料的本地上传、解析和分块预览；资料库管理 Rejin CNC 图片素材。 |
| 博客文章 | 包含文章列表、文章编辑器、AI 创作任务创建、策划、标题/大纲、正文阶段页面。 |
| 演示项目数据 | `demo-data/rejin-cnc/` 维护产品经理可读 Markdown、文档、表格和图片素材；`src/data/demo/` 提供前端结构化入口。 |

## 技术栈

- React 19
- Vite 7
- Tailwind CSS
- Lucide React
- Mammoth：浏览器侧解析 `.docx`
- xlsx：浏览器侧解析 `.xlsx` / `.xls`
- pdfjs-dist：浏览器侧解析 PDF
- localStorage：当前 mock 数据和用户操作持久化
- pnpm：包管理

## 关键入口

| 文件 | 作用 |
| --- | --- |
| `src/main.jsx` | React 应用挂载入口。 |
| `src/App.jsx` | 应用状态中枢：项目、语言、导航、外部视图、博客 AI 创作流程和编辑器打开状态。 |
| `src/components/AppShell.jsx` | 应用外壳，组合左侧导航、顶部导航和主内容。 |
| `src/components/MainContent.jsx` | 根据当前导航项渲染品牌档案、受众画像、知识条目、知识资料、博客文章或占位页。 |
| `src/data/navigation.js` | 项目列表、导航模块、搜索范围和账号菜单配置。新增导航项优先改这里。 |
| `src/data/demo/rejinCncProject.js` | Rejin CNC 演示项目结构化入口。 |
| `src/i18n/messages.js` | 系统 UI 文案。新增菜单、按钮、Toast、表单提示时必须补齐中文和英文。 |
| `src/services/` | 本地服务层。后续接入真实 API 时优先替换 service 内部实现，减少页面组件改动。 |

## 分层文档

| 文档 | 说明 |
| --- | --- |
| `DESIGN.md` | 设计规范、组件 token、图标规则、Figma/开发一致性要求。 |
| `AGENTS.md` | AI Agent 协作规则。 |
| `docs/README.md` | 文档索引。 |
| `docs/component-guidelines.md` | 共享组件和页面组件使用规则。 |
| `demo-data/rejin-cnc/README.md` | 演示数据库说明。 |
| `scripts/README.md` | 支持脚本说明。 |

## 数据与文案规则

- 系统界面文案必须支持中文和英文，统一维护在 `src/i18n/messages.js`。
- Rejin CNC 演示项目的业务内容保持英文，不随系统语言切换自动翻译。
- 产品经理可读资料优先维护在 `demo-data/rejin-cnc/`。
- 前端页面读取 `src/data/demo/` 的结构化入口，并通过 `src/services/` 做本地保存。
- 页面组件不应直接散落 `localStorage` key；新增持久化能力优先封装到 `src/services/`。
- 共享视觉组件和交互规范以 `DESIGN.md` 和 `docs/component-guidelines.md` 为准。

## 运行安全规则

- 不移动 `src/` 和 `demo-data/`，除非同步更新并验证所有运行时引用。
- 不直接修改 `dist/` 作为源码；发布前通过 `pnpm build` 重新生成。
- 删除、移动演示素材或文件前，先检查 `src/data/demo/*` 是否引用。
- 新增 UI 前先读 `DESIGN.md`，优先复用 `src/components/ui/` 里的共享组件。
