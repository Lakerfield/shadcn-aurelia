/**
 * Project detection & preflights — is this an Aurelia 2 + Vite + Tailwind v4
 * app we can init/add into?
 */
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface ProjectInfo {
  root: string
  packageJson: Record<string, unknown>
  dependencies: Record<string, string>
  packageManager: 'pnpm' | 'yarn' | 'bun' | 'npm'
  /** npm-workspace root, when it is an ancestor of `root` — npm needs `-w` from there */
  npmWorkspaceRoot: string | null
  srcDir: string
  aliasBase: string | null
  /** tsconfig path mappings, `/*` stripped: `@` → `src`, `@acme/ui` → `../../packages/ui/src` */
  aliasPaths: Record<string, string>
}

export const loadProject = async (root: string): Promise<ProjectInfo | null> => {
  const pkgPath = join(root, 'package.json')
  if (!existsSync(pkgPath)) return null
  const packageJson = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>
  const dependencies = {
    ...((packageJson.dependencies as Record<string, string>) ?? {}),
    ...((packageJson.devDependencies as Record<string, string>) ?? {}),
  }
  const { packageManager, lockfileDir } = detectPackageManager(root)
  const aliasPaths = await detectAliasPaths(root)
  return {
    root,
    packageJson,
    dependencies,
    packageManager,
    npmWorkspaceRoot:
      packageManager === 'npm' && lockfileDir && lockfileDir !== root && (await isNpmWorkspaceRoot(lockfileDir))
        ? lockfileDir
        : null,
    srcDir: existsSync(join(root, 'src')) ? 'src' : '.',
    aliasBase: aliasPaths['@'] ?? null,
    aliasPaths,
  }
}

const detectPackageManager = (
  root: string,
): { packageManager: ProjectInfo['packageManager']; lockfileDir: string | null } => {
  // lockfiles live at the workspace root, which may be an ancestor
  let dir = root
  for (;;) {
    if (existsSync(join(dir, 'pnpm-lock.yaml')) || existsSync(join(dir, 'pnpm-workspace.yaml')))
      return { packageManager: 'pnpm', lockfileDir: dir }
    if (existsSync(join(dir, 'yarn.lock'))) return { packageManager: 'yarn', lockfileDir: dir }
    if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock')))
      return { packageManager: 'bun', lockfileDir: dir }
    if (existsSync(join(dir, 'package-lock.json'))) return { packageManager: 'npm', lockfileDir: dir }
    const parent = dirname(dir)
    if (parent === dir) return { packageManager: 'npm', lockfileDir: null }
    dir = parent
  }
}

const isNpmWorkspaceRoot = async (dir: string): Promise<boolean> => {
  try {
    const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as Record<string, unknown>
    return pkg.workspaces !== undefined
  } catch {
    return false
  }
}

/** All wildcard path aliases from tsconfig (best effort): `@/*`, `@acme/ui/*`, … */
const detectAliasPaths = async (root: string): Promise<Record<string, string>> => {
  const tsconfigPath = join(root, 'tsconfig.json')
  if (!existsSync(tsconfigPath)) return {}
  try {
    const raw = await readFile(tsconfigPath, 'utf8')
    // tolerate comments/trailing commas well enough for a paths lookup
    const cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const tsconfig = JSON.parse(cleaned) as {
      compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> }
    }
    const baseUrl = tsconfig.compilerOptions?.baseUrl ?? '.'
    const aliases: Record<string, string> = {}
    for (const [key, mappings] of Object.entries(tsconfig.compilerOptions?.paths ?? {})) {
      if (!key.endsWith('/*') || !mappings[0]) continue
      aliases[key.slice(0, -2)] = join(baseUrl, mappings[0].replace(/\/\*$/, ''))
    }
    return aliases
  } catch {
    return {}
  }
}

export interface Preflight {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export const preflight = async (project: ProjectInfo): Promise<Preflight> => {
  const errors: string[] = []
  const warnings: string[] = []
  const deps = project.dependencies

  if (!deps['aurelia']) errors.push('no `aurelia` dependency found — is this an Aurelia 2 app?')
  else if (!/^[\^~]?2\./.test(deps['aurelia']) && deps['aurelia'] !== 'latest')
    warnings.push(`aurelia version "${deps['aurelia']}" — shadcn-aurelia targets Aurelia 2 (RC1+)`)

  if (!deps['vite'] && !deps['webpack'])
    warnings.push('neither vite nor webpack found — only Vite is tested')

  if (!deps['tailwindcss']) errors.push('no `tailwindcss` dependency found — Tailwind v4 is required')
  else if (!/^[\^~]?4\./.test(deps['tailwindcss']) && deps['tailwindcss'] !== 'latest')
    warnings.push(`tailwindcss version "${deps['tailwindcss']}" — v4 is required`)

  if (!deps['typescript']) warnings.push('no `typescript` dependency found')
  if (!project.aliasBase)
    warnings.push('no `@/*` path alias in tsconfig.json — imports in added components use it')

  return { ok: errors.length === 0, errors, warnings }
}

/** Find the stylesheet that contains `@import "tailwindcss"`. */
export const findTailwindCss = async (project: ProjectInfo): Promise<string | null> => {
  const candidates: string[] = []
  for (const dir of [join(project.srcDir, 'styles'), project.srcDir, '.']) {
    const abs = join(project.root, dir)
    if (!existsSync(abs)) continue
    for (const entry of await readdir(abs)) {
      if (entry.endsWith('.css')) candidates.push(join(dir, entry))
    }
  }
  for (const rel of candidates) {
    const content = await readFile(join(project.root, rel), 'utf8')
    if (/@import\s+["']tailwindcss["']/.test(content)) return rel
  }
  return null
}
