# shadcn-aurelia

Beautifully designed components for [Aurelia 2](https://aurelia.io) — an unofficial, community-led
port of [shadcn/ui](https://ui.shadcn.com). This CLI copies the component source into your project:
you own the code and change whatever you want.

**Documentation & components: [shadcn-aurelia.com](https://shadcn-aurelia.com)**

## Usage

```sh
# start a new app (Aurelia 2 + Vite 7 + Tailwind v4)
npx shadcn-aurelia@latest create my-app
cd my-app && npm install

# or set up an existing app, then add components
npx shadcn-aurelia init
npx shadcn-aurelia add button dialog form
```

```html
<import from="@/components/ui/button"></import>

<ui-button variant="outline" click.trigger="save()">Save</ui-button>
```

## Commands

| Command | Description |
| --- | --- |
| `create <name>` | Scaffold a new Aurelia 2 + Vite + Tailwind v4 app from the bundled template |
| `init` | Configure the project: preflights, `components.json`, theme CSS |
| `add <components...>` | Add components (and their dependencies) to the project |
| `diff [components...]` | Compare local component copies against the registry |
| `build` | Build a third-party registry: validate `registry.json` and emit JSON artifacts |

See the [CLI reference](https://shadcn-aurelia.com/docs/cli) and
[installation guide](https://shadcn-aurelia.com/docs/installation) for details.

## License

[MIT](https://github.com/lakerfield/shadcn-aurelia/blob/main/LICENSE.md)
