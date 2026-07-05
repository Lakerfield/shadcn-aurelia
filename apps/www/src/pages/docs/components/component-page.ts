import type { IRouteViewModel, Params } from '@aurelia/router'
import { getComponentDoc, type ComponentDoc } from '../../../lib/component-docs'

export class ComponentPage implements IRouteViewModel {
  doc: ComponentDoc | null = null

  canLoad(params: Params): boolean | string {
    this.doc = getComponentDoc(params.name ?? '')
    return this.doc ? true : '../components/button'
  }
}
