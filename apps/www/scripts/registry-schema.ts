/**
 * Zod schemas for the registry — compatible with shadcn's registry.json /
 * registry-item.json schemas (https://ui.shadcn.com/schema) so upstream
 * tooling and the shadcn CLI's custom-registry support keep working.
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
  // filled in by the build with the file's source text
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

export type Registry = z.infer<typeof registrySchema>
export type RegistryItem = z.infer<typeof registryItemSchema>
