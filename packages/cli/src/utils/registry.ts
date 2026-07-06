/**
 * Registry access — fetch items from an http(s) registry or a local directory
 * (the output of `shadcn-aurelia build` / apps/www's build-registry), and
 * resolve registryDependencies transitively.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { registryItemSchema, type RegistryItem } from '../schema/registry.js'

const isUrl = (registry: string): boolean => /^https?:\/\//.test(registry)

const fetchText = async (registry: string, rel: string): Promise<string> => {
  if (isUrl(registry)) {
    const url = `${registry.replace(/\/$/, '')}/${rel}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
    return res.text()
  }
  return readFile(join(registry, rel), 'utf8')
}

export const fetchItem = async (
  registry: string,
  style: string,
  name: string,
): Promise<RegistryItem> => {
  const raw = await fetchText(registry, `styles/${style}/${name}.json`)
  return registryItemSchema.parse(JSON.parse(raw))
}

export const fetchThemeCss = (registry: string, style: string): Promise<string> =>
  fetchText(registry, `styles/${style}/theme.css`)

export interface RegistryIndex {
  name?: string
  items: Array<{ name: string; type: string; description?: string }>
}

export const fetchIndex = async (registry: string): Promise<RegistryIndex> =>
  JSON.parse(await fetchText(registry, 'index.json')) as RegistryIndex

/** Resolve `names` plus transitive registryDependencies, deduped, in install order. */
export const resolveTree = async (
  registry: string,
  style: string,
  names: string[],
): Promise<RegistryItem[]> => {
  const resolved = new Map<string, RegistryItem>()
  const queue = [...names]
  while (queue.length > 0) {
    const name = queue.shift()!
    if (resolved.has(name)) continue
    const item = await fetchItem(registry, style, name)
    resolved.set(name, item)
    for (const dep of item.registryDependencies ?? []) {
      if (!resolved.has(dep)) queue.push(dep)
    }
  }
  // dependencies before dependents: lib → ui → rest, stable within groups
  const order: Record<string, number> = { 'registry:lib': 0, 'registry:ui': 1 }
  return [...resolved.values()].sort(
    (a, b) => (order[a.type] ?? 2) - (order[b.type] ?? 2),
  )
}
