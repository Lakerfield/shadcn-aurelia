import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { componentsConfigSchema, type ComponentsConfig } from '../schema/registry.js'

export const CONFIG_FILE = 'components.json'

export const readConfig = async (root: string): Promise<ComponentsConfig | null> => {
  const path = join(root, CONFIG_FILE)
  if (!existsSync(path)) return null
  return componentsConfigSchema.parse(JSON.parse(await readFile(path, 'utf8')))
}

export const writeConfig = async (root: string, config: ComponentsConfig): Promise<void> => {
  await writeFile(join(root, CONFIG_FILE), JSON.stringify(config, null, 2) + '\n')
}
