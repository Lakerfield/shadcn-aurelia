/**
 * `shadcn-aurelia init` — preflight the project, write components.json and
 * inject the theme stylesheet.
 */
import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import type { ComponentsConfig } from '../schema/registry.js'
import { readConfig, writeConfig, CONFIG_FILE } from '../utils/config.js'
import { loadProject, preflight, findTailwindCss } from '../utils/project.js'
import { fetchThemeCss } from '../utils/registry.js'
import { fail, success, warn, info, dim } from '../utils/log.js'

export interface InitOptions {
  cwd: string
  registry: string
  style: string
  prefix: string
  baseColor: string
  css?: string
  force: boolean
}

const THEME_FILE = 'shadcn-aurelia.css'

export const runInit = async (options: InitOptions): Promise<void> => {
  const project = await loadProject(options.cwd)
  if (!project) return fail(`no package.json found in ${options.cwd}`)

  const flight = await preflight(project)
  flight.warnings.forEach((w) => warn(w))
  if (!flight.ok) {
    flight.errors.forEach((e) => warn(e))
    return fail('preflight failed — this does not look like an Aurelia 2 + Tailwind v4 project')
  }

  if (!options.force && (await readConfig(project.root)) !== null) {
    return fail(`${CONFIG_FILE} already exists — re-run with --force to overwrite`)
  }

  const css = options.css ?? (await findTailwindCss(project))
  if (!css) {
    return fail('no stylesheet with `@import "tailwindcss"` found — pass one with --css <path>')
  }

  const config: ComponentsConfig = {
    $schema: 'https://shadcn-aurelia.com/schema.json',
    style: options.style,
    prefix: options.prefix,
    tailwind: { css, baseColor: options.baseColor },
    aliases: { components: '@/components', ui: '@/components/ui', lib: '@/lib' },
    registry: options.registry,
  }
  await writeConfig(project.root, config)
  success(`wrote ${CONFIG_FILE}`)

  // theme stylesheet: written next to the tailwind css, imported after it
  const themeCss = await fetchThemeCss(config.registry, config.style).catch((err: Error) =>
    fail(`could not fetch theme css from ${config.registry}: ${err.message}`),
  )
  const cssAbs = join(project.root, css)
  const themeAbs = join(dirname(cssAbs), THEME_FILE)
  await writeFile(themeAbs, themeCss)
  success(`wrote ${relative(project.root, themeAbs)}`)

  const cssContent = await readFile(cssAbs, 'utf8')
  const importLine = `@import './${THEME_FILE}';`
  if (!cssContent.includes(importLine)) {
    const updated = cssContent.replace(
      /(@import\s+["']tailwindcss["'];?)/,
      `$1\n\n/* shadcn-aurelia theme (variables, dark mode, data-state animations) */\n${importLine}`,
    )
    if (updated === cssContent) {
      warn(`could not find the tailwindcss import in ${css} — add this line yourself:`)
      info(`  ${importLine}`)
    } else {
      await writeFile(cssAbs, updated)
      success(`imported ${THEME_FILE} in ${css}`)
    }
  }

  if (!existsSync(join(project.root, 'node_modules', '@shadcn-aurelia', 'primitives'))) {
    warn(
      `@shadcn-aurelia/primitives is not installed — components need it:\n  ${dim(
        `${project.packageManager} add @shadcn-aurelia/primitives`,
      )}`,
    )
  }

  info('')
  success('init done — add components with `shadcn-aurelia add <name>`')
}
