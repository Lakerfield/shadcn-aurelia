/**
 * `shadcn-aurelia build` — build a registry (third-party registries):
 * validates registry.json, inlines file contents, emits index.json plus one
 * artifact per item. Same output shape as the docs app's build-registry.
 */
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { registrySchema, registryItemSchema, type RegistryItem } from '../schema/registry.js'
import { fail, success } from '../utils/log.js'

export interface BuildOptions {
  cwd: string
  registryFile: string
  output: string
  style: string
}

export const runBuild = async (options: BuildOptions): Promise<void> => {
  const registryPath = resolve(options.cwd, options.registryFile)
  const outDir = resolve(options.cwd, options.output)
  // file paths in the manifest are relative to the project root (upstream shadcn convention)
  const sourceRoot = options.cwd

  const raw = JSON.parse(
    await readFile(registryPath, 'utf8').catch(() => fail(`cannot read ${registryPath}`)),
  )
  const parsed = registrySchema.safeParse(raw)
  if (!parsed.success) {
    fail(
      `registry.json is invalid:\n${parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`,
    )
  }
  const registry = parsed.data!

  await rm(outDir, { recursive: true, force: true })
  await mkdir(join(outDir, 'styles', options.style), { recursive: true })

  const indexItems: RegistryItem[] = []
  for (const item of registry.items) {
    const files = await Promise.all(
      (item.files ?? []).map(async (file) => ({
        ...file,
        content: await readFile(join(sourceRoot, file.path), 'utf8').catch(() =>
          fail(`${item.name}: missing file ${file.path}`),
        ),
      })),
    )
    const artifact = registryItemSchema.parse({
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      ...item,
      files,
    })
    await writeFile(
      join(outDir, 'styles', options.style, `${item.name}.json`),
      JSON.stringify(artifact, null, 2) + '\n',
    )
    indexItems.push({ ...item })
  }

  await writeFile(
    join(outDir, 'index.json'),
    JSON.stringify(
      { name: registry.name, homepage: registry.homepage, items: indexItems },
      null,
      2,
    ) + '\n',
  )
  success(
    `registry: ${registry.items.length} item(s) → ${join(options.output, 'styles', options.style)}/`,
  )
}
