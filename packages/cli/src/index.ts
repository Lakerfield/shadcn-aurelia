#!/usr/bin/env node
/**
 * shadcn-aurelia — copy-paste Aurelia 2 components from a shadcn-style registry.
 */
import { Command } from 'commander'
import { runInit } from './commands/init.js'
import { runAdd } from './commands/add.js'
import { runDiff } from './commands/diff.js'
import { runBuild } from './commands/build.js'

const DEFAULT_REGISTRY = 'https://shadcn-aurelia.com/r'

const program = new Command()
  .name('shadcn-aurelia')
  .description('add copy-paste Aurelia 2 components to your project')
  .version('0.0.1')

program
  .command('init')
  .description('configure the project: preflights, components.json, theme css')
  .option('-c, --cwd <path>', 'working directory', process.cwd())
  .option('-r, --registry <url|dir>', 'registry base (url or local directory)', DEFAULT_REGISTRY)
  .option('-s, --style <name>', 'registry style', 'default')
  .option('-p, --prefix <prefix>', 'custom element prefix', 'ui')
  .option('-b, --base-color <color>', 'base color', 'zinc')
  .option('--css <path>', 'stylesheet containing @import "tailwindcss"')
  .option('-f, --force', 'overwrite an existing components.json', false)
  .action(async (opts) => {
    await runInit({
      cwd: opts.cwd,
      registry: opts.registry,
      style: opts.style,
      prefix: opts.prefix,
      baseColor: opts.baseColor,
      css: opts.css,
      force: opts.force,
    })
  })

program
  .command('add')
  .description('add components (and their dependencies) to the project')
  .argument('<components...>', 'component names, e.g. button dialog form')
  .option('-c, --cwd <path>', 'working directory', process.cwd())
  .option('-o, --overwrite', 'overwrite existing files', false)
  .option('--no-install', 'skip npm dependency installation')
  .action(async (components: string[], opts) => {
    await runAdd(components, { cwd: opts.cwd, overwrite: opts.overwrite, install: opts.install })
  })

program
  .command('diff')
  .description('compare local component copies against the registry')
  .argument('[components...]', 'component names (default: all installed)')
  .option('-c, --cwd <path>', 'working directory', process.cwd())
  .action(async (components: string[], opts) => {
    await runDiff(components, { cwd: opts.cwd })
  })

program
  .command('build')
  .description('build a registry: validate registry.json and emit JSON artifacts')
  .option('-c, --cwd <path>', 'working directory', process.cwd())
  .option('-r, --registry-file <path>', 'registry manifest', 'registry.json')
  .option('-o, --output <dir>', 'output directory', 'public/r')
  .option('-s, --style <name>', 'style name for the output layout', 'default')
  .action(async (opts) => {
    await runBuild({
      cwd: opts.cwd,
      registryFile: opts.registryFile,
      output: opts.output,
      style: opts.style,
    })
  })

program.parseAsync().catch((err) => {
  console.error(err)
  process.exit(1)
})
