import { route } from '@aurelia/router'
import { componentDocs } from '../../lib/component-docs'

@route({
  routes: [
    { path: '', redirectTo: 'components/button' },
    {
      path: 'components/:name',
      component: import('./components/component-page'),
      title: 'Components',
    },
  ],
})
export class DocsLayout {
  readonly components = componentDocs
}
