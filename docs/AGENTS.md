# AGENTS.md

本文件是 Content Studio 的项目级 AI Agent 工作规则，只适用于本项目的前后端仓库协作。不要修改 `/Users/zhangqiqi/.codex/AGENTS.md` {-全局 Codex 规则文件:不属于本项目仓库治理范围}，除非用户明确要求。

## 仓库边界

- `studio` 是前端仓库：`/Users/zhangqiqi/Desktop/Content Studio`，GitHub 远端为 `zhanganqel/Content-Studio`。
- `backend` 是后端仓库：`/Users/zhangqiqi/Desktop/content-studio-backend`，GitHub 远端暂时保留为 `zhanganqel/content-studio-copilot`。
- 用户说“前端仓库”时，默认指 `studio`；用户说“后端仓库”时，默认指 `backend`。
- 前端 UI、GitHub Pages、Figma 对齐、本地 service/mock、浏览器数据、浏览器可见性验证默认在 `studio` 中处理。
- Codex SDK、HTTP/SSE 接口、Copilot 编排、Studio 标准工作流、服务端环境变量和后端验证默认在 `backend` 中处理。
- 跨前后端联调时，先说明会涉及 `studio` 和 `backend` 两个仓库，再分别在对应目录执行命令。
- 旧本地后端路径和 `studio` 内历史误放的后端目录不再作为当前后端入口；只有用户明确要求处理旧目录时才进入。

## 先读顺序

1. `README.md` {-全项目说明入口:确认 studio 与 backend 的仓库关系、运行方式、测试规则和部署边界}。
2. `docs/AGENTS.md` {-项目级 AI Agent 工作规则:确认本次任务的协作、验证和沟通约束}。
3. 当前要修改目录下的 `README.md` {-目录级说明文件:确认该目录的输入、输出、运行边界和维护规则}。
4. 涉及 UI、Figma、组件、图标或样式时，先读 `docs/DESIGN.md` {-设计系统规范:定义 token、组件、图标和 Figma/开发一致性规则}。
5. 涉及共享组件时，继续读 `docs/component-guidelines.md` {-组件规范:说明共享 UI 组件的复用、新增和变体规则}。
6. 涉及前后端联调时，读 `docs/local-codex-service.md` {-本机后端联调说明:记录 backend 启动、接口、环境变量和排障方式}。

## 开发流程

- 先用 `git status -sb` 检查工作区，区分本次要改的文件和用户已有改动；不要回退或覆盖用户改动。
- 明确任务属于前端、后端、跨仓库、文档、Figma 原型还是能力安装；只改对应范围内的文件。
- 代码或文档引用字段、函数、脚本、文件时，在对应内容后使用 `{-一句话用途}` 说明用途，例如 `src/services/codexServiceApi.js` {-前端后端 API 地址拼接入口:读取 VITE_CODEX_SERVER_URL 并生成请求 URL}。
- 涉及命令行操作时，向用户解释每一行命令的作用；README 中出现命令块时，也要在命令块后逐行说明。
- 新增或修改持久化逻辑时，优先放在 `src/services/` {-前端服务层目录:集中管理 API、浏览器存储和跨页面数据逻辑}，不要散落在页面组件里。
- 修改前端 API 通信时，同时检查 `backend` 的接口、SSE 事件名、请求字段和 CORS；修改后端接口时，同步检查 `studio` 的 `src/services/`。
- 不把 `dist/` {-构建产物目录:由构建命令生成，不作为源码手动维护} 当作源码修改；部署前重新构建。

## 代码注释规则

- 源码注释统一使用中文，表达简洁，只解释代码本身，不写教学式说明，不扩展业务背景。
- 注释根据代码块实际内容选择单行注释、多行注释或 JSX 注释；不要为了统一样式强行使用同一种形式。
- 代码注释使用项目维护口吻，不出现“研发”“同事”“阅读者”等指代。
- 单行注释 `//` 用于短逻辑块、分支判断、兜底处理、非显而易见的状态更新。
- 多行注释 `/** ... */` 用于导出函数、跨模块函数、状态机、任务路由、缓存迁移、SSE 事件处理等复杂逻辑。
- JSX 注释 `{/* ... */}` 用于页面大区块或复杂渲染分支，不标注普通容器、普通按钮、样式类名。
- 字段注释只用于跨接口传递、影响缓存、影响状态恢复、容易误解的字段。
- 不解释显而易见的赋值、普通渲染结构、按钮文案和 Tailwind class。
- 涉及状态机、会话线程、任务路由、缓存迁移、SSE 等复杂逻辑时，改代码后同步更新对应的 `docs/` 说明。

```js
// 按项目维度读取缓存，避免不同项目的数据互相覆盖。
const cache = loadProjectCache(projectId)
```

```ts
/**
 * 创建或复用会话线程。
 * 同一会话必须连续使用相同上下文。
 */
async function resolveThread(...)
```

```jsx
{/* 产物预览区：展示当前选中的生成结果 */}
<section>
  ...
</section>
```

## 主动确认规则

- 原型图里的文案、按钮位置、按钮顺序、交互状态、数据展示或页面跳转逻辑不清楚时，不要自行猜测；先列出模糊点、推荐处理方式，并向用户确认。
- 用户的新任务与现有已开发内容、`docs/DESIGN.md`、`docs/component-guidelines.md` 或目录边界冲突时，不要直接覆盖；先说明冲突位置、影响范围和可选方案，并等待确认。
- 发现已有相同或高度相似的模块、布局、交互或页面元素时，先列出可复用位置和建议复用方式，再询问是否创建共享组件、扩展共享组件或直接复用。
- 不允许为了推进任务自行删除已有能力、改变页面信息架构或改写核心业务逻辑。

## 验证矩阵

| 改动类型 | 必须验证 | 说明 |
| --- | --- | --- |
| `studio` 文档、README、规范文字 | 搜索或人工检查引用 | 文档-only 不强制 `pnpm build`。 |
| `studio` 源码、运行时数据、构建配置、依赖、脚本、入口文件 | `pnpm build` | 影响可见 UI、交互、默认数据或生成内容时，还要做浏览器可见性验证。 |
| `studio` 浏览器显示不更新 | 强制刷新、加时间戳访问、必要时 `pnpm dev:fresh` | 正常预览优先级高于“不中断预览服务”。 |
| `backend` TypeScript 源码、接口、配置、依赖 | `pnpm typecheck` 和 `pnpm build` | 需要生产运行验证时再执行 `pnpm start`。 |
| 跨前后端协议或 SSE 事件 | 前端 `pnpm build`，后端 `pnpm typecheck` 和 `pnpm build` | 同步检查请求字段、事件名、CORS 和错误处理。 |
| Figma 原型、截图、标注 | Figma/浏览器视觉检查 | 不强制构建，除非同时修改 React/Vite 源码。 |

## 部署规则

- 前端 GitHub Pages 发布前，在 `studio` 执行 `pnpm build`，确认 `dist/` 是最新生产构建。
- 当前前端没有 package-level deploy script，也没有 `.github` workflow；不要在文档里伪造不存在的部署命令。
- 发布 `dist/` 到 `gh-pages` 前，确认当前分支、远端、构建结果和 GitHub Pages 部署状态；失败时优先查看 GitHub Actions/Deployments 日志。
- 后端当前是本机 Node.js + TypeScript 服务。生产化部署前，先在 `backend` 执行 `pnpm typecheck`、`pnpm build`，再用 `pnpm start` 验证编译产物可运行。
- 后端真实密钥只放在后端 `.env` {-后端本地环境变量文件:保存模型认证、端口和 CORS 等服务端配置}，禁止写入前端环境变量或提交到 Git。

## 能力安装与使用规则

- “能力”包括 skill、plugin、MCP、CLI、脚本等任何外部需要安装或接入的工具。
- 如果用户要求安装能力，且没有指定安装位置，能力本体统一放在 `~/.agents/<能力>/` {-共享能力安装目录:让不同 AI Agent 可复用同一外部能力}。
- 能力说明文件统一放在 `~/.codex/skills/<能力>/SKILL.md` {-能力使用说明入口:记录调用入口、使用方式和用户自定义规则}。
- 使用能力前先阅读对应说明文件，再到说明文件指定的位置调用能力本体。
- 使用能力产生的项目产物必须放在当前工作空间的项目目录下，不要把产物留在 `~/.agents/`。

## 沟通规则

- 交付时说明改了哪些文件、做了哪些验证、哪些验证没有做以及原因。
- 如果需要用户在命令行执行操作，逐行解释命令作用。
- 如果因为沙箱、权限、登录、网络或外部服务状态导致不能完成，说明阻塞点、已验证事实和下一步需要的用户动作。
- 文档-only 改动交付时明确说明“不运行构建，因为没有修改运行时代码”。
