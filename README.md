# Content Studio

Content Studio 是一个面向外贸企业的营销内容生产工具前端原型。当前项目以 `Rejin CNC Technology Co.,Ltd` 作为演示项目，把品牌资料、受众画像、知识表、资料文件、图片素材和博客创作流程统一沉淀为后续 AI 创作与 SEO 内容生产可调用的项目知识。

本仓库目前是前端原型，不接入后端。业务演示数据使用英文，系统界面支持中文和英文切换。

## 目录

- [功能概览](#功能概览)
- [技术栈](#技术栈)
- [项目文件树](#项目文件树)
- [关键文件说明](#关键文件说明)
- [数据与文案规则](#数据与文案规则)
- [待补充](#待补充)

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
| AI 站点测试 | `ai-site-tests/rejin-cnc-brand-site/` 保存 AI 生成的 Rejin CNC 品牌站点静态样例。 |

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

## 项目文件树

以下文件树省略了 `node_modules/`、`dist/`、`.git/`、`.vite/`、`.DS_Store` 等依赖、构建产物和系统文件；图片素材只展示分类目录，不逐张列出。

```text
.
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── Content Studio.png
├── docs/
│   └── component-guidelines.md
├── scripts/
│   └── collect-rejin-cnc-images.mjs
├── demo-data/
│   └── rejin-cnc/
│       ├── README.md
│       ├── brand-profile.md
│       ├── audience-personas.md
│       ├── source-pages.md
│       ├── products/
│       ├── services/
│       ├── solutions/
│       ├── cases/
│       ├── faqs/
│       ├── file/
│       │   ├── README.md
│       │   ├── file-library.md
│       │   ├── Rejin CNC Introduce.docx
│       │   ├── Rejin CNC Knowledge Tables.xlsx
│       │   ├── Rejin CNC Website Crawl Summary.xlsx
│       │   └── Service-*.docx
│       └── assets/
│           ├── README.md
│           ├── image-library.md
│           └── images/
│               ├── brand/
│               ├── services/
│               ├── products/
│               ├── cases/
│               └── materials-process/
├── ai-site-tests/
│   └── rejin-cnc-brand-site/
│       ├── README.md
│       ├── index.html
│       ├── products.html
│       ├── services.html
│       ├── cases.html
│       ├── contact.html
│       ├── styles.css
│       ├── site-structure.json
│       └── assets/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── i18n/
    │   └── messages.js
    ├── data/
    │   ├── navigation.js
    │   └── demo/
    │       ├── rejinCncProject.js
    │       ├── rejinCncAssetLibrary.js
    │       └── rejinCncFileLibrary.js
    ├── services/
    │   ├── brandProfileStore.js
    │   ├── audiencePersonaStore.js
    │   ├── knowledgeItemStore.js
    │   ├── blogArticleStore.js
    │   ├── blogArticleAiStore.js
    │   ├── mediaLibraryApi.js
    │   └── fileLibraryApi.js
    └── components/
        ├── AppShell.jsx
        ├── Sidebar.jsx
        ├── Topbar.jsx
        ├── MainContent.jsx
        ├── layoutClasses.js
        ├── ui/
        ├── brand-profile/
        ├── audience-persona/
        ├── knowledge-items/
        ├── knowledge-assets/
        └── blog-article/
```

## 关键文件说明

### 根目录与构建配置

| 文件 | 作用 |
| --- | --- |
| `README.md` | 项目入口文档，帮助研发快速理解功能、启动方式和目录职责。 |
| `package.json` | 依赖和脚本配置；常用脚本是 `pnpm dev`、`pnpm build`。 |
| `pnpm-lock.yaml` | 锁定依赖版本，保证协作环境一致。 |
| `pnpm-workspace.yaml` | pnpm workspace 配置。 |
| `index.html` | Vite HTML 入口，挂载 React 根节点；不能直接用文件路径打开。 |
| `vite.config.js` | Vite 构建配置。 |
| `tailwind.config.js` | Tailwind 扫描路径和主题扩展配置。 |
| `postcss.config.js` | PostCSS 配置，用于 Tailwind 和 Autoprefixer。 |
| `Content Studio.png` | 早期产品模块脑图，用于理解整体功能规划。 |

### 文档与脚本

| 路径 | 作用 |
| --- | --- |
| `docs/component-guidelines.md` | 组件规范。新增页面时必须优先复用共享 `Button`、`PageHeader`、`Toast` 等组件。 |
| `scripts/collect-rejin-cnc-images.mjs` | Rejin CNC 图片素材采集脚本，用于抓取、筛选、去重并生成图片资料库索引。 |

### 演示数据

`demo-data/rejin-cnc/` 是产品经理和内容团队可读的数据源。业务内容保持英文，符合外贸项目场景。

| 路径 | 作用 |
| --- | --- |
| `demo-data/rejin-cnc/README.md` | 演示数据总说明。 |
| `brand-profile.md` | 品牌档案资料。 |
| `audience-personas.md` | 受众画像资料。 |
| `source-pages.md` | 官网与抓取来源页列表。 |
| `products/` | 主营产品资料，例如 iPad Hub、Coffee Machine Parts、UAV Structural Parts。 |
| `services/` | 主要服务资料，例如 CNC Turning、CNC Milling、DFM Support。 |
| `solutions/` | 解决方案资料。 |
| `cases/` | 客户案例资料。 |
| `faqs/` | 常见问题资料。 |
| `file/` | 资料文件库，包含 Word、Excel、文件索引和资料说明。 |
| `assets/` | 图片资料库，包含图片索引、分类图片和素材说明。 |

### AI 站点测试样例

| 路径 | 作用 |
| --- | --- |
| `ai-site-tests/rejin-cnc-brand-site/` | AI 生成品牌站点的静态样例，用于验证站点生成质量和后续站点构建能力。 |
| `site-structure.json` | 站点结构数据，描述页面、导航、内容块和资产引用。 |
| `index.html` / `products.html` / `services.html` / `cases.html` / `contact.html` | 静态站点页面样例。 |
| `styles.css` | 静态站点样式。 |
| `assets/` | 静态站点使用的图片素材。 |

### 应用入口

| 文件 | 作用 |
| --- | --- |
| `src/main.jsx` | React 应用挂载入口。 |
| `src/App.jsx` | 应用状态中枢：项目、语言、导航、外部视图、博客 AI 创作流程和编辑器打开状态。 |
| `src/styles.css` | 全局样式入口，加载 Tailwind 基础样式。 |

### 布局与通用组件

| 文件 | 作用 |
| --- | --- |
| `src/components/AppShell.jsx` | 应用外壳，组合左侧导航、顶部导航和主内容。 |
| `src/components/Sidebar.jsx` | 左侧固定导航栏，负责项目切换、一级模块展开、二级菜单选中。 |
| `src/components/Topbar.jsx` | 顶部固定栏，包含搜索范围、搜索框、账号菜单和语言切换入口。 |
| `src/components/MainContent.jsx` | 根据当前导航项渲染品牌档案、受众画像、知识条目、知识资料、博客文章或占位页。 |
| `src/components/layoutClasses.js` | 跨页面复用布局 class。 |
| `src/components/ui/Button.jsx` | 页面级主要、次要、普通、危险按钮。 |
| `src/components/ui/PageHeader.jsx` | 页面头部说明卡片，统一标题、描述和右侧操作按钮对齐。 |
| `src/components/ui/Toast.jsx` | 全局 Toast，通过 portal 悬浮显示，不参与页面布局。 |
| `src/components/ui/FixedPageLayout.jsx` | 固定视口页面布局辅助组件，用于需要内部滚动的页面。 |

### 业务页面组件

| 目录/文件 | 作用 |
| --- | --- |
| `src/components/brand-profile/BrandProfilePage.jsx` | 品牌档案页，管理基础信息、品牌事实、参考链接和品牌风格。 |
| `src/components/audience-persona/AudiencePersonaPage.jsx` | 受众画像页，管理目标受众卡片和本地持久化。 |
| `src/components/knowledge-items/KnowledgeItemsPage.jsx` | 知识条目页，管理预设和自定义知识类型表格。 |
| `src/components/knowledge-assets/KnowledgeAssetsPage.jsx` | 知识资料页，承载 `资料文件` 与 `资料库` Tab。 |
| `src/components/knowledge-assets/KnowledgeFilePreviewPage.jsx` | 资料文件预览页，用于查看文件元信息、标签和解析状态。 |
| `src/components/knowledge-assets/KnowledgeFileChunksPage.jsx` | 文件分块预览页，用于查看解析后的文本 chunk。 |
| `src/components/knowledge-assets/KnowledgeSourcePreviewPage.jsx` | 资料来源预览页，用于打开知识资料来源视图。 |
| `src/components/blog-article/BlogArticlePage.jsx` | 博客文章列表页。 |
| `src/components/blog-article/BlogArticleEditor.jsx` | 博客文章编辑器。 |
| `src/components/blog-article/BlogArticleAiCreateTaskPage.jsx` | AI 创作任务创建页。 |
| `src/components/blog-article/BlogArticleAiPlanningPage.jsx` | AI 创作策划阶段页。 |
| `src/components/blog-article/BlogArticleAiOutlinePage.jsx` | AI 创作标题和大纲阶段页。 |
| `src/components/blog-article/BlogArticleAiContentPage.jsx` | AI 创作正文阶段页。 |

### 数据入口

| 文件 | 作用 |
| --- | --- |
| `src/data/navigation.js` | 项目列表、导航模块、搜索范围和账号菜单配置。新增导航项优先改这里。 |
| `src/data/demo/rejinCncProject.js` | Rejin CNC 演示项目总入口，聚合品牌、受众、知识、媒体和文件资产。 |
| `src/data/demo/rejinCncAssetLibrary.js` | 图片资料库结构化入口，通过 Vite `import.meta.glob` 引入本地图片资源。 |
| `src/data/demo/rejinCncFileLibrary.js` | 资料文件库结构化入口，通过 Vite 引入本地 Word、Excel、PDF 等文件资源。 |

### 多语言

| 文件 | 作用 |
| --- | --- |
| `src/i18n/messages.js` | 系统 UI 文案。新增菜单、按钮、Toast、表单提示时必须补齐中文和英文。 |

### 本地服务层

当前服务层使用 `localStorage` 和浏览器内存对象模拟后端。后续接入真实 API 时，优先替换 service 内部实现，减少页面组件改动。

| 文件 | 作用 |
| --- | --- |
| `src/services/brandProfileStore.js` | 品牌档案读取、保存、重置。 |
| `src/services/audiencePersonaStore.js` | 受众画像读取和保存。 |
| `src/services/knowledgeItemStore.js` | 知识类型、字段定义、表格行数据读取和保存。 |
| `src/services/blogArticleStore.js` | 博客文章草稿读取和保存。 |
| `src/services/blogArticleAiStore.js` | AI 博客创作任务、阶段数据和演示内容生成数据。 |
| `src/services/mediaLibraryApi.js` | 图片/视频资料库接口，支持演示素材、上传素材、标签更新和删除上传素材。 |
| `src/services/fileLibraryApi.js` | 资料文件接口，支持演示文件、上传、解析、分块、标签更新和删除上传文件。 |

## 数据与文案规则

- 系统界面文案必须支持中文和英文，统一维护在 `src/i18n/messages.js`。
- Rejin CNC 演示项目的业务内容保持英文，不随系统语言切换自动翻译。
- 产品经理可读资料优先维护在 `demo-data/rejin-cnc/`。
- 前端页面读取 `src/data/demo/` 的结构化入口，并通过 `src/services/` 做本地保存。
- 页面组件不应直接散落 `localStorage` key；新增持久化能力优先封装到 `src/services/`。
- 共享视觉组件和交互规范以 `docs/component-guidelines.md` 为准。

## 待补充

- 后端 API 接入方案
- 登录、账号与权限体系
- 正式部署说明
- License
- Contributing 指南
