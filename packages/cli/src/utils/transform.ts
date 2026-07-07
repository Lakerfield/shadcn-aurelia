/**
 * Transformers — registry sources are written against the docs app's layout
 * (`@/registry/default/...`, `ui-` element prefix). At add-time they are
 * rewritten to the consumer's aliases and prefix from components.json.
 */
import { join, posix } from 'node:path'
import type { ComponentsConfig, RegistryItemFile } from '../schema/registry.js'
import type { ProjectInfo } from './project.js'

/** `@/registry/default/ui/button` → `@/components/ui/button` etc. */
export const transformImports = (content: string, config: ComponentsConfig): string =>
  content
    .replaceAll(`@/registry/${config.style}/ui/`, `${config.aliases.ui}/`)
    .replaceAll(`@/registry/${config.style}/lib/`, `${config.aliases.lib}/`)
    .replaceAll(`@/registry/${config.style}/examples/`, `${config.aliases.components}/examples/`)

/**
 * `ui-button` → `<prefix>-button` — element names appear as `name: 'ui-…'`
 * definitions, `<ui-…>` markup and `'ui-…'` selector strings.
 */
export const transformPrefix = (content: string, prefix: string): string => {
  if (prefix === 'ui') return content
  return content
    .replaceAll('<ui-', `<${prefix}-`)
    .replaceAll('</ui-', `</${prefix}-`)
    .replaceAll("'ui-", `'${prefix}-`)
    .replaceAll('"ui-', `"${prefix}-`)
}

export const transformContent = (content: string, config: ComponentsConfig): string =>
  transformPrefix(transformImports(content, config), config.prefix)

/** Resolve an alias like `@/components/ui` to a project-relative directory. */
const aliasToDir = (alias: string, project: ProjectInfo): string => {
  const base = project.aliasBase ?? project.srcDir
  if (alias.startsWith('@/')) return join(base, alias.slice(2))
  return alias
}

/** Where does a registry file land in the consumer project? */
export const targetPath = (
  file: RegistryItemFile,
  config: ComponentsConfig,
  project: ProjectInfo,
): string => {
  const base = project.aliasBase ?? project.srcDir
  if (file.target) return join(base, file.target)
  const p = posix.normalize(file.path)
  const registryPrefix = `registry/${config.style}/`
  const rel = p.startsWith(registryPrefix) ? p.slice(registryPrefix.length) : p
  if (rel.startsWith('ui/')) return join(aliasToDir(config.aliases.ui, project), rel.slice(3))
  if (rel.startsWith('lib/')) return join(aliasToDir(config.aliases.lib, project), rel.slice(4))
  if (rel.startsWith('examples/')) return join(aliasToDir(config.aliases.components, project), rel)
  return join(aliasToDir(config.aliases.components, project), rel)
}
