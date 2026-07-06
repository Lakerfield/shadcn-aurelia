import { customElement } from 'aurelia'
import {
  UiAccordion,
  UiAccordionItem,
  UiAccordionTrigger,
  UiAccordionContent,
} from '@/registry/default/ui/accordion'

const TEMPLATE = `
<ui-accordion type="multiple" class="w-full max-w-md">
  <ui-accordion-item value="shipping">
    <ui-accordion-trigger>Shipping</ui-accordion-trigger>
    <ui-accordion-content>Free shipping on orders over €50.</ui-accordion-content>
  </ui-accordion-item>
  <ui-accordion-item value="returns">
    <ui-accordion-trigger>Returns</ui-accordion-trigger>
    <ui-accordion-content>30-day return policy, no questions asked.</ui-accordion-content>
  </ui-accordion-item>
</ui-accordion>
`

@customElement({
  name: 'accordion-multiple',
  template: TEMPLATE,
  dependencies: [UiAccordion, UiAccordionItem, UiAccordionTrigger, UiAccordionContent],
})
export class AccordionMultiple {}
