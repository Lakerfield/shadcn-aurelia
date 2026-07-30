import { route } from '@aurelia/router'
import { componentDocs } from '../../lib/component-docs'

export interface GuideLink {
  path: string
  title: string
}

export const guideLinks: GuideLink[] = [
  { path: 'introduction', title: 'Introduction' },
  { path: 'installation', title: 'Installation' },
  { path: 'theming', title: 'Theming' },
  { path: 'dark-mode', title: 'Dark Mode' },
  { path: 'cli', title: 'CLI' },
  { path: 'components-json', title: 'components.json' },
  { path: 'differences', title: 'Differences from shadcn/ui' },
  { path: 'accessibility', title: 'Accessibility' },
  { path: 'blocks', title: 'Blocks' },
]

@route({
  routes: [
    { path: '', redirectTo: 'introduction' },
    { path: 'introduction', component: import('./guides/introduction'), title: 'Introduction' },
    { path: 'installation', component: import('./guides/installation'), title: 'Installation' },
    { path: 'theming', component: import('./guides/theming'), title: 'Theming' },
    { path: 'dark-mode', component: import('./guides/dark-mode'), title: 'Dark Mode' },
    { path: 'cli', component: import('./guides/cli'), title: 'CLI' },
    { path: 'components-json', component: import('./guides/components-json'), title: 'components.json' },
    { path: 'differences', component: import('./guides/differences'), title: 'Differences from shadcn/ui' },
    { path: 'accessibility', component: import('./guides/accessibility'), title: 'Accessibility' },
    { path: 'blocks', component: import('./guides/blocks'), title: 'Blocks' },
    { path: 'components', redirectTo: `components/${componentDocs[0].name}` },
    {
      path: 'components/:name',
      component: import('./components/component-page'),
      title: 'Components',
    },
  ],
})
export class DocsLayout {
  readonly guides = guideLinks
  readonly components = componentDocs
}
