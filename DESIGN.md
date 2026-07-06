---
version: alpha
name: Content Studio Design System
description: "Content Studio 是面向外贸企业营销内容生产的后台 SaaS 原型。设计系统以冷静的工作台体验为目标：深色左侧导航、浅灰工作区、白色内容面板、企业蓝主操作、紧凑表单与数据卡片。规范优先服务 React/Tailwind 开发、Figma 高保真原型和 AI Agent 生成页面。"

colors:
  brand: "#365EFF"
  brand-hover: "#2547D0"
  brand-soft: "#EEF3FF"
  brand-subtle: "#F4F6FF"
  canvas: "#F7F8FB"
  surface: "#FFFFFF"
  surface-muted: "#F5F7FA"
  sidebar: "#020617"
  sidebar-surface: "#1E293B"
  text-primary: "#303133"
  text-heading: "#232E45"
  text-secondary: "#606266"
  text-tertiary: "#909399"
  text-disabled: "#A8ABB2"
  line: "#DCDFE6"
  line-soft: "#EBEEF5"
  line-strong: "#E4E7ED"
  success: "#00A85F"
  success-soft: "#ECFDF5"
  warning: "#F59E0B"
  warning-soft: "#FFFBEB"
  danger: "#FF4346"
  danger-soft: "#FFF1F0"

typography:
  page-title:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.30
    letterSpacing: 0
  section-title:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: 0
  card-title:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: 0
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px

layout:
  sidebar-width: 300px
  topbar-height: 72px
  content-max-width: 1600px
  page-padding: 32px

components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 36px
    padding: 0 16px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.brand}"
    borderColor: "{colors.brand}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 36px
    padding: 0 16px
  button-neutral:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    borderColor: "{colors.line}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 36px
    padding: 0 16px
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 36px
    padding: 0 16px
  page-header:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-heading}"
    rounded: "{rounded.md}"
    padding: 24px 28px
  card:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line-soft}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 24px
  text-input:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.line}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    height: 44px
    padding: 0 12px
  toast:
    backgroundColor: "{colors.brand-soft}"
    textColor: "{colors.brand}"
    rounded: "{rounded.lg}"
    minHeight: 40px
---

## Overview

Content Studio 是工作型后台产品，不是营销落地页。界面应该安静、密集、可扫描，优先支持重复操作、表单填写、资料管理和 AI 内容生成流程。

视觉基调由三部分构成：

- 深色左侧导航，承载产品身份、项目切换和模块层级。
- 浅灰工作区，降低长时间使用的视觉疲劳。
- 白色内容面板，承载表单、列表、卡片、抽屉和弹窗。

企业蓝 `#365EFF` 是主操作色，只用于关键操作、选中状态、焦点态和重要链接。不要把蓝色扩展成大面积装饰背景。

## Colors

### Brand

- `{colors.brand}`：主操作、选中状态、焦点边框、核心链接。
- `{colors.brand-hover}`：主按钮 hover、active。
- `{colors.brand-soft}` / `{colors.brand-subtle}`：选中底色、轻量提示、图标底色。

### Surface

- `{colors.canvas}`：主内容区背景。
- `{colors.surface}`：卡片、弹窗、抽屉、输入框背景。
- `{colors.surface-muted}`：页面头部、弱分区、只读输入区域。
- `{colors.sidebar}`：全局左侧导航背景。

### Text

- `{colors.text-heading}`：页面标题和强标题。
- `{colors.text-primary}`：正文和表单主要文字。
- `{colors.text-secondary}`：说明文字。
- `{colors.text-tertiary}`：占位、辅助信息、元数据。
- `{colors.text-disabled}`：禁用和弱提示。

### Semantic

- 成功：`{colors.success}` / `{colors.success-soft}`。
- 警告：`{colors.warning}` / `{colors.warning-soft}`。
- 危险：`{colors.danger}` / `{colors.danger-soft}`。

## Typography

- 字体统一使用 Inter，中文 fallback 使用系统字体、`PingFang SC`、`Microsoft YaHei`。
- 后台界面不使用 hero 级大标题。页面标题以 24px 为上限，卡片标题通常 18px。
- 字号不随视口宽度动态缩放。
- `letter-spacing` 保持 0，避免压缩中文或中英混排。
- 粗体用于层级，不用于大面积正文。

## Layout

- 左侧导航固定宽度 300px。
- 顶部栏固定高度 72px。
- 主内容最大宽度 1600px。
- 页面基础间距使用 8px 系统：8、12、16、24、32、48。
- 页面级内容优先使用单层布局；不要把整页 section 做成嵌套卡片。
- 卡片只用于具体条目、表单分组、弹窗或工具面板。

## Components

### Buttons

- 页面级按钮使用 `src/components/ui/Button.jsx`。
- `primary`：保存、新建、应用、确认等主操作。
- `secondary`：添加字段、打开选择器、导出等强辅助操作。
- `neutral`：取消、关闭、继续编辑等低风险操作。
- `danger`：删除、放弃更改等破坏性操作。
- 按钮图标统一 16px，优先放在文本左侧。

### Forms

- 输入框高度 44px，圆角 6px。
- 必填字段用 `*` 标记，错误提示靠近字段展示。
- 焦点态使用品牌蓝边框和浅蓝 ring。
- 多选组件必须支持标签移除、下拉选择、点击外部关闭。
- 保存失败时滚动到首个错误字段。

### Cards And Panels

- 标准卡片使用白底、细边框、8px 圆角。
- 卡片 hover 可以使用轻量边框变化或低强度阴影，不使用强装饰阴影。
- 页面头部说明区使用浅灰底，不承载复杂交互。
- 列表型卡片统一使用左内容、右操作结构：标题、状态标签、元信息和标签在左侧，文字操作在右上角，窄屏时操作折到正文下方。
- 列表标题默认不带图标；只有实体识别型列表项可以配置左侧 20px 图标。状态标签紧跟标题，不放入操作区。
- 列表元信息行由多个独立字段组成，字段使用「字段名：字段值」结构，横向排列并自动换行，字段间只使用统一间距，不使用竖线、圆点或手写空格分隔。
- 元信息字段可以使用 16px lucide 图标辅助扫描；长字段必须在自身字段内截断或换行，不能挤压标题、状态标签和操作区。
- 列表文字操作必须带 16px lucide 图标，普通操作为蓝色，破坏性操作为红色，不使用按钮外框。

### Toast

- Toast 固定在视口顶部居中。
- 不占页面布局空间。
- 支持 `success`、`info`、`warning`、`error`。
- 文案短时保持单行，长文案最多两行。

### Modal And Drawer

- 弹窗用于确认、选择、集中表单。
- 抽屉用于创建/编辑复杂对象，右侧进入，底部固定操作区。
- 有未保存改动时关闭必须提示确认。

## Icons

- 图标库统一使用 `lucide-react`。
- 常规按钮图标 16px。
- 卡片、列表、分区图标 20px。
- 页面级空状态或大提示图标可用 24px。
- 仅图标按钮必须有 `aria-label`。
- 图标颜色跟随文字或状态，不单独使用新的装饰色。

## Figma And AI Generation Rules

- Figma 图层命名使用英文前缀加中文说明，例如 `Button / Primary / 保存画像`。
- 原型图必须使用本文件 token，不新增未登记主色。
- 后台页面第一屏直接呈现可操作界面，不做营销站 hero。
- 按钮、输入框、卡片、Toast、Modal、Drawer 要与 React 组件命名一致。
- 生成 Figma 标注时，交互说明文字必须是可编辑文本，不要只放截图。
- 原型图中的文案、按钮位置、按钮顺序、交互状态、数据展示或页面跳转逻辑不清楚时，不要自行猜测；先列出模糊点和推荐处理方式，并向用户确认。

## Development Rules

- 新增 UI 前先读本文件和 `docs/component-guidelines.md`。
- 优先复用 `src/components/ui/`。
- 不在业务页面新增另一套按钮、Toast 或页面头部样式。
- 新增颜色、字号、圆角、阴影前，先判断是否能映射到现有 token。
- `src/` 和 `demo-data/` 是运行时关键目录，移动前必须同步更新引用并运行构建验证。
- Figma、文档、规范说明改动不要求构建验证；如果通过 React/Vite 代码实现 UI，则按代码改动处理。
- 代码实现的 UI、页面文案、交互、默认内容改动完成后，必须执行 `pnpm build`；影响可见页面时还要浏览器验证最新内容可见。
- 开发任务与现有已开发内容、组件规范、设计规范或目录边界冲突时，不要直接覆盖已有实现；先说明冲突位置、影响范围和可选方案，并等待用户确认。

## Known Legacy Areas

- 现有页面仍混用 Tailwind 语义色和少量裸 hex，这是历史原型阶段留下的实现。
- 本规范先作为后续新增和重构标准，不要求一次性全站像素重构。
- 当前 `demo-data/` 同时服务产品可读资料和前端演示数据，路径不可随意移动。
