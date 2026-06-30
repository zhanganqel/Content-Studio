# Component Guidelines

The active component guideline source is now managed in the isolated guidelines project:

- Preview project: `guidelines/`
- Markdown source: `guidelines/docs/component-guidelines.md`
- Local preview command: `pnpm guidelines:dev`
- Build check command: `pnpm guidelines:build`

Before building a new Content Studio screen, open the guidelines project and follow its components first. If a new visual variant is needed, update the guidelines project and Markdown document before implementing the feature.

## Toast

- Toast must use the shared `src/components/ui/Toast.jsx` component.
- Toast must render through a global portal into `document.body`; it must never participate in page layout or add spacing inside page content containers.
- Toast position is fixed near the top of the viewport and horizontally centered against the full browser window, including the left navigation area.
- Toast height should stay compact at about 40px. Reduce padding and icon size when tightening the component; keep the current text size standard.
- Toast must not use borders. Use semantic background colors, semantic icon colors, and a light shadow only.
- Supported semantic types are `success`, `info`, `warning`, and `error`.
