import Aurelia from 'aurelia'
import { AppRoot } from './app-root'
import { UiTooltip } from './components/ui/tooltip/tooltip'
import { UiTooltipTrigger } from './components/ui/tooltip/tooltip-trigger'
import { UiTooltipContent } from './components/ui/tooltip/tooltip-content'
import './styles/globals.css'

Aurelia
  .register(UiTooltip, UiTooltipTrigger, UiTooltipContent)
  .app(AppRoot)
  .start()
