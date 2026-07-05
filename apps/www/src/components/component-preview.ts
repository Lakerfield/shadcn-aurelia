import { bindable } from 'aurelia'

export class ComponentPreview {
  @bindable() code = ''

  tab: 'preview' | 'code' = 'preview'

  setTab(tab: 'preview' | 'code'): void {
    this.tab = tab
  }
}
