/**
 * `shadcn-aurelia create` — scaffold a new Aurelia 2 + Vite + Tailwind v4 app
 * from the template bundled with this package, ready for `init`.
 */
import { existsSync } from 'node:fs'
import { cp, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fail, success, info, dim, bold } from '../utils/log.js'

export interface CreateOptions {
  cwd: string
}

// dist/commands/create.js → package root, where the build embeds the template
const TEMPLATE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'template')

/** How was this CLI invoked? (`pnpm dlx`, `yarn dlx`, `bunx`, `npx`, …) */
const detectPackageManager = (): string => {
  const agent = process.env.npm_config_user_agent ?? ''
  for (const pm of ['pnpm', 'yarn', 'bun']) if (agent.startsWith(pm)) return pm
  return 'npm'
}

export const runCreate = async (name: string, options: CreateOptions): Promise<void> => {
  if (!existsSync(TEMPLATE_DIR)) {
    return fail('bundled template not found — this build of the CLI is broken')
  }

  const target = resolve(options.cwd, name)
  const pkgName = basename(target)
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(pkgName)) {
    return fail(`"${pkgName}" is not a valid package name (lowercase letters, digits, . _ -)`)
  }
  if (existsSync(target) && (await readdir(target)).length > 0) {
    return fail(`${target} already exists and is not empty`)
  }

  await cp(TEMPLATE_DIR, target, { recursive: true })
  await rename(join(target, 'gitignore'), join(target, '.gitignore'))

  const pkgPath = join(target, 'package.json')
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>
  pkg.name = pkgName
  pkg.version = '0.0.1'
  delete pkg.description
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  success(`created ${bold(pkgName)}`)
  const pm = detectPackageManager()
  const run = { npm: 'npx', pnpm: 'pnpm dlx', yarn: 'yarn dlx', bun: 'bunx' }[pm] ?? 'npx'
  info('')
  info('next steps:')
  info(dim(`  cd ${relative(options.cwd, target) || '.'}`))
  info(dim(`  ${pm} install`))
  info(dim(`  ${run} shadcn-aurelia init`))
  info(dim(`  ${run} shadcn-aurelia add button`))
}
