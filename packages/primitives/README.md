# @shadcn-aurelia/primitives

The headless primitive layer for [shadcn-aurelia](https://shadcn-aurelia.com) — beautifully
designed components for [Aurelia 2](https://aurelia.io), an unofficial, community-led port of
[shadcn/ui](https://ui.shadcn.com).

**Documentation & components: [shadcn-aurelia.com](https://shadcn-aurelia.com)**

## What is this?

shadcn-aurelia components are not installed from npm — the
[`shadcn-aurelia` CLI](https://www.npmjs.com/package/shadcn-aurelia) copies their source into your
project. This package is the one piece that *is* installed: the interactive behavior engines and
shared utilities those copied components build on. The CLI adds it to your project automatically
when a component needs it.

It provides:

- **Behavior facades** — one factory per interactive behavior (dialog, select, combobox, menu,
  tooltip, tabs, slider, date picker, …) with stable signatures, so your copied components keep
  working while the engines behind them evolve.
- **Aurelia adapter utilities** — spread-props binding, controlled-state helpers, and engines for
  charts, data tables, carousels, and message scrolling.
- **Internal building blocks** — DI context, portal, focus trap, dismissable layer, presence, and
  direction (RTL) support.

You normally don't import from this package yourself; the copied component code does. Start with
the [installation guide](https://shadcn-aurelia.com/docs/installation):

```sh
npx shadcn-aurelia@latest create my-app
# or, in an existing Aurelia 2 + Vite + Tailwind v4 app:
npx shadcn-aurelia init
npx shadcn-aurelia add button dialog form
```

## License

[MIT](https://github.com/lakerfield/shadcn-aurelia/blob/main/LICENSE.md)
