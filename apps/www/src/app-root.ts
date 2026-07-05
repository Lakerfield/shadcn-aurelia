import { route } from '@aurelia/router'

@route({
  routes: [
    {
      path: ['', 'home'],
      component: import('./pages/home/home'),
      title: 'shadcn-aurelia',
    },
    {
      path: 'docs',
      component: import('./pages/docs/docs-layout'),
      title: 'Docs',
    },
  ],
})
export class AppRoot {}
