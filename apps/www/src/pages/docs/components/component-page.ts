import type { IRouteViewModel, Params } from '@aurelia/router'
import { componentDocs, getComponentDoc, type ComponentDoc } from '../../../lib/component-docs'

export class ComponentPage implements IRouteViewModel {
  doc: ComponentDoc | null = null

  canLoad(params: Params): boolean | string {
    this.doc = getComponentDoc(params.name ?? '')
    // the redirect instruction resolves against the root routing context
    return this.doc ? true : `docs/components/${componentDocs[0].name}`
  }
}
