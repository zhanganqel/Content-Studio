# Scripts

这里存放支持脚本。脚本不是前端运行入口，运行前需要先确认输入、输出和是否会改写文件。

## 脚本清单

| 脚本 | 作用 | 主要输入 | 主要输出 |
| --- | --- | --- | --- |
| `collect-rejin-cnc-images.mjs` | 抓取、筛选、去重并生成 Rejin CNC 图片资料库索引。 | `demo-data/rejin-cnc/source-pages.md` | `demo-data/rejin-cnc/assets/`、`src/data/demo/rejinCncAssetLibrary.js` |

## 使用规则

- 运行脚本前先阅读脚本顶部的路径和输出逻辑。
- 脚本可能改写演示数据库或结构化数据入口，运行后必须检查 `git diff`。
- 运行后至少执行 `pnpm build`，确认主应用仍可构建。
- 不要把一次性实验脚本直接放入本目录；需要长期复用、有明确输入输出的脚本才放这里。
