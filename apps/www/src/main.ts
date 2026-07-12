import Aurelia from 'aurelia'
import { RouterConfiguration } from '@aurelia/router'
import { ValidationHtmlConfiguration } from '@aurelia/validation-html'
import { AppRoot } from './app-root'
import './styles/globals.css'

const pendingRouteKey = 'gh-pages-route'

const getBasePath = () => {
  if (!window.location.hostname.endsWith('.github.io')) {
    return '/'
  }

  const [projectPath = ''] = window.location.pathname.split('/').filter(Boolean)
  return projectPath ? `/${projectPath}/` : '/'
}

const pendingRoute = sessionStorage.getItem(pendingRouteKey)
if (pendingRoute !== null) {
  sessionStorage.removeItem(pendingRouteKey)

  const basePath = getBasePath()
  const routePath = pendingRoute.startsWith('/') ? pendingRoute : `/${pendingRoute}`
  const nextPath = routePath === '/' ? basePath : `${basePath.replace(/\/$/, '')}${routePath}`

  window.history.replaceState(null, '', nextPath)
}

// Apply the persisted theme before first paint to avoid a light-mode flash
const storedTheme = localStorage.getItem('theme')
if (
  storedTheme === 'dark' ||
  (storedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark')
}

Aurelia
  .register(
    RouterConfiguration.customize({ useUrlFragmentHash: false, useHref: false }),
    ValidationHtmlConfiguration,
  )
  .app(AppRoot)
  .start()
