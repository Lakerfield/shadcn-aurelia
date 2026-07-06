/**
 * Zod schemas — compatible with shadcn's registry.json / registry-item.json
 * (https://ui.shadcn.com/schema). Mirrors apps/www/scripts/registry-schema.ts.
 */
import { z } from 'zod'

export const registryItemTypeSchema = z.enum([
  'registry:ui',
  'registry:lib',
  'registry:block',
  'registry:example',
  'registry:style',
  'registry:theme',
  'registry:hook',
  'registry:page',
  'registry:file',
])

export const registryItemFileSchema = z.object({
  path: z.string(),
  type: registryItemTypeSchema,
  target: z.string().optional(),
  content: z.string().optional(),
})

export const registryItemSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: registryItemTypeSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(registryItemFileSchema).optional(),
  cssVars: z
    .object({
      theme: z.record(z.string(), z.string()).optional(),
      light: z.record(z.string(), z.string()).optional(),
      dark: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
})

export const registrySchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  homepage: z.string().optional(),
  items: z.array(registryItemSchema),
})

export const componentsConfigSchema = z.object({
  $schema: z.string().optional(),
  style: z.string().default('default'),
  prefix: z.string().default('ui'),
  tailwind: z.object({
    css: z.string(),
    baseColor: z.string().default('zinc'),
  }),
  aliases: z.object({
    components: z.string().default('@/components'),
    ui: z.string().default('@/components/ui'),
    lib: z.string().default('@/lib'),
  }),
  registry: z.string(),
})

export type Registry = z.infer<typeof registrySchema>
export type RegistryItem = z.infer<typeof registryItemSchema>
export type RegistryItemFile = z.infer<typeof registryItemFileSchema>
export type ComponentsConfig = z.infer<typeof componentsConfigSchema>
