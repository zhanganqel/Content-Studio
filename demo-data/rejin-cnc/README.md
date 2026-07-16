# Rejin CNC Demo Project

This folder is the demo database for Content Studio. It stores product-manager-readable source material for the default Rejin CNC project.

All business data in this folder is written in English because the demo project targets export marketing. System UI labels, buttons, navigation, and prompts are handled separately by `src/i18n/messages.js`.

## Project Summary

- Company: Rejin CNC Technology Co.,Ltd
- Website: https://www.rejincnc.com/
- Industry: Precision CNC machining and custom metal parts manufacturing
- Demo purpose: Brand knowledge, audience personas, reusable knowledge items, file library, media library, AI content planning, and future backend/API test cases
- Content language: English

## Folder Guide

| Path | Purpose |
| --- | --- |
| `brand-profile.md` | Company profile, positioning, style, facts, and contacts. |
| `audience-personas.md` | Target audiences for marketing content. |
| `source-pages.md` | Public website pages used as source material. |
| `products/` | Product and application examples. |
| `services/` | Service capability knowledge items. |
| `solutions/` | Reusable solution knowledge items. |
| `cases/` | Case study examples. |
| `faqs/` | FAQ knowledge items. |
| `file/` | Readable Word and Excel source files plus the file library index. |
| `assets/` | Selected image assets plus the image library index. |

## Runtime Relationship

- Human-readable material is maintained here.
- App-facing structured data is maintained in `src/data/demo/`.
- `src/data/demo/rejinCncProject.js` aggregates the default project.
- `src/data/demo/rejinCncAssetLibrary.js` imports images from `demo-data/rejin-cnc/assets/images/`.
- `src/data/demo/rejinCncFileLibrary.js` imports Word, Excel, and PDF files from `demo-data/rejin-cnc/file/`.

Because the app imports files from this folder, do not move or rename files here without updating `src/data/demo/*` and running `npm run build`.

## Maintenance Rule

- Keep this folder readable for non-technical teammates.
- Do not store JavaScript, UI implementation details, or app-only configuration here.
- Keep source notes, tags, usage guidance, and public URLs auditable.
- Confirm usage rights before publishing demo assets externally.
