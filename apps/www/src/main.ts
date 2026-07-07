import Aurelia from 'aurelia'
import { RouterConfiguration } from '@aurelia/router'
import { ValidationHtmlConfiguration } from '@aurelia/validation-html'
import { AppRoot } from './app-root'
import './styles/globals.css'

// Apply the persisted theme before first paint to avoid a light-mode flash
const storedTheme = localStorage.getItem('theme')
if (
  storedTheme === 'dark' ||
  (storedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches)
) {
  document.documentElement.classList.add('dark')
}

Aurelia.register(
  RouterConfiguration.customize({ useUrlFragmentHash: false, useHref: false }),
  ValidationHtmlConfiguration,
)
  .app(AppRoot)
  .start()
