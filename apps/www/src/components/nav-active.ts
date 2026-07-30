import { customAttribute, resolve, INode, type IDisposable } from 'aurelia'
import { IRouterEvents } from '@aurelia/router'

/**
 * Toggles the `active` class on the host by matching the current path.
 * The router's `activeClass` option misses links that bind during the initial
 * navigation (the pending-navigation guard leaves their instruction null), so
 * navigation links match on the URL instead.
 *
 *   <a load="components/button" nav-active="docs/components/button">   exact
 *   <a load="route: docs" nav-active="docs*">                          prefix
 */
@customAttribute('nav-active')
export class NavActive {
  value = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly events: IRouterEvents = resolve(IRouterEvents)
  private sub: IDisposable | null = null

  binding(): void {
    this.update()
    this.sub = this.events.subscribe('au:router:navigation-end', () => this.update())
  }

  valueChanged(): void {
    this.update()
  }

  detaching(): void {
    this.sub?.dispose()
    this.sub = null
  }

  private update(): void {
    const base = new URL(document.baseURI).pathname.replace(/\/$/, '')
    let path = location.pathname
    if (base !== '' && path.startsWith(base)) path = path.slice(base.length)
    path = path.replace(/^\//, '').replace(/\/$/, '')
    const target = this.value.replace(/^\//, '')
    const active = target.endsWith('*')
      ? path === target.slice(0, -1).replace(/\/$/, '') || path.startsWith(target.slice(0, -1))
      : path === target
    this.host.classList.toggle('active', active)
  }
}
