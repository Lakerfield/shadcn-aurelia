/**
 * build-registry v0 — emits static registry JSON artifacts.
 *
 * Reads registry/registry.json (source of truth), validates it against the
 * shadcn-compatible zod schema, inlines each item's file contents, and writes:
 *
 *   public/r/index.json                 registry index (items without content)
 *   public/r/styles/default/{name}.json one artifact per item, with content
 *
 * Run via `pnpm build:registry` (part of `pnpm build`); CI fails on any
 * schema violation or missing file.
 */
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { registrySchema, registryItemSchema, type RegistryItem } from './registry-schema'

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const registryPath = join(appRoot, 'registry', 'registry.json')
const outDir = join(appRoot, 'public', 'r')
const STYLE = 'default'

async function main(): Promise<void> {
  const raw = JSON.parse(await readFile(registryPath, 'utf8'))
  const registry = registrySchema.parse(raw)

  await rm(outDir, { recursive: true, force: true })
  await mkdir(join(outDir, 'styles', STYLE), { recursive: true })

  const indexItems: RegistryItem[] = []

  for (const item of registry.items) {
    const files = await Promise.all(
      (item.files ?? []).map(async (file) => ({
        ...file,
        content: await readFile(join(appRoot, file.path), 'utf8'),
      })),
    )

    const artifact = registryItemSchema.parse({
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      ...item,
      files,
    })

    await writeFile(
      join(outDir, 'styles', STYLE, `${item.name}.json`),
      JSON.stringify(artifact, null, 2) + '\n',
    )

    // index entries carry metadata only, not file contents
    indexItems.push({ ...item, files: item.files })
  }

  await writeFile(
    join(outDir, 'index.json'),
    JSON.stringify(
      { name: registry.name, homepage: registry.homepage, items: indexItems },
      null,
      2,
    ) + '\n',
  )

  // drop-in stylesheet for `shadcn-aurelia init`: theme variables + shared
  // Tailwind layer (assumes the consumer css already has `@import "tailwindcss"`)
  const themeVars = await readFile(join(appRoot, 'registry', 'styles', STYLE, 'theme.css'), 'utf8')
  const twPreset = await readFile(
    join(appRoot, '..', '..', 'packages', 'tw-preset', 'theme.css'),
    'utf8',
  )
  await writeFile(join(outDir, 'styles', STYLE, 'theme.css'), `${themeVars}\n${twPreset}`)

  console.log(`✔ registry: ${registry.items.length} items → public/r/styles/${STYLE}/`)
}

main().catch((err) => {
  console.error('✘ registry build failed:', err)
  process.exit(1)
})
