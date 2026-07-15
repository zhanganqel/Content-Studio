# Content Studio

Content Studio 是面向外贸企业的营销内容生产系统。当前仓库已经整合 React 前端、EdgeOne Agent Functions{-运行有状态 AI 对话的服务端函数} 和 EdgeOne Node Functions{-运行健康检查及会话管理的服务端函数}，最终统一部署到 EdgeOne Makers。

默认演示项目包含 Rejin CNC Technology Co.,Ltd 和 GOWE Group。业务内容保持英文，系统界面支持中文和英文切换。

## 开发入口

- `docs/AGENTS.md` {-项目开发规则:定义仓库边界、验证、部署和沟通要求}。
- `docs/DESIGN.md` {-设计规范:定义视觉 token、组件和图标规则}。
- `docs/component-guidelines.md` {-组件规范:定义共享组件和列表复用规则}。
- `docs/edgeone-copilot-architecture.md` {-Copilot 架构说明:定义 EdgeOne 会话、SSE、缓存迁移和接口边界}。

## 目录结构

```text
Content Studio/
├── agents/                 # EdgeOne 有状态 AI 对话函数
├── cloud-functions/        # EdgeOne 普通 Node Functions
├── docs/                   # 架构、组件和开发规范
├── demo-data/              # 演示业务数据
├── scripts/                # 数据整理脚本
├── src/                    # React 前端源码
├── edgeone.json            # EdgeOne 构建和 Agent 框架配置
├── package.json            # 前后端统一依赖和脚本
└── vite.config.js          # Vite 前端构建配置
```

关键入口：

- `src/App.jsx` {-前端状态中枢:管理项目、导航、Copilot 和文章创作页面}。
- `src/components/copilot/CopilotWorkbenchPage.jsx` {-Copilot 工作台:管理会话 UI、流式消息、来源和产物}。
- `src/services/copilotChatApi.js` {-Copilot 通信服务:请求 EdgeOne 接口并解析 SSE 事件}。
- `src/services/copilotServiceApi.js` {-服务地址与会话头服务:生产使用同源接口并生成浏览器会话隔离标识}。
- `agents/chat/index.ts` {-EdgeOne Copilot Agent:调用 OpenAI Agents SDK 并输出流式回复}。
- `cloud-functions/health/index.ts` {-服务健康检查:返回模型和认证配置状态}。

## 环境变量

复制 `.env.example` {-环境变量模板:只包含变量名和非敏感默认值} 为被 Git 忽略的 `.env`，并填写：

- `AI_GATEWAY_API_KEY` {-服务端模型网关密钥，禁止提交到 Git}。
- `AI_GATEWAY_BASE_URL` {-OpenAI 兼容模型网关地址}。
- `AI_GATEWAY_MODEL` {-服务端模型标识}。
- `VITE_COPILOT_SERVER_URL` {-可选的前端公开接口地址，本地跨端口联调时使用}。

生产部署默认使用同源 `/chat`、`/stop` 和 `/health`，因此通常不配置 `VITE_COPILOT_SERVER_URL`。

## 本地开发

```bash
cd "/Users/zhangqiqi/Desktop/Content Studio"
pnpm install
cp .env.example .env
/Users/zhangqiqi/.agents/edgeone-cli/bin/edgeone makers dev
```

- `cd "/Users/zhangqiqi/Desktop/Content Studio"`：进入统一项目仓库。
- `pnpm install`：安装 React、OpenAI Agents SDK 和 EdgeOne 运行代码依赖；首次运行或依赖变化后执行。
- `cp .env.example .env`：创建本地环境文件；随后在 `.env` 中填写真实模型密钥。
- `/Users/zhangqiqi/.agents/edgeone-cli/bin/edgeone makers dev`：启动 EdgeOne 本地前后端联调服务。

只开发前端界面时可运行：

```bash
pnpm dev
```

- `pnpm dev`：只启动 Vite 前端；Copilot 需要同时存在可访问的 EdgeOne 接口。

## 验证

```bash
pnpm run typecheck:edgeone
pnpm build
git diff --check
```

- `pnpm run typecheck:edgeone`：检查 `agents/` 和 `cloud-functions/` 中服务端 TypeScript 类型。
- `pnpm build`：生成 React 前端生产构建到 `dist/` {-前端构建产物目录}。
- `git diff --check`：检查本次改动是否存在空白符或补丁格式错误。

## EdgeOne 部署

首次部署前登录并绑定现有项目：

```bash
/Users/zhangqiqi/.agents/edgeone-cli/bin/edgeone login
/Users/zhangqiqi/.agents/edgeone-cli/bin/edgeone makers link --name content-studio-agents
/Users/zhangqiqi/.agents/edgeone-cli/bin/edgeone makers deploy . --name content-studio-agents --env production
```

- `edgeone login`：在浏览器完成 EdgeOne CLI 登录。
- `edgeone makers link --name content-studio-agents`：把当前目录绑定到已有 EdgeOne 项目。
- `edgeone makers deploy . --name content-studio-agents --env production`：将当前仓库的前端、Agent Functions 和 Node Functions 部署到生产环境。

部署前必须在 EdgeOne 项目中配置服务端模型环境变量。真实密钥不写入 `.env.example`、前端 `VITE_*` 变量或 Git 历史。

## 接口与数据边界

- `POST /chat` {-Copilot SSE 对话接口:接收消息和用户明确选择的知识附件}。
- `POST /stop` {-运行停止接口:按会话标识中止当前生成}。
- `POST /history` {-服务端历史接口:读取 EdgeOne 新会话消息}。
- `POST /conversations` {-会话列表接口:按匿名浏览器用户标识隔离}。
- `POST /delete-conversation` {-会话删除接口:清理服务端会话记录}。
- `GET /health` {-健康检查接口:返回模型与认证配置状态}。

旧 Copilot 会话历史不会迁移。首次运行新版本时只清理 Copilot 会话相关浏览器表，不清理品牌档案、受众画像、知识资料、博客文章或文章创作任务。新会话上下文由 EdgeOne OpenAI Session{-EdgeOne 会话存储对 OpenAI Agents SDK 的适配层}维护。

当前 EdgeOne Agent 先提供普通 Copilot 对话和显式知识附件引用。文章策划、大纲、正文等结构化任务路由仍待后续迁移；前端现有事件处理和表单组件会保留，便于逐项恢复这些能力。
