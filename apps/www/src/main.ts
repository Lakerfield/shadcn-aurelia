import Aurelia from 'aurelia'
import { RouterConfiguration } from '@aurelia/router'
import { ValidationHtmlConfiguration } from '@aurelia/validation-html'
import { AppRoot } from './app-root'
import './styles/globals.css'

const pagesProjectPath = '/shadcn-aurelia/'
const pendingRouteKey = 'gh-pages-route'

const pendingRoute = sessionStorage.getItem(pendingRouteKey)
if (pendingRoute !== null) {
  sessionStorage.removeItem(pendingRouteKey)

  const basePath = window.location.pathname.startsWith(pagesProjectPath) ? pagesProjectPath : '/'
  const normalizedRoute = pendingRoute.startsWith('/') ? pendingRoute.slice(1) : pendingRoute
  const nextUrl = new URL(normalizedRoute || '.', `${window.location.origin}${basePath}`)

  window.history.replaceState(null, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
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
