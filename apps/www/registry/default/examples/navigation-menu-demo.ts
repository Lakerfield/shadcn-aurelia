import { customElement } from 'aurelia'
import {
  UiNavigationMenu,
  UiNavigationMenuList,
  UiNavigationMenuItem,
  UiNavigationMenuTrigger,
  UiNavigationMenuContent,
  UiNavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/registry/default/ui/navigation-menu'

const TEMPLATE = `
<ui-navigation-menu>
  <ui-navigation-menu-list>
    <ui-navigation-menu-item>
      <ui-navigation-menu-trigger>Getting started</ui-navigation-menu-trigger>
      <ui-navigation-menu-content>
        <div class="grid w-[400px] gap-1 md:w-[500px] md:grid-cols-2">
          <ui-navigation-menu-link href="#introduction">
            <div class="font-medium">Introduction</div>
            <div class="text-muted-foreground text-sm">Copy-paste components built for Aurelia 2.</div>
          </ui-navigation-menu-link>
          <ui-navigation-menu-link href="#installation">
            <div class="font-medium">Installation</div>
            <div class="text-muted-foreground text-sm">How to install dependencies and structure your app.</div>
          </ui-navigation-menu-link>
          <ui-navigation-menu-link href="#typography">
            <div class="font-medium">Typography</div>
            <div class="text-muted-foreground text-sm">Styles for headings, paragraphs, lists…</div>
          </ui-navigation-menu-link>
        </div>
      </ui-navigation-menu-content>
    </ui-navigation-menu-item>
    <ui-navigation-menu-item>
      <ui-navigation-menu-trigger>Components</ui-navigation-menu-trigger>
      <ui-navigation-menu-content>
        <div class="grid w-[300px] gap-1">
          <ui-navigation-menu-link href="#dialog">
            <div class="font-medium">Dialog</div>
            <div class="text-muted-foreground text-sm">A modal window overlaid on the page.</div>
          </ui-navigation-menu-link>
          <ui-navigation-menu-link href="#dropdown-menu">
            <div class="font-medium">Dropdown Menu</div>
            <div class="text-muted-foreground text-sm">Displays a menu of actions.</div>
          </ui-navigation-menu-link>
        </div>
      </ui-navigation-menu-content>
    </ui-navigation-menu-item>
    <ui-navigation-menu-item>
      <a href="#docs" class="\${plainLinkClasses}">Documentation</a>
    </ui-navigation-menu-item>
  </ui-navigation-menu-list>
</ui-navigation-menu>
`

@customElement({
  name: 'navigation-menu-demo',
  template: TEMPLATE,
  dependencies: [
    UiNavigationMenu,
    UiNavigationMenuList,
    UiNavigationMenuItem,
    UiNavigationMenuTrigger,
    UiNavigationMenuContent,
    UiNavigationMenuLink,
  ],
})
export class NavigationMenuDemo {
  plainLinkClasses = navigationMenuTriggerStyle()
}
