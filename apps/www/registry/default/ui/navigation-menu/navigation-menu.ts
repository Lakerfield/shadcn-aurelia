/**
 * ui-navigation-menu family — Zag navigation-menu behind the facade
 * (viewport-less variant: each item's content panel renders absolutely below
 * its own item, like shadcn's viewport={false} mode).
 *
 *   <ui-navigation-menu>
 *     <ui-navigation-menu-list>
 *       <ui-navigation-menu-item>
 *         <ui-navigation-menu-trigger>Products</ui-navigation-menu-trigger>
 *         <ui-navigation-menu-content>
 *           <ui-navigation-menu-link href="/docs">Docs</ui-navigation-menu-link>
 *         </ui-navigation-menu-content>
 *       </ui-navigation-menu-item>
 *     </ui-navigation-menu-list>
 *   </ui-navigation-menu>
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import {
  createNavigationMenuBehavior,
  createContext,
  createId,
  bindPart,
  type Context,
  type NavigationMenuApi,
  type BehaviorSource,
} from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'

export const navigationMenuContext: Context<BehaviorSource<NavigationMenuApi>> =
  createContext<BehaviorSource<NavigationMenuApi>>()

function itemValueOf(host: HTMLElement): string {
  return host.closest('[data-slot="navigation-menu-item"]')?.getAttribute('data-value') ?? ''
}

export const navigationMenuTriggerStyle = () =>
  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1'

@customElement({ name: 'ui-navigation-menu', template: '<au-slot></au-slot>' })
export class UiNavigationMenu implements BehaviorSource<NavigationMenuApi> {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly behavior = createNavigationMenuBehavior()
  private dispose: (() => void) | null = null

  get api(): NavigationMenuApi | null {
    return this.behavior.api
  }

  subscribe(listener: () => void): () => void {
    return this.behavior.subscribe(listener)
  }

  binding(): void {
    navigationMenuContext.set(this.host, this)
    this.behavior.init({
      id: createId('nav-menu'),
      onValueChange: (d: { value: string | null }) => {
        this.host.dispatchEvent(new CustomEvent('value-change', { detail: { value: d.value }, bubbles: true }))
      },
    })
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'navigation-menu')
    this.host.className = cn(
      'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
      author,
    )
  }

  attached(): void {
    this.behavior.start()
    this.dispose = bindPart(this.behavior, this.host, (api) => api.getRootProps())
  }

  detaching(): void {
    this.dispose?.()
    this.behavior.stop()
    navigationMenuContext.delete(this.host)
  }
}

@customElement({ name: 'ui-navigation-menu-list', template: '<au-slot></au-slot>' })
export class UiNavigationMenuList {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'navigation-menu-list')
    this.host.className = cn('group flex flex-1 list-none items-center justify-center gap-1', author)
  }

  attached(): void {
    const nav = navigationMenuContext.get(this.host)
    if (!nav) return
    this.dispose = bindPart(nav, this.host, (api) => api.getListProps())
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-navigation-menu-item', template: '<au-slot></au-slot>' })
export class UiNavigationMenuItem {
  @bindable() value = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    if (!this.value) this.value = createId('nav-item')
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'navigation-menu-item')
    this.host.setAttribute('data-value', this.value)
    this.host.className = cn('relative block', author)
  }

  attached(): void {
    const nav = navigationMenuContext.get(this.host)
    if (!nav) return
    this.dispose = bindPart(nav, this.host, (api) => api.getItemProps({ value: this.value }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const CHEVRON_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" class.bind="classes" data-slot="navigation-menu-trigger">
  <au-slot></au-slot>
  ${CHEVRON_DOWN}
</button>
`

@customElement({ name: 'ui-navigation-menu-trigger', template: TRIGGER_TEMPLATE })
export class UiNavigationMenuTrigger {
  btn!: HTMLButtonElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(navigationMenuTriggerStyle(), this.authorClasses)
  }

  attached(): void {
    const nav = navigationMenuContext.get(this.host)
    if (!nav) {
      console.warn('[ui-navigation-menu-trigger] No parent <ui-navigation-menu> found')
      return
    }
    const value = itemValueOf(this.host)
    this.dispose = bindPart(nav, this.btn, (api) => api.getTriggerProps({ value }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

@customElement({ name: 'ui-navigation-menu-content', template: '<au-slot></au-slot>' })
export class UiNavigationMenuContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'navigation-menu-content')
    this.host.className = cn(
      'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 absolute top-full left-0 z-50 mt-1.5 block w-auto overflow-hidden rounded-md border p-2 shadow data-[state=closed]:hidden',
      author,
    )
  }

  attached(): void {
    const nav = navigationMenuContext.get(this.host)
    if (!nav) return
    const value = itemValueOf(this.host)
    this.dispose = bindPart(nav, this.host, (api) => api.getContentProps({ value }))
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const LINK_TEMPLATE = `
<a ref="linkEl" href.bind="href" class.bind="classes" data-slot="navigation-menu-link">
  <au-slot></au-slot>
</a>
`

@customElement({ name: 'ui-navigation-menu-link', template: LINK_TEMPLATE })
export class UiNavigationMenuLink {
  @bindable() active = false

  // Read as a plain attribute: an `href` bindable would clash with the
  // router's `href` custom attribute (ambiguous-binding warning).
  href = ''

  linkEl!: HTMLAnchorElement
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private dispose: (() => void) | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.href = this.host.getAttribute('href') ?? ''
    if (this.active) this.linkEl.setAttribute('data-active', 'true')
  }

  get classes(): string {
    return cn(
      "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='text-'])]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
      this.authorClasses,
    )
  }

  attached(): void {
    const nav = navigationMenuContext.get(this.host)
    if (!nav) return
    const value = itemValueOf(this.host)
    this.dispose = bindPart(nav, this.linkEl, (api) =>
      api.getLinkProps({ value, current: this.active || undefined }),
    )
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}
