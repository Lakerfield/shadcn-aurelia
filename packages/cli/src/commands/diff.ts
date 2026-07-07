/**
 * `shadcn-aurelia diff [component…]` — compare local copies against the
 * registry (after transforms) and print what changed.
 */
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { readConfig, CONFIG_FILE } from '../utils/config.js'
import { loadProject } from '../utils/project.js'
import { fetchIndex, fetchItem } from '../utils/registry.js'
import { transformContent, targetPath } from '../utils/transform.js'
import { unifiedDiff } from '../utils/diff.js'
import { fail, info, success, dim, bold, yellow } from '../utils/log.js'

export interface DiffOptions {
  cwd: string
}

export const runDiff = async (names: string[], options: DiffOptions): Promise<void> => {
  const project = await loadProject(options.cwd)
  if (!project) return fail(`no package.json found in ${options.cwd}`)
  const config = await readConfig(project.root)
  if (!config) return fail(`no ${CONFIG_FILE} found — run \`shadcn-aurelia init\` first`)

  // no explicit names → every registry item that exists locally
  let targets = names
  if (targets.length === 0) {
    const index = await fetchIndex(config.registry)
    targets = index.items
      .filter((i) => i.type === 'registry:ui' || i.type === 'registry:lib')
      .map((i) => i.name)
  }

  let changed = 0
  let checked = 0
  for (const name of targets) {
    const item = await fetchItem(config.registry, config.style, name).catch(() =>
      names.length > 0 ? fail(`"${name}" not found in the registry`) : null,
    )
    if (!item) continue
    const localFiles = (item.files ?? [])
      .map((file) => ({ file, abs: join(project.root, targetPath(file, config, project)) }))
      .filter(({ abs }) => existsSync(abs))
    if (localFiles.length === 0) continue

    checked++
    for (const { file, abs } of localFiles) {
      const registryContent = transformContent(file.content ?? '', config)
      const localContent = await readFile(abs, 'utf8')
      const diff = unifiedDiff(registryContent, localContent)
      if (diff !== '') {
        changed++
        info(`\n${bold(name)} ${dim(relative(project.root, abs))} ${yellow('modified')}`)
        info(diff)
      }
    }
  }

  info('')
  if (changed === 0) success(`${checked} component(s) checked — all in sync with the registry`)
  else info(`${changed} file(s) differ from the registry (${checked} component(s) checked)`)
}
