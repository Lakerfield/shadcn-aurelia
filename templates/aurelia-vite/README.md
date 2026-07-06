# aurelia-vite template

Aurelia 2 (RC1) + Vite 7 + TypeScript + Tailwind v4 starter, ready for shadcn-aurelia.

```sh
pnpm install
npx shadcn-aurelia init          # writes components.json + theme css
npx shadcn-aurelia add button    # copy components into src/components/ui
pnpm dev
```

Notes

- `@shadcn-aurelia/primitives` is pre-installed (components depend on it).
- The `@/*` alias maps to `src/*` in both tsconfig.json and vite.config.ts.
- Vite is pinned to v7 — Vite 8's Oxc transform leaves TC39 decorators raw.
