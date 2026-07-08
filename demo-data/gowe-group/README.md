# GOWE Group Demo Project

This folder is the demo database for the GOWE Group project in Content Studio.

All business data in this folder is written in English because the demo project targets export marketing. System UI labels, buttons, navigation, and prompts are handled separately by `src/i18n/messages.js`.

## Project Summary

- Company: GOWE Group
- Website: https://www.gowe-group.com/
- Industry: Construction formwork, scaffolding, steel structure, bridge and tunnel equipment
- Demo purpose: Brand knowledge, audience personas, reusable knowledge items, file library, media library, AI content planning, and backend/API test data.
- Content language: English

## Folder Guide

| Path | Purpose |
| --- | --- |
| `brand-profile.md` | Company profile, positioning, style, facts, and contacts. |
| `audience-personas.md` | Target audiences for marketing content. |
| `source-pages.md` | Public website pages used as source material. |
| `products/` | Product portfolio knowledge items. |
| `services/` | Service capability knowledge items. |
| `solutions/` | Lifecycle solution knowledge items. |
| `cases/` | Case study and project proof examples. |
| `faqs/` | FAQ knowledge items. |
| `file/` | Readable Word and Excel source files plus the file library index. |
| `assets/` | Selected image assets plus the image library index. |
| `source-data.json` | Generated structured crawl payload used to reproduce project files. |

## Runtime Relationship

- Human-readable material is maintained here.
- App-facing structured data is maintained in `src/data/demo/`.
- `src/data/demo/goweGroupProject.js` aggregates this demo project.
- `src/data/demo/goweGroupAssetLibrary.js` imports images from `demo-data/gowe-group/assets/images/`.
- `src/data/demo/goweGroupFileLibrary.js` imports Word and Excel files from `demo-data/gowe-group/file/`.

Because the app imports files from this folder, do not move or rename files here without updating `src/data/demo/*` and running `pnpm build`.

## Maintenance Rule

- Keep this folder readable for non-technical teammates.
- Keep source notes, tags, usage guidance, and public URLs auditable.
- Confirm usage rights before publishing demo assets externally.
