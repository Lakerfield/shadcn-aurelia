# shadcn-aurelia

Beautifully designed components for [Aurelia 2](https://aurelia.io). Accessible. Customizable. Open Source.

An unofficial, community-led port of [shadcn/ui](https://ui.shadcn.com) — the same styles, the same
copy-paste philosophy, rebuilt on Aurelia 2 conventions.

**Documentation & components: [shadcn-aurelia.com](https://shadcn-aurelia.com)**

## Quickstart

```sh
# in an Aurelia 2 + Vite 7 + Tailwind v4 app
npx shadcn-aurelia init
npx shadcn-aurelia add button dialog form
```

```html
<import from="@/components/ui/button"></import>

<ui-button variant="outline" click.trigger="save()">Save</ui-button>
```

This is **not a component library you install from npm**. The CLI copies the component source into
your project — you own the code and change whatever you want. Interactive behavior is powered by
[Zag.js](https://zagjs.com) state machines behind a small facade package
(`@shadcn-aurelia/primitives`), so your copied components stay stable while engines evolve —
`tooltip` already runs on a native engine, contract-verified against the Zag original.

- [Installation](https://shadcn-aurelia.com/docs/installation)
- [Theming](https://shadcn-aurelia.com/docs/theming) & [dark mode](https://shadcn-aurelia.com/docs/dark-mode)
- [CLI reference](https://shadcn-aurelia.com/docs/cli) & [components.json](https://shadcn-aurelia.com/docs/components-json)
- [Differences from shadcn/ui](https://shadcn-aurelia.com/docs/differences)
- [Accessibility & keyboard maps](https://shadcn-aurelia.com/docs/accessibility)
- [Blocks](https://shadcn-aurelia.com/docs/blocks)

## What's inside

- **60+ components** ported from the shadcn/ui v4 inventory — from `button` to `combobox`,
  `data-table`, `date-picker`, `sidebar`, `sonner`, `chart` and the chat suite
  (`message-scroller`, `bubble`, `attachment`, …).
- **Blocks** — ready-made sections (login, dashboard shell, settings) built from the components.
- **CLI** — `init`, `add` (transitive dependencies, import-alias and element-prefix rewriting),
  `diff`, and `build` for self-hosted registries.
- **A11y as a gate** — axe is merge-blocking; keyboard behavior follows the WAI-ARIA APG.

## Repository layout

| Path | Contents |
|---|---|
| `apps/www` | docs site + component registry (source of truth) |
| `packages/primitives` | `@shadcn-aurelia/primitives` — behavior facades (Zag adapters, portal, table/chart engines) |
| `packages/tw-preset` | `@shadcn-aurelia/tw-preset` — shared Tailwind theme layer |
| `packages/cli` | the `shadcn-aurelia` CLI |
| `templates/aurelia-vite` | pre-configured starter app |

## Development

```sh
pnpm install
pnpm dev          # docs site on localhost:3000
pnpm build        # all packages + registry
pnpm typecheck
```

Releases are managed with Changesets — see [publish.md](./publish.md).

## Credits

- [shadcn](https://twitter.com/shadcn) for [shadcn/ui](https://ui.shadcn.com) — the design, anatomy
  and styles this project ports.
- [Zag.js](https://zagjs.com) for the framework-agnostic state machines.
- [shadcn-svelte](https://shadcn-svelte.com) and [shadcn-vue](https://shadcn-vue.com) for pioneering
  the community-port conventions this project follows.
- The [Aurelia](https://aurelia.io) team and community.

## License

[MIT](./LICENSE.md)
