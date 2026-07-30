/**
 * Splits a single-file example (const TEMPLATE = `…` + @customElement({ template: TEMPLATE }))
 * into the html/ts pair you would write with Aurelia conventions: the html file
 * `<import>`s the ui modules and pairs with the class by file name, so the ts
 * usually shrinks to just the class. When the decorator carries more than
 * name/template/dependencies — or a dependency isn't an import — the ts keeps
 * the decorator and imports the template instead. Returns null when the source
 * doesn't follow the convention at all; the preview then only offers the
 * single-file tab.
 */
export interface SplitExample {
  html: string
  ts: string
}

/**
 * Rewrites registry import paths to what `shadcn-aurelia add` produces with the
 * default components.json aliases, so visitors can copy-paste the shown code.
 * Mirrors transformImports in packages/cli/src/utils/transform.ts.
 */
export function toConsumerPaths(code: string): string {
  return code
    .replaceAll('@/registry/default/ui/', '@/components/ui/')
    .replaceAll('@/registry/default/lib/', '@/lib/')
    .replaceAll('@/registry/default/examples/', '@/components/examples/')
}

const TEMPLATE_DECL_RE = /\nconst TEMPLATE = `([\s\S]*?)`\n/
const DECORATOR_RE = /@customElement\(\{([\s\S]*?)\}\)\n(?=export class )/
const IMPORT_RE = /^import (type )?\{([^}]*)\} from '([^']+)'$/gm

interface TsImport {
  statement: string
  typeOnly: boolean
  names: string[]
  module: string
}

export function splitExample(source: string): SplitExample | null {
  const templateMatch = TEMPLATE_DECL_RE.exec(source)
  const nameMatch = /name:\s*'([^']+)'/.exec(source)
  if (!templateMatch || !nameMatch || !source.includes('template: TEMPLATE')) return null

  let ts = source.replace(TEMPLATE_DECL_RE, '\n')
  let html = templateMatch[1]

  // Inline the module-level template-literal consts (icon svg's) that the
  // template interpolates, and drop their declarations when nothing else
  // references them. `\${…}` stays untouched: that's an Aurelia interpolation.
  for (const decl of source.matchAll(/^const ([A-Za-z0-9_]+) = `[\s\S]*?`$/gm)) {
    const name = decl[1]
    if (name === 'TEMPLATE') continue
    const ref = new RegExp(`(^|[^\\\\])\\$\\{${name}\\}`, 'g')
    if (!ref.test(html)) continue
    const value = decl[0].slice(decl[0].indexOf('`') + 1, -1)
    html = html.replace(ref, (_, before: string) => before + value)
    const without = ts.replace(decl[0] + '\n', '')
    if (!without.includes(name)) ts = without
  }

  html = html.replace(/\\([\\`$])/g, '$1').trim() + '\n'

  const conventions = toConventions(ts, html)
  if (conventions !== null) return conventions

  // Fallback: keep the decorator, import the template explicitly.
  ts = ts.replace('template: TEMPLATE', 'template')
  ts = insertAfterImports(ts, `import template from './${nameMatch[1]}.html'`)
  return { html, ts: tidy(ts) }
}

function toConventions(ts: string, html: string): SplitExample | null {
  const decorator = DECORATOR_RE.exec(ts)
  if (!decorator) return null
  const config = decorator[1]

  // Only name/template/dependencies can move to conventions + html imports.
  const keys = [...config.replace(/'[^']*'|\[[\s\S]*?\]/g, '').matchAll(/(\w+)\s*:/g)].map((m) => m[1])
  if (keys.some((k) => k !== 'name' && k !== 'template' && k !== 'dependencies')) return null

  const dependencies = (/dependencies:\s*\[([\s\S]*?)\]/.exec(config)?.[1] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')

  const imports = parseImports(ts)
  const bySymbol = new Map<string, TsImport>()
  for (const imp of imports) {
    if (imp.typeOnly) continue
    for (const name of imp.names) {
      if (!name.startsWith('type ')) bySymbol.set(name, imp)
    }
  }
  // A dependency defined in this file can't move to an html <import>.
  if (dependencies.some((d) => !bySymbol.has(d))) return null

  const modules: string[] = []
  for (const d of dependencies) {
    const module = bySymbol.get(d)!.module
    if (!modules.includes(module)) modules.push(module)
  }
  if (modules.length > 0) {
    html = modules.map((m) => `<import from="${m}"></import>`).join('\n') + '\n\n' + html
  }

  ts = ts.replace(DECORATOR_RE, '')
  ts = dropUnusedImportSymbols(ts, imports, new Set([...dependencies, 'customElement']))
  return { html, ts: tidy(ts) }
}

function parseImports(ts: string): TsImport[] {
  return [...ts.matchAll(IMPORT_RE)].map((m) => ({
    statement: m[0],
    typeOnly: m[1] !== undefined,
    names: m[2]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== ''),
    module: m[3],
  }))
}

/** Removes the given symbols from import statements when the code no longer uses them. */
function dropUnusedImportSymbols(ts: string, imports: TsImport[], candidates: Set<string>): string {
  let body = ts
  for (const imp of imports) body = body.replace(imp.statement, '')
  for (const imp of imports) {
    if (imp.typeOnly) continue
    const kept = imp.names.filter((name) => {
      if (!candidates.has(name)) return true
      return new RegExp(`\\b${name}\\b`).test(body)
    })
    if (kept.length === imp.names.length) continue
    if (kept.length === 0) {
      ts = ts.replace(imp.statement + '\n', '')
    } else if (kept.every((n) => n.startsWith('type '))) {
      const names = kept.map((n) => n.slice('type '.length))
      ts = ts.replace(imp.statement, `import type { ${names.join(', ')} } from '${imp.module}'`)
    } else {
      ts = ts.replace(imp.statement, `import { ${kept.join(', ')} } from '${imp.module}'`)
    }
  }
  return ts
}

/** Adds a line after the last import statement. */
function insertAfterImports(ts: string, line: string): string {
  let insertAt = 0
  for (const m of ts.matchAll(/^.*from '[^']+'$/gm)) {
    insertAt = (m.index ?? 0) + m[0].length + 1
  }
  return ts.slice(0, insertAt) + line + '\n' + ts.slice(insertAt)
}

function tidy(ts: string): string {
  return ts.replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
