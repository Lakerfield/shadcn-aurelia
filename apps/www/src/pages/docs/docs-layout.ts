import { route } from '@aurelia/router'

@route({
  routes: [
    { path: '', redirectTo: 'components/tooltip' },
    {
      path: 'components/tooltip',
      component: import('./components/tooltip-page'),
      title: 'Tooltip',
    },
  ],
})
export class DocsLayout {}
