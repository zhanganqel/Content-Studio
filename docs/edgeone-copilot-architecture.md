# EdgeOne Copilot 架构

## 适用范围

本文是 Content Studio 迁移到 EdgeOne 后的 Copilot 会话、接口和数据边界说明。当前仓库同时承载 React 前端、EdgeOne Agent Functions{-运行长连接 AI 对话的有状态函数} 和 EdgeOne Node Functions{-处理健康检查及会话管理的普通函数}。

## 运行结构

```text
React Copilot 工作台
  -> src/services/copilotChatApi.js
  -> POST /chat
  -> agents/chat/index.ts
  -> OpenAI Agents SDK + EdgeOne OpenAI Session
  -> SSE 事件流
  -> 浏览器会话展示和项目级缓存
```

- `agents/chat/index.ts` {-Copilot 对话入口:校验请求、组装显式附件、调用模型并输出流式事件}。
- `agents/stop/index.ts` {-任务停止入口:按 conversation_id 中止当前 EdgeOne Agent 运行}。
- `cloud-functions/health/index.ts` {-健康检查接口:返回模型和认证配置状态，不暴露密钥}。
- `cloud-functions/history/index.ts` {-服务端历史读取接口:从 EdgeOne 会话存储恢复新会话消息}。
- `cloud-functions/conversations/index.ts` {-会话索引接口:按浏览器和项目组合的 userId 隔离会话列表}。
- `cloud-functions/delete-conversation/index.ts` {-会话删除接口:删除服务端会话及其消息}。
- `src/services/copilotServiceApi.js` {-前端服务地址入口:生产使用同源接口，本地允许环境变量覆盖}。
- `src/services/copilotConversationStore.js` {-浏览器会话展示缓存:保存 UI 状态、消息、来源、产物和运行记录}。

## 会话状态

`conversationId` {-前后端共享的会话标识} 同时写入请求体和 `makers-conversation-id` {-EdgeOne Agents 恢复同一上下文的请求头}。后端使用 `context.store.openaiSession(conversationId)` {-OpenAI Agents SDK 会话适配器:让模型自动继承该会话此前消息}，不再创建或保存 Codex `threadId`。

单个会话的运行状态如下：

```text
idle -> running -> completed
              -> failed
              -> cancelled
```

- `running` {-前端正在消费 SSE 流且后端 Agent 仍在执行}。
- `completed` {-收到 done 事件且本轮输出正常结束}。
- `failed` {-收到 error_message 或网络请求失败}。
- `cancelled` {-用户点击停止，前端中断请求并调用 POST /stop}。

不同会话可以并行；同一会话在前端已有运行控制器时不重复提交。切换项目、关闭工作台或卸载页面时，前端会同时中断本地请求并通知 EdgeOne 停止对应运行。

## 请求和事件

`POST /chat` {-Copilot SSE 对话接口} 当前接收：

| 字段 | 用途 |
| --- | --- |
| `projectId` | 当前项目标识，用于业务隔离和日志定位。 |
| `conversationId` | 当前会话标识，用于模型上下文恢复。 |
| `userId` | 项目 ID 与匿名浏览器 ID 的组合，只用于 EdgeOne 会话索引隔离。 |
| `message` | 本轮用户输入。 |
| `attachments` | 用户明确选择的知识条目或知识文件内容，受数量和字符上限保护。 |
| `targetArtifact` | 前端当前选中的产物快照；保留接口兼容，当前普通对话 Agent 尚未执行结构化修订。 |
| `planningInputs` | 文章策划表单值；保留现有前端协议，当前普通对话 Agent 尚未执行任务路由。 |

当前 Agent 输出以下 SSE 事件：

| 事件 | 用途 |
| --- | --- |
| `process_delta` | 展示分析开始和完成摘要，不输出隐藏思维链。 |
| `source` | 回传本轮明确附加的知识来源。 |
| `message_delta` | 逐段追加助手正文。 |
| `error_message` | 返回可展示的运行错误。 |
| `done` | 标记本轮完成、取消或失败。 |

前端继续兼容 `task_status`、`workflow_status`、`artifact` 和 `clarification_required` 等现有结构化事件；待文章工作流迁移到 EdgeOne 后，服务端可以按原事件结构逐步恢复，不需要重写页面状态机。

## 数据迁移

旧 Copilot 会话历史不迁移。`edgeOneConversationResetVersion` {-一次性浏览器缓存迁移版本} 首次运行时只清空以下项目级表：

- `copilot-conversations`
- `copilot-messages`
- `copilot-artifacts`
- `copilot-sources`
- `copilot-runs`

迁移不会清理品牌档案、受众画像、知识资料、博客文章、文章创作任务或其它项目数据。迁移完成后写入版本标记，新建 EdgeOne 会话不会在后续刷新时再次清空。

## 环境与部署

- `@openai/agents`{OpenAI Agent 编排 SDK}固定为 `0.11.4`，与 EdgeOne OpenAI Agents 官方模板验证版本保持一致。只有本地与生产环境的 Agent 流式响应都通过后，才能升级该依赖。

服务端环境变量只配置在 EdgeOne 项目或本地忽略的 `.env` {-本地服务端密钥文件}：

- `AI_GATEWAY_API_KEY` {-模型网关密钥}。
- `AI_GATEWAY_BASE_URL` {-OpenAI 兼容模型网关地址}。
- `AI_GATEWAY_MODEL` {-模型标识，未配置时使用 EdgeOne Makers 默认模型}。

`VITE_COPILOT_SERVER_URL` {-前端公开服务地址覆盖变量} 仅用于本地跨端口联调。EdgeOne 生产部署不配置该变量，前端自动请求同源接口。

当前还未迁移的能力：

- 文章策划、大纲、正文等结构化 Copilot 任务路由。
- 后端数据库中的业务 CRUD{-对业务数据执行新增、读取、更新和删除的接口}。
- 旧 Codex SDK 后端的专用脚本和调试接口。

这些能力应按业务模块迁入本仓库的 `agents/` 或 `cloud-functions/`，不要重新依赖旧本机后端。
