# Docs

这里存放 Content Studio 的项目文档和研发约束。根目录 `README.md` {#全项目说明入口:说明 studio 与 backend 的仓库关系、运行、测试、部署和边界} 是项目入口；本目录负责更细的规范和说明。

## 文档索引

| 文档 | 说明 |
| --- | --- |
| `AGENTS.md` | 项目级 AI Agent 工作规则，指导 `studio` 前端和 `backend` 后端的开发、测试、部署协作。 |
| `DESIGN.md` | 项目设计规范，包含 token、组件、icon、Figma/开发一致性规则。 |
| `component-guidelines.md` | 现有共享组件使用规则和复用确认规则。 |
| `ai-workflow-ui-components.md` | Copilot结构化消息、Agent头像、任务状态、输入组件、产物卡和预览规范。 |
| `blog-article-ai-task-flow.md` | 博客文章协同创作、自动创作、未保存退出拦截和任务成文规则。 |
| `local-codex-service.md` | Content Studio 本机后端、Codex SDK、接口和联调说明。 |
| `/Users/zhangqiqi/Desktop/content-studio-backend/docs/copilot-event-architecture.md` | Copilot 任务项事件、工作流事件和 SSE 事件的全局关系。 |
| `/Users/zhangqiqi/Desktop/content-studio-backend/docs/copilot-conversation-architecture.md` | Copilot 会话数据、Codex Thread、Run 状态机、并发和异常恢复的唯一开发说明。 |
| `/Users/zhangqiqi/Desktop/content-studio-backend/docs/sse-events.md` | 全部 SSE 字段、发送脚本、前端消费方、事件顺序和实现状态。 |
| `/Users/zhangqiqi/Desktop/content-studio-backend/docs/blog-article/blog-article-routing-events.md` | 博客文章任务、工作流、触发词和逐项文档入口。 |
| `../demo-data/rejin-cnc/README.md` | 演示数据库说明。 |
| `../scripts/README.md` | 支持脚本说明。 |
| `/Users/zhangqiqi/Desktop/content-studio-backend/README.md` | 后端仓库说明，包含 Codex SDK 服务的运行、接口、测试和部署规则。 |

## 维护规则

- 文档要明确说明适用范围，避免与根 README 重复。
- Agent 工作规则先更新 `AGENTS.md`，再同步根 README 和后端 README 中的入口说明。
- 设计和组件规范先更新 `DESIGN.md`，再更新组件级说明。
- 后端接口或启动方式变化时，同步更新 `local-codex-service.md`、根 README 和后端 README。
- 事件概念变化时更新后端 `copilot-event-architecture.md`；会话和 Thread 变化时更新 `copilot-conversation-architecture.md`；SSE 变化时更新 `sse-events.md`；博客路由变化时更新 `blog-article/` 对应文档。
