# Scripts

这里存放支持脚本。脚本不是前端运行入口，运行前需要先确认输入、输出和是否会改写文件。

## 脚本清单

| 脚本 | 作用 | 主要输入 | 主要输出 |
| --- | --- | --- | --- |
| `collect-rejin-cnc-images.mjs` | 抓取、筛选、去重并生成 Rejin CNC 图片资料库索引。 | `demo-data/rejin-cnc/source-pages.md` | `demo-data/rejin-cnc/assets/`、`src/data/demo/rejinCncAssetLibrary.js` |
| `build-gowe-group-demo.mjs` | 抓取/整理 GOWE 官网资料，生成 GOWE 演示资料库、图片资产库和前端 demo 数据。 | `https://www.gowe-group.com/`、脚本内产品/案例/FAQ 结构化种子 | `demo-data/gowe-group/`、`src/data/demo/goweGroupProject.js`、`src/data/demo/goweGroupAssetLibrary.js`、`src/data/demo/goweGroupFileLibrary.js` |
| `build-gowe-group-documents.py` | 根据 GOWE 结构化资料生成 4 个 DOCX 文件并做文档结构校验。 | `demo-data/gowe-group/source-data.json` | `demo-data/gowe-group/file/GOWE Group Profile.docx` 等 4 个 DOCX |
| `build-gowe-group-workbooks.mjs` | 根据 GOWE 结构化资料生成 2 个 XLSX 文件，并渲染首屏 PNG 到临时目录做视觉检查。 | `demo-data/gowe-group/source-data.json`、`@oai/artifact-tool` | `demo-data/gowe-group/file/GOWE Knowledge Tables.xlsx`、`demo-data/gowe-group/file/GOWE Website Crawl Summary.xlsx` |

## 使用规则

- 运行脚本前先阅读脚本顶部的路径和输出逻辑。
- 脚本可能改写演示数据库或结构化数据入口，运行后必须检查 `git diff`。
- 运行后至少执行 `npm run build`，确认主应用仍可构建。
- 不要把一次性实验脚本直接放入本目录；需要长期复用、有明确输入输出的脚本才放这里。
