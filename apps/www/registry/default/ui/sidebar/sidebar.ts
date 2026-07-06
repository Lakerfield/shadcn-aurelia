/**
 * ui-sidebar family — the composite application sidebar.
 *
 *   <ui-sidebar-provider>
 *     <ui-sidebar collapsible="icon">
 *       <ui-sidebar-header>…</ui-sidebar-header>
 *       <ui-sidebar-content>
 *         <ui-sidebar-group>
 *           <ui-sidebar-group-label>Platform</ui-sidebar-group-label>
 *           <ui-sidebar-menu>
 *             <ui-sidebar-menu-item>
 *               <ui-sidebar-menu-button tooltip="Home" is-active.bind="true">…</ui-sidebar-menu-button>
 *             </ui-sidebar-menu-item>
 *           </ui-sidebar-menu>
 *         </ui-sidebar-group>
 *       </ui-sidebar-content>
 *       <ui-sidebar-rail></ui-sidebar-rail>
 *     </ui-sidebar>
 *     <ui-sidebar-inset>
 *       <ui-sidebar-trigger></ui-sidebar-trigger>
 *       page content
 *     </ui-sidebar-inset>
 *   </ui-sidebar-provider>
 *
 * Desktop collapses offcanvas/icon (Ctrl/Cmd+B toggles, state persists in a
 * cookie); below 768px the sidebar renders inside a sheet instead.
 * ui-sidebar-inset is a plain region — wrap your own <main> semantics.
 */
import { customElement, bindable, BindingMode, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { createContext, type Context } from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { buttonVariants } from '@/registry/default/ui/button'
import { UiInput } from '@/registry/default/ui/input'
import { UiSeparator } from '@/registry/default/ui/separator'
import { UiSkeleton } from '@/registry/default/ui/skeleton'
import { UiDialog, UiDialogTitle, UiDialogDescription } from '@/registry/default/ui/dialog'
import { UiSheetContent } from '@/registry/default/ui/sheet'
import { UiTooltip } from '@/registry/default/ui/tooltip'
import { UiTooltipTrigger } from '@/registry/default/ui/tooltip'
import { UiTooltipContent } from '@/registry/default/ui/tooltip'

const SIDEBAR_COOKIE_NAME = 'sidebar_state'
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = '16rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'
const MOBILE_QUERY = '(max-width: 767px)'

export interface SidebarOwner {
  readonly state: 'expanded' | 'collapsed'
  readonly open: boolean
  readonly openMobile: boolean
  readonly isMobile: boolean
  setOpen(open: boolean): void
  setOpenMobile(open: boolean): void
  toggleSidebar(): void
  subscribe(listener: () => void): () => void
}

export const sidebarContext: Context<SidebarOwner> = createContext<SidebarOwner>()

@customElement({ name: 'ui-sidebar-provider', template: '<au-slot></au-slot>' })
export class UiSidebarProvider implements SidebarOwner {
  @bindable({ mode: BindingMode.twoWay }) open = true

  openMobile = false
  isMobile = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly listeners = new Set<() => void>()
  private mql: MediaQueryList | null = null

  get state(): 'expanded' | 'collapsed' {
    return this.open ? 'expanded' : 'collapsed'
  }

  binding(): void {
    sidebarContext.set(this.host, this)
    this.mql = window.matchMedia(MOBILE_QUERY)
    this.isMobile = this.mql.matches
    this.mql.addEventListener('change', this.onMediaChange)
  }

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-wrapper')
    this.host.style.setProperty('--sidebar-width', SIDEBAR_WIDTH)
    this.host.style.setProperty('--sidebar-width-icon', SIDEBAR_WIDTH_ICON)
    this.host.className = cn(
      'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar',
      author,
    )
  }

  attached(): void {
    window.addEventListener('keydown', this.onKeydown)
  }

  setOpen(open: boolean): void {
    this.open = open
  }

  setOpenMobile(open: boolean): void {
    this.openMobile = open
    this.notify()
  }

  toggleSidebar(): void {
    if (this.isMobile) this.setOpenMobile(!this.openMobile)
    else this.setOpen(!this.open)
  }

  openChanged(v: boolean): void {
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${v}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    this.host.dispatchEvent(new CustomEvent('open-change', { detail: v, bubbles: true }))
    this.notify()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    this.listeners.forEach((l) => l())
  }

  private onMediaChange = (e: MediaQueryListEvent): void => {
    this.isMobile = e.matches
    this.notify()
  }

  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      this.toggleSidebar()
    }
  }

  detaching(): void {
    window.removeEventListener('keydown', this.onKeydown)
    this.mql?.removeEventListener('change', this.onMediaChange)
    this.listeners.clear()
    sidebarContext.delete(this.host)
  }
}

const SIDEBAR_TEMPLATE = `
<template if.bind="mode === 'none'"><au-slot></au-slot></template>
<template if.bind="mode === 'mobile'">
  <ui-dialog open.bind="mobileOpen" open-change.trigger="onMobileOpenChange($event)">
    <ui-sheet-content side.bind="side" style="--sidebar-width: ${SIDEBAR_WIDTH_MOBILE}"
        class="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&_[data-slot=sheet-close]]:hidden"
        data-sidebar="sidebar" data-mobile="true">
      <ui-dialog-title class="sr-only">Sidebar</ui-dialog-title>
      <ui-dialog-description class="sr-only">Displays the mobile sidebar.</ui-dialog-description>
      <div class="flex h-full w-full flex-col"><au-slot></au-slot></div>
    </ui-sheet-content>
  </ui-dialog>
</template>
<template if.bind="mode === 'desktop'">
  <div data-slot="sidebar-gap" class.bind="gapClasses"></div>
  <div data-slot="sidebar-container" class.bind="containerClasses">
    <div data-sidebar="sidebar" data-slot="sidebar-inner"
         class="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm">
      <au-slot></au-slot>
    </div>
  </div>
</template>
`

@customElement({
  name: 'ui-sidebar',
  template: SIDEBAR_TEMPLATE,
  dependencies: [UiDialog, UiDialogTitle, UiDialogDescription, UiSheetContent],
})
export class UiSidebar {
  @bindable() side: 'left' | 'right' = 'left'
  @bindable() variant: 'sidebar' | 'floating' | 'inset' = 'sidebar'
  @bindable() collapsible: 'offcanvas' | 'icon' | 'none' = 'offcanvas'

  mode: 'none' | 'mobile' | 'desktop' = 'desktop'
  mobileOpen = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: SidebarOwner | null = null
  private dispose: (() => void) | null = null
  private authorClasses = ''

  binding(): void {
    // capture BEFORE applyHost overwrites host.className
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.owner = sidebarContext.get(this.host) ?? null
    this.syncFromOwner()
  }

  attached(): void {
    if (this.owner) this.dispose = this.owner.subscribe(() => this.syncFromOwner())
  }

  private syncFromOwner(): void {
    const o = this.owner
    this.mode = this.collapsible === 'none' ? 'none' : o?.isMobile ? 'mobile' : 'desktop'
    this.mobileOpen = o?.openMobile ?? false
    this.applyHost()
  }

  onMobileOpenChange(e: CustomEvent<boolean>): void {
    this.owner?.setOpenMobile(e.detail)
  }

  private applyHost(): void {
    const h = this.host
    if (this.mode === 'none') {
      h.style.display = ''
      h.removeAttribute('data-state')
      h.removeAttribute('data-collapsible')
      h.removeAttribute('data-variant')
      h.removeAttribute('data-side')
      h.setAttribute('data-slot', 'sidebar')
      h.className = cn(
        'flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground',
        this.authorClasses,
      )
      return
    }
    if (this.mode === 'mobile') {
      h.className = ''
      h.style.display = 'contents'
      h.setAttribute('data-slot', 'sidebar')
      return
    }
    const state = this.owner?.state ?? 'expanded'
    h.style.display = ''
    h.setAttribute('data-slot', 'sidebar')
    h.setAttribute('data-state', state)
    h.setAttribute('data-collapsible', state === 'collapsed' ? this.collapsible : '')
    h.setAttribute('data-variant', this.variant)
    h.setAttribute('data-side', this.side)
    h.className = 'group peer hidden text-sidebar-foreground md:block'
  }

  get gapClasses(): string {
    return cn(
      'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
      'group-data-[collapsible=offcanvas]:w-0',
      'group-data-[side=right]:rotate-180',
      this.variant === 'floating' || this.variant === 'inset'
        ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
        : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
    )
  }

  get containerClasses(): string {
    return cn(
      'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
      this.side === 'left'
        ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
        : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
      this.variant === 'floating' || this.variant === 'inset'
        ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
        : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
      this.authorClasses,
    )
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const PANEL_LEFT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path></svg>`

const TRIGGER_TEMPLATE = `
<button ref="btn" type="button" data-slot="sidebar-trigger" data-sidebar="trigger"
        class.bind="classes" click.trigger="onClick()">
  ${PANEL_LEFT_ICON}
  <span class="sr-only">Toggle Sidebar</span>
</button>
`

@customElement({ name: 'ui-sidebar-trigger', template: TRIGGER_TEMPLATE })
export class UiSidebarTrigger {
  btn!: HTMLButtonElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-7', this.authorClasses)
  }

  onClick(): void {
    sidebarContext.get(this.host)?.toggleSidebar()
  }
}

const RAIL_TEMPLATE = `
<button ref="btn" type="button" data-slot="sidebar-rail" data-sidebar="rail"
        aria-label="Toggle Sidebar" tabindex="-1" title="Toggle Sidebar"
        class.bind="classes" click.trigger="onClick()"></button>
`

@customElement({ name: 'ui-sidebar-rail', template: RAIL_TEMPLATE })
export class UiSidebarRail {
  btn!: HTMLButtonElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex',
      'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
      '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
      'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar',
      '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
      '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
      this.authorClasses,
    )
  }

  onClick(): void {
    sidebarContext.get(this.host)?.toggleSidebar()
  }
}

/** Content area next to the sidebar. Plain region — add your own <main> semantics inside. */
@customElement({ name: 'ui-sidebar-inset', template: '<au-slot></au-slot>' })
export class UiSidebarInset {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-inset')
    this.host.className = cn(
      'relative flex w-full flex-1 flex-col bg-background',
      'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
      author,
    )
  }
}

const INPUT_TEMPLATE = `
<ui-input class.bind="classes" type.bind="type" value.two-way="value"
          placeholder.bind="placeholder" data-slot="sidebar-input" data-sidebar="input"></ui-input>
`

@customElement({ name: 'ui-sidebar-input', template: INPUT_TEMPLATE, dependencies: [UiInput] })
export class UiSidebarInput {
  @bindable({ mode: BindingMode.twoWay }) value = ''
  @bindable() placeholder = ''
  @bindable() type = 'text'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn('h-8 w-full bg-background shadow-none', this.authorClasses)
  }
}

function definePart(name: string, slot: string, classes: string) {
  @customElement({ name, template: '<au-slot></au-slot>' })
  class SidebarPart {
    readonly host: HTMLElement = resolve(INode) as HTMLElement

    bound(): void {
      const author = this.host.getAttribute('class') ?? ''
      this.host.setAttribute('data-slot', slot)
      this.host.setAttribute('data-sidebar', slot.replace(/^sidebar-/, ''))
      this.host.className = cn(classes, author)
    }
  }
  return SidebarPart
}

export const UiSidebarHeader = definePart(
  'ui-sidebar-header',
  'sidebar-header',
  'flex flex-col gap-2 p-2',
)

export const UiSidebarFooter = definePart(
  'ui-sidebar-footer',
  'sidebar-footer',
  'flex flex-col gap-2 p-2',
)

export const UiSidebarContent = definePart(
  'ui-sidebar-content',
  'sidebar-content',
  'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
)

export const UiSidebarGroup = definePart(
  'ui-sidebar-group',
  'sidebar-group',
  'relative flex w-full min-w-0 flex-col p-2',
)

export const UiSidebarGroupLabel = definePart(
  'ui-sidebar-group-label',
  'sidebar-group-label',
  'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
)

export const UiSidebarGroupContent = definePart(
  'ui-sidebar-group-content',
  'sidebar-group-content',
  'w-full text-sm',
)

const SEPARATOR_TEMPLATE = `<ui-separator class.bind="classes" data-slot="sidebar-separator" data-sidebar="separator"></ui-separator>`

@customElement({ name: 'ui-sidebar-separator', template: SEPARATOR_TEMPLATE, dependencies: [UiSeparator] })
export class UiSidebarSeparator {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn('mx-2 w-auto bg-sidebar-border', this.authorClasses)
  }
}

const GROUP_ACTION_TEMPLATE = `
<button ref="btn" type="button" data-slot="sidebar-group-action" data-sidebar="group-action"
        class.bind="classes"><au-slot></au-slot></button>
`

@customElement({ name: 'ui-sidebar-group-action', template: GROUP_ACTION_TEMPLATE })
export class UiSidebarGroupAction {
  btn!: HTMLButtonElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
  }

  get classes(): string {
    return cn(
      'absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
      'after:absolute after:-inset-2 md:after:hidden',
      'group-data-[collapsible=icon]:hidden',
      this.authorClasses,
    )
  }
}

@customElement({ name: 'ui-sidebar-menu', template: '<au-slot></au-slot>' })
export class UiSidebarMenu {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-menu')
    this.host.setAttribute('data-sidebar', 'menu')
    this.host.setAttribute('role', 'list')
    this.host.className = cn('flex w-full min-w-0 flex-col gap-1', author)
  }
}

@customElement({ name: 'ui-sidebar-menu-item', template: '<au-slot></au-slot>' })
export class UiSidebarMenuItem {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-menu-item')
    this.host.setAttribute('data-sidebar', 'menu-item')
    this.host.setAttribute('role', 'listitem')
    this.host.className = cn('group/menu-item relative block', author)
  }
}

export const sidebarMenuButtonVariants = cva(
  'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        outline:
          'bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]',
      },
      size: {
        default: 'h-8 text-sm',
        sm: 'h-7 text-xs',
        lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type SidebarMenuButtonVariants = VariantProps<typeof sidebarMenuButtonVariants>

const MENU_BUTTON_TEMPLATE = `
<template if.bind="tooltip">
  <ui-tooltip placement="right">
    <ui-tooltip-trigger>
      <button ref="btn" type="button" data-slot="sidebar-menu-button" class.bind="classes"
              data-size.bind="size" data-active.bind="isActive"><au-slot></au-slot></button>
    </ui-tooltip-trigger>
    <ui-tooltip-content if.bind="tooltipVisible">\${tooltip}</ui-tooltip-content>
  </ui-tooltip>
</template>
<template if.bind="!tooltip">
  <button ref="btn" type="button" data-slot="sidebar-menu-button" class.bind="classes"
          data-size.bind="size" data-active.bind="isActive"><au-slot></au-slot></button>
</template>
`

@customElement({
  name: 'ui-sidebar-menu-button',
  template: MENU_BUTTON_TEMPLATE,
  dependencies: [UiTooltip, UiTooltipTrigger, UiTooltipContent],
})
export class UiSidebarMenuButton {
  @bindable() variant: SidebarMenuButtonVariants['variant'] = 'default'
  @bindable() size: SidebarMenuButtonVariants['size'] = 'default'
  @bindable() isActive = false
  /** Tooltip text shown when the sidebar is icon-collapsed. */
  @bindable() tooltip = ''

  tooltipVisible = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: SidebarOwner | null = null
  private dispose: (() => void) | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    // sibling selectors (menu-action / menu-badge positioning) key off the host
    this.host.setAttribute('data-sidebar', 'menu-button')
    this.host.setAttribute('data-size', this.size ?? 'default')
    this.host.setAttribute('data-active', String(this.isActive))
  }

  attached(): void {
    this.owner = sidebarContext.get(this.host) ?? null
    if (this.owner) {
      const sync = () => {
        this.tooltipVisible = this.owner!.state === 'collapsed' && !this.owner!.isMobile
      }
      sync()
      this.dispose = this.owner.subscribe(sync)
    }
  }

  isActiveChanged(): void {
    this.host.setAttribute('data-active', String(this.isActive))
  }

  get classes(): string {
    return cn(
      sidebarMenuButtonVariants({ variant: this.variant, size: this.size }),
      this.authorClasses,
    )
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
  }
}

const MENU_ACTION_TEMPLATE = `
<button ref="btn" type="button" data-slot="sidebar-menu-action" class.bind="classes">
  <au-slot></au-slot>
</button>
`

@customElement({ name: 'ui-sidebar-menu-action', template: MENU_ACTION_TEMPLATE })
export class UiSidebarMenuAction {
  @bindable() showOnHover = false

  btn!: HTMLButtonElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-sidebar', 'menu-action')
  }

  get classes(): string {
    return cn(
      'absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-hover/menu-item:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
      'after:absolute after:-inset-2 md:after:hidden',
      '[[data-sidebar=menu-button][data-size=sm]~*_&]:top-1',
      '[[data-sidebar=menu-button][data-size=default]~*_&]:top-1.5',
      '[[data-sidebar=menu-button][data-size=lg]~*_&]:top-2.5',
      'group-data-[collapsible=icon]:hidden',
      this.showOnHover &&
        'group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0',
      this.authorClasses,
    )
  }
}

@customElement({ name: 'ui-sidebar-menu-badge', template: '<au-slot></au-slot>' })
export class UiSidebarMenuBadge {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-menu-badge')
    this.host.setAttribute('data-sidebar', 'menu-badge')
    this.host.className = cn(
      'pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none',
      'group-hover/menu-item:text-sidebar-accent-foreground',
      '[[data-sidebar=menu-button][data-size=sm]~&]:top-1',
      '[[data-sidebar=menu-button][data-size=default]~&]:top-1.5',
      '[[data-sidebar=menu-button][data-size=lg]~&]:top-2.5',
      'group-data-[collapsible=icon]:hidden',
      author,
    )
  }
}

const MENU_SKELETON_TEMPLATE = `
<ui-skeleton if.bind="showIcon" class="size-4 rounded-md" data-sidebar="menu-skeleton-icon"></ui-skeleton>
<ui-skeleton class="h-4 max-w-(--skeleton-width) flex-1" data-sidebar="menu-skeleton-text"></ui-skeleton>
`

@customElement({ name: 'ui-sidebar-menu-skeleton', template: MENU_SKELETON_TEMPLATE, dependencies: [UiSkeleton] })
export class UiSidebarMenuSkeleton {
  @bindable() showIcon = false

  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-menu-skeleton')
    this.host.setAttribute('data-sidebar', 'menu-skeleton')
    // random width between 50% and 90%
    this.host.style.setProperty('--skeleton-width', `${Math.floor(Math.random() * 40) + 50}%`)
    this.host.className = cn('flex h-8 items-center gap-2 rounded-md px-2', author)
  }
}

@customElement({ name: 'ui-sidebar-menu-sub', template: '<au-slot></au-slot>' })
export class UiSidebarMenuSub {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-menu-sub')
    this.host.setAttribute('data-sidebar', 'menu-sub')
    this.host.setAttribute('role', 'list')
    this.host.className = cn(
      'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
      'group-data-[collapsible=icon]:hidden',
      author,
    )
  }
}

@customElement({ name: 'ui-sidebar-menu-sub-item', template: '<au-slot></au-slot>' })
export class UiSidebarMenuSubItem {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'sidebar-menu-sub-item')
    this.host.setAttribute('data-sidebar', 'menu-sub-item')
    this.host.setAttribute('role', 'listitem')
    this.host.className = cn('group/menu-sub-item relative block', author)
  }
}

const MENU_SUB_BUTTON_TEMPLATE = `
<a ref="anchor" data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button"
   data-size.bind="size" data-active.bind="isActive" class.bind="classes"><au-slot></au-slot></a>
`

@customElement({ name: 'ui-sidebar-menu-sub-button', template: MENU_SUB_BUTTON_TEMPLATE })
export class UiSidebarMenuSubButton {
  @bindable() size: 'sm' | 'md' = 'md'
  @bindable() isActive = false

  anchor!: HTMLAnchorElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    // `href` clashes with the router's custom attribute; read it as a plain attribute
    const href = this.host.getAttribute('href')
    if (href) this.anchor.setAttribute('href', href)
  }

  get classes(): string {
    return cn(
      'flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground',
      'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
      this.size === 'sm' && 'text-xs',
      this.size === 'md' && 'text-sm',
      'group-data-[collapsible=icon]:hidden',
      this.authorClasses,
    )
  }
}
