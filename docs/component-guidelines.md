# Component Guidelines

The active component guideline source is now managed in the isolated guidelines project:

- Preview project: `guidelines/`
- Markdown source: `guidelines/docs/component-guidelines.md`
- Local preview command: `pnpm guidelines:dev`
- Build check command: `pnpm guidelines:build`

Before building a new Content Studio screen, open the guidelines project and follow its components first. If a new visual variant is needed, update the guidelines project and Markdown document before implementing the feature.

## Button

- Page-level primary and secondary actions must use the shared `src/components/ui/Button.jsx` component.
- Default button size is `h-9 px-4`, with `text-sm font-semibold`, `rounded-md`, and a 16px icon.
- `primary` is a blue filled button for save, edit, create, apply, and other main actions.
- `secondary` is a white button with blue border/text for export, add field, and other important auxiliary actions.
- `neutral` is a white button with light gray border/text for cancel, continue editing, and low-risk actions.
- `danger` is reserved for destructive confirmations such as discard changes or delete confirmation.
- Do not hand-write page-level primary/secondary button Tailwind classes inside feature pages. Reuse the shared component and keep table icon buttons, navigation items, and segmented tabs as separate compact controls.

## Page Header

- Top intro cards with title, description, and right-side actions must use the shared `src/components/ui/PageHeader.jsx` component.
- Page header cards use `rounded-lg bg-slate-50 px-7 py-6`.
- Right-side actions use `flex flex-none flex-wrap items-start gap-3` and align near the top of the card on desktop.
- On narrow screens, actions stack below the title and description instead of compressing the copy.
- Do not hand-write page header action alignment inside feature pages. Matching positions across pages must come from the shared component.

## Toast

- Toast must use the shared `src/components/ui/Toast.jsx` component.
- Toast must render through a global portal into `document.body`; it must never participate in page layout or add spacing inside page content containers.
- Toast position is fixed near the top of the viewport and horizontally centered against the full browser window, including the left navigation area.
- Toast height should stay compact at about 40px. Reduce padding and icon size when tightening the component; keep the current text size standard.
- Toast must not use borders. Use semantic background colors, semantic icon colors, and a light shadow only.
- Toast width should fit its content instead of using a fixed page percentage. Short messages should stay on one line; long messages may wrap only when constrained and must be clamped to at most two lines.
- Toast action buttons must use a compact icon-plus-text style: small leading icon, single-line label, blue text, no border, no button frame, and no background fill.
- Supported semantic types are `success`, `info`, `warning`, and `error`.
