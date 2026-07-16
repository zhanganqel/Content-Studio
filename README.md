
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

## 前端入口

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
