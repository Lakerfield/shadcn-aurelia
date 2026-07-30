/**
 * Copy templates/aurelia-vite into the CLI package so `shadcn-aurelia create`
 * can scaffold it offline. The workspace: protocol only resolves inside this
 * repo, so the primitives dependency is pinned to the current version here.
 */
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const cliRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = join(cliRoot, '..', '..')
const source = join(repoRoot, 'templates', 'aurelia-vite')
const target = join(cliRoot, 'template')

const EXCLUDE = new Set(['node_modules', 'dist', 'CHANGELOG.md', '.turbo'])

await rm(target, { recursive: true, force: true })
await cp(source, target, {
  recursive: true,
  filter: (src) => !EXCLUDE.has(basename(src)),
})

const primitives = JSON.parse(
  await readFile(join(repoRoot, 'packages', 'primitives', 'package.json'), 'utf8'),
)
const pkgPath = join(target, 'package.json')
const pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
pkg.dependencies['@shadcn-aurelia/primitives'] = `^${primitives.version}`
await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

// npm pack drops .gitignore files; ship it dotless, `create` renames it back
await writeFile(join(target, 'gitignore'), 'node_modules\ndist\n*.log\n.DS_Store\n')

console.log(`embedded template with @shadcn-aurelia/primitives ^${primitives.version}`)
