# Rejin CNC Demo Project

This folder stores product-manager-readable demo data for Content Studio.

All business data in this folder is written in English because the demo project is for export marketing. System UI labels, buttons, navigation, and prompts are handled separately by the app i18n files.

## Project Summary

Rejin CNC Technology Co.,Ltd is used as the default demo project for an export-oriented precision manufacturing supplier.

- Website: https://www.rejincnc.com/
- Industry: Precision CNC machining and custom metal parts manufacturing
- Demo purpose: Brand knowledge, content generation, site builder examples, search examples, and future test cases
- Content language: English

## Folder Guide

- `brand-profile.md`: Company profile, positioning, style, and contacts
- `audience-personas.md`: Target audiences for marketing content
- `source-pages.md`: Public website pages used as sources
- `file/`: Readable Word and Excel source files crawled and organized from the official website
- `assets/`: Selected image assets and the asset library index
- `services/`: Service knowledge items
- `solutions/`: Reusable solution knowledge items
- `products/`: Product and application examples
- `cases/`: Case study examples
- `faqs/`: FAQ knowledge items

## Maintenance Rule

Keep this folder readable for non-technical teammates. Do not store JavaScript, JSON, or implementation-only configuration here. Developers should use `src/data/demo/rejinCncProject.js` as the app-facing data entry.
