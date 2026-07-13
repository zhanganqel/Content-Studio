# Content Studio

Content Studio 是一个面向外贸企业的营销内容生产系统。当前项目由两个本地仓库组成：`studio` 前端仓库和 `backend` 后端仓库。`studio` 负责浏览器界面、项目知识、会话与产物展示；`backend` 负责 Codex SDK、HTTP/SSE 接口、Copilot 编排和 Studio 内容生产工作流。

默认演示项目包含 `Rejin CNC Technology Co.,Ltd` 和 `GOWE Group` 两套外贸业务数据。业务内容保持英文，系统界面支持中文和英文切换。

## AI Agent 与设计入口

- 开发前先阅读 `docs/AGENTS.md` {#项目级 Agent 工作规则:定义仓库边界、读文档顺序、运行安全和主动确认规则}。
- 涉及 UI、Figma、组件、图标或样式时，先阅读 `docs/DESIGN.md` {#设计系统规范:定义视觉 token、页面规范、组件规则和 Figma 对齐方式}。
- 涉及共享组件或页面组件时，继续阅读 `docs/component-guidelines.md` {#组件使用规范:说明共享 UI 组件的适用边界和新增规则}。
- 涉及本机 Copilot 后端联调时，阅读 `docs/local-codex-service.md` {#前后端联调说明:记录 backend 启动、接口、环境变量和排障方式}。

## 环境要求

- Node.js 18 或更高版本。
- pnpm。
- 前端本地依赖位于 `node_modules/` {#本地安装依赖目录:保留它可以确保立即运行 pnpm dev}。
- 前端本地环境文件 `.env` {#前端公开环境变量文件:只保留 VITE_CODEX_SERVER_URL，不存放模型密钥}。
- 后端需要本机已登录 Codex，或在后端 `.env` {#后端真实本地环境变量文件:存放模型密钥、模型、端口和代理配置，受 Git 忽略保护} 中配置 `CODEX_API_KEY` / `OPENAI_API_KEY` {#后端模型认证变量:没有本机登录时为 Codex SDK 提供 API 凭证}。

## 本地运行

前端 `studio`：

```bash
cd "/Users/zhangqiqi/Desktop/Content Studio"
pnpm install
pnpm dev
```

- `cd "/Users/zhangqiqi/Desktop/Content Studio"`：进入前端仓库。
- `pnpm install`：安装前端依赖；已有 `node_modules/` 时通常不需要重复执行。
- `pnpm dev`：启动 Vite 开发服务，默认地址为 `http://127.0.0.1:5173`。

后端 `backend`：

```bash
cd "/Users/zhangqiqi/Desktop/content-studio-backend"
pnpm install
pnpm dev
```

- `cd "/Users/zhangqiqi/Desktop/content-studio-backend"`：进入后端仓库。
- `pnpm install`：安装 Codex SDK、TypeScript 和服务端依赖。
- `pnpm dev`：启动本机后端服务，默认地址为 `http://127.0.0.1:8788`。

## 开发、测试、部署速查

前端验证：

```bash
pnpm build
pnpm preview
```

- `pnpm build`：在前端仓库生成 `dist/` {#前端生产构建目录:由 Vite 自动生成，不作为源码手动维护}。
- `pnpm preview`：预览最近一次 `pnpm build` 生成的生产构建。

后端验证：

```bash
pnpm typecheck
pnpm build
pnpm start
```

- `pnpm typecheck`：在后端仓库执行 TypeScript 类型检查，不生成构建产物。
- `pnpm build`：将后端 `src/` {#后端 TypeScript 源码目录:维护 HTTP 服务、Codex SDK 调用、Copilot 编排和工作流实现} 编译到 `dist/`。
- `pnpm start`：运行后端编译后的 `dist/server.js` {#后端生产入口:启动编译后的 Node.js HTTP 服务}。

前端部署到 GitHub Pages 前，先执行 `pnpm build`，再按当前 GitHub Pages/`gh-pages` 发布流程发布 `dist/`。

## 接口与数据流

前端通过 `src/services/codexServiceApi.js` {#前端后端 API 地址拼接入口:读取 VITE_CODEX_SERVER_URL 并生成请求 URL} 连接本机后端。未配置 `VITE_CODEX_SERVER_URL` {#前端后端地址覆盖变量:指定浏览器请求的 backend 服务地址} 时，默认连接 `http://127.0.0.1:8788`。

主要调用链：

```text
studio Copilot 页面
-> src/services/copilotChatApi.js
-> src/services/codexServiceApi.js
-> backend POST /chat
-> backend Copilot 编排和 Studio 工作流
-> SSE 事件返回 studio
-> studio 保存消息、来源和产物到浏览器数据层
```

关键接口：

- `POST /chat` {#后端 Copilot 对话接口:通过 SSE 返回任务状态、来源、消息增量、产物和错误事件}。
- `POST /outline` {#后端文章大纲接口:生成结构化 SEO 文章大纲}。
- `GET /health` {#后端健康检查接口:返回服务状态、模型配置和活动 thread 数量}。

前端负责会话、消息、产物、引用来源和 `threadId`{-会话绑定的 Codex 线程标识} 的浏览器持久化。发送消息时不提交品牌档案、受众画像、知识资料或历史数组；同一会话由后端恢复同一 Codex thread，使 SDK 自动继承此前 turn。不同会话的 thread 相互隔离。

## 目录结构

```text
studio/
├── README.md
├── docs/
│   ├── AGENTS.md
│   ├── DESIGN.md
│   ├── README.md
│   ├── component-guidelines.md
│   ├── local-codex-service.md
│   └── ai-workflow-ui-components.md
├── demo-data/
│   ├── gowe-group/
│   └── rejin-cnc/
├── scripts/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── components/
│   ├── data/
│   ├── i18n/
│   └── services/
├── package.json
├── pnpm-lock.yaml
├── vite.config.js
└── tailwind.config.js
```

后端目录结构以 `/Users/zhangqiqi/Desktop/content-studio-backend/README.md` 为准。前端仓库不承载 Codex SDK 源码、服务端密钥、HTTP 服务入口或后端工作流实现。

## 前端关键入口

- `src/main.jsx` {#React 应用挂载入口:把 App 渲染到 index.html 的 root 节点}。
- `src/App.jsx` {#前端状态中枢:管理项目、语言、导航、Copilot、外部视图和文章创作流程打开状态}。
- `src/components/AppShell.jsx` {#应用外壳组件:组合左侧导航、顶部栏和主内容区域}。
- `src/components/MainContent.jsx` {#主内容路由组件:根据导航项渲染品牌档案、受众画像、知识资料、博客文章或占位页}。
- `src/components/copilot/CopilotWorkbenchPage.jsx` {#Copilot 工作台页面:展示会话、项目知识入口、产物面板和预览区域}。
- `src/services/copilotChatApi.js` {#Copilot 前端通信服务:发起聊天请求并消费后端 SSE 事件流}。
- `src/services/copilotConversationStore.js` {#Copilot 浏览器存储服务:保存会话、消息、来源、产物和用户操作状态}。
- `src/i18n/messages.js` {#多语言文案入口:维护中文和英文 UI 文案、按钮、Toast 和错误提示}。

## 前端文档与脚本

- `docs/AGENTS.md` {#项目级 AI Agent 工作规则:指导 studio 前端和 backend 后端的开发、测试、部署协作}。
- `docs/DESIGN.md` {#设计系统规范:定义颜色、字号、组件、图标、Figma 和开发一致性规则}。
- `docs/component-guidelines.md` {#组件规范:说明共享 UI 组件的适用边界和新增规则}。
- `docs/local-codex-service.md` {#前后端联调说明:记录 backend 启动、接口、环境变量和排障方式}。
- `/Users/zhangqiqi/Desktop/content-studio-backend/docs/copilot-event-architecture.md` {#Copilot任务项、工作流与SSE事件的全局架构说明}。
- `/Users/zhangqiqi/Desktop/content-studio-backend/docs/sse-events.md` {#后端SSE事件、发送方、消费方和顺序说明}。
- `/Users/zhangqiqi/Desktop/content-studio-backend/docs/blog-article/blog-article-routing-events.md` {#博客任务、工作流与路由文档索引}。
- `scripts/build-gowe-group-demo.mjs` {#GOWE 演示数据构建脚本:生成 GOWE Group 前端 demo 数据入口}。
- `scripts/collect-rejin-cnc-images.mjs` {#Rejin 图片素材采集脚本:整理 Rejin CNC 演示图片资源}。

## 源码与数据边界

- `src/` {#前端运行源码目录:页面、组件、数据入口、服务层和多语言文案都在这里维护}。
- `demo-data/` {#演示数据库目录:保存产品经理可读的品牌、受众、知识、文件和图片素材}。
- `docs/` {#项目文档目录:保存 Agent 规则、设计规范、组件规范和联调说明}。
- `scripts/` {#支持脚本目录:保存数据采集和演示资料生成脚本，运行前先读 scripts/README.md}。
- `dist/` {#前端构建产物目录:由 pnpm build 生成，可删除，不作为源码维护}。
- `node_modules/` {#本地依赖目录:可重新安装，但保留可避免破坏当前开发运行}。
- `.env` {#本地环境变量文件:只用于本机配置，禁止提交真实密钥}。

删除、移动 `src/` 或 `demo-data/` 前，必须同步检查运行时引用并通过构建验证。后端接口、服务端环境变量、Codex SDK 和工作流源码只在 `backend` 仓库维护，不放入 `studio`。

## 开发规则

- 开发前先读 `docs/AGENTS.md`，涉及 UI 时再读 `docs/DESIGN.md` 和 `docs/component-guidelines.md`。
- 修改前端 `src/`、运行时数据、构建配置、依赖、脚本或入口文件后，必须执行 `pnpm build`。
- 修改后端接口或 SSE 事件协议时，同步检查 `studio` 的 `src/services/` 和 `backend` 的接口实现。
- 纯文档、Figma 原型、设计规范说明和 README 类改动不强制构建；交付时说明是文档-only。
