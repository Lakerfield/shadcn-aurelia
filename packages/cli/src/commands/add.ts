/**
 * `shadcn-aurelia add <component…>` — resolve transitive registry deps, write
 * transformed files, install npm dependencies.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { readConfig, CONFIG_FILE } from '../utils/config.js'
import { loadProject } from '../utils/project.js'
import { resolveTree } from '../utils/registry.js'
import { transformContent, targetPath } from '../utils/transform.js'
import { fail, success, warn, info, dim, bold } from '../utils/log.js'

export interface AddOptions {
  cwd: string
  overwrite: boolean
  install: boolean
}

export const runAdd = async (names: string[], options: AddOptions): Promise<void> => {
  const project = await loadProject(options.cwd)
  if (!project) return fail(`no package.json found in ${options.cwd}`)
  const config = await readConfig(project.root)
  if (!config) return fail(`no ${CONFIG_FILE} found — run \`shadcn-aurelia init\` first`)

  const items = await resolveTree(config.registry, config.style, names).catch((err: Error) =>
    fail(`could not resolve "${names.join(', ')}" from ${config.registry}: ${err.message}`),
  )
  info(`resolved ${items.length} item(s): ${items.map((i) => i.name).join(', ')}`)

  let written = 0
  let skipped = 0
  for (const item of items) {
    for (const file of item.files ?? []) {
      if (file.content === undefined) {
        warn(`${item.name}: ${file.path} has no content in the registry — skipped`)
        continue
      }
      const rel = targetPath(file, config, project)
      const abs = join(project.root, rel)
      if (existsSync(abs) && !options.overwrite) {
        skipped++
        continue
      }
      await mkdir(dirname(abs), { recursive: true })
      await writeFile(abs, transformContent(file.content, config))
      written++
      info(`  ${dim('+')} ${relative(project.root, abs)}`)
    }
  }
  success(`${written} file(s) written${skipped > 0 ? `, ${skipped} existing skipped (use --overwrite)` : ''}`)

  const wanted = new Set<string>()
  for (const item of items) {
    for (const dep of item.dependencies ?? []) wanted.add(dep)
  }
  const missing = [...wanted].filter((dep) => {
    const bare = dep.startsWith('@') ? dep.split('@').slice(0, 2).join('@') : dep.split('@')[0]
    return !project.dependencies[bare]
  })
  if (missing.length > 0) {
    if (options.install) {
      info(`installing ${missing.join(', ')} with ${project.packageManager}…`)
      // npm does not resolve the workspace root from a sub-package — run it
      // from the root with -w so the root lockfile is used
      const result = project.npmWorkspaceRoot
        ? spawnSync('npm', ['install', ...missing, '-w', relative(project.npmWorkspaceRoot, project.root)], {
            cwd: project.npmWorkspaceRoot,
            stdio: 'inherit',
          })
        : spawnSync(project.packageManager, ['add', ...missing], {
            cwd: project.root,
            stdio: 'inherit',
          })
      if (result.status !== 0) {
        warn(`dependency install failed — install manually: ${bold(missing.join(' '))}`)
      }
    } else {
      warn(`missing npm dependencies (skipped, --no-install): ${bold(missing.join(' '))}`)
    }
  }
}
