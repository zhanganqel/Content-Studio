# Local Codex Service（历史）

> 本文记录迁移前的本机 Codex SDK 后端，仅用于排查旧实现。当前运行架构以 `edgeone-copilot-architecture.md` {-EdgeOne Copilot 当前架构说明} 为准，新功能不再接入该本机服务。

Content Studio 当前采用两个本地仓库：

- `studio`：`/Users/zhangqiqi/Desktop/Content Studio`，负责 React/Vite 前端和浏览器项目级数据。
- `backend`：`/Users/zhangqiqi/Desktop/content-studio-backend`，负责 Codex SDK、HTTP/SSE 接口和内容工作流。

## 启动顺序

先启动后端：

```bash
cd "/Users/zhangqiqi/Desktop/content-studio-backend"
pnpm install
pnpm dev
```

- `cd ...`：进入后端仓库。
- `pnpm install`：安装后端 Codex SDK 和 TypeScript 依赖，首次运行或依赖变化后执行。
- `pnpm dev`：启动后端开发服务，默认地址为 `http://127.0.0.1:8788`。

再启动前端：

```bash
cd "/Users/zhangqiqi/Desktop/Content Studio"
pnpm install
pnpm dev
```

- `cd ...`：进入前端仓库。
- `pnpm install`：安装前端 React/Vite 依赖。
- `pnpm dev`：启动前端开发服务，默认地址为 `http://127.0.0.1:5173`。

## 接口

- `GET /health`：检查 Codex 服务、模型配置和活动 thread 数量。
- `POST /chat`：返回 Copilot SSE 事件流。
- 任务与工作流接口当前停用；全部会话输入由 `POST /chat` 的普通 Copilot 回复处理。

`POST /chat`{-Copilot 流式聊天接口} 必须携带 `projectId`、`conversationId` 和当前 `message`，可携带 `threadId`{-当前会话绑定的 Codex 线程}、`targetArtifact`{-用户明确选择的文章或大纲快照}、`generationOptions`{-语言、语气与篇幅选项} 和 `taskContinuation`{-继续等待输入任务的数据}。请求不发送品牌上下文、项目知识或历史消息数组。

`targetArtifact`{-修订或按既有大纲生成时使用的目标产物} 只在用户明确操作当前产物时发送。普通回复、关键词和大纲任务只向 Codex 提交本轮用户输入与后端固定任务指令。

新会话首次执行时创建 Codex thread；后端通过 `thread_bound`{-返回 threadId 的 SSE 事件} 通知前端保存绑定。同一会话后续请求复用或恢复该 thread，由 Codex SDK 自动带入此前上下文。不同会话可以并行运行，同一会话一次只允许一个任务。

删除会话时，前端调用 `DELETE /threads/:projectId/:conversationId`{-释放后端 Thread 内存缓存的接口}。

## 会话开发说明

会话数据、Codex Thread、任务状态机、任务路由、`taskContinuation`{-等待任务续接字段}、SSE 协议、并发、停止和异常恢复规则统一维护在后端 [`copilot-conversation-architecture.md`](/Users/zhangqiqi/Desktop/content-studio-backend/docs/copilot-conversation-architecture.md){-Copilot 会话架构唯一开发说明} 中。

本地联调只需确认：运行、等待、完成和异常状态能正确显示；等待任务可继续输入；主动停止后请求结束且会话恢复最近更新时间。具体字段和转换规则不在本文重复维护。

## 配置

前端通过 `VITE_CODEX_SERVER_URL`{-前端连接后端服务的地址变量} 指定后端地址，未配置时使用 `http://127.0.0.1:8788`。后端 API Key、模型、端口和 CORS 配置仅放在后端 `.env`{-后端本地环境变量文件} 中；不要把真实密钥写入前端环境变量。

## 故障排查

1. 请求失败时先访问 `http://127.0.0.1:8788/health`。
2. 若端口不可访问，在后端仓库重新运行 `pnpm dev`。
3. 若返回认证错误，检查本机 Codex 登录或后端 `CODEX_API_KEY` / `OPENAI_API_KEY`。
4. 若前端连接了其他端口，检查 `VITE_CODEX_SERVER_URL` 后重启 Vite。
