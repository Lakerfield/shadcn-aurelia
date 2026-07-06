import { customElement } from 'aurelia'
import {
  UiAccordion,
  UiAccordionItem,
  UiAccordionTrigger,
  UiAccordionContent,
} from '@/registry/default/ui/accordion'

const TEMPLATE = `
<ui-accordion collapsible.bind="true" value.bind="['item-1']" class="w-full max-w-md">
  <ui-accordion-item value="item-1">
    <ui-accordion-trigger>Is it accessible?</ui-accordion-trigger>
    <ui-accordion-content>
      Yes. It follows the WAI-ARIA accordion pattern via the Zag state machine.
    </ui-accordion-content>
  </ui-accordion-item>
  <ui-accordion-item value="item-2">
    <ui-accordion-trigger>Is it styled?</ui-accordion-trigger>
    <ui-accordion-content>
      Yes. It ships with shadcn's default styles — customize freely.
    </ui-accordion-content>
  </ui-accordion-item>
  <ui-accordion-item value="item-3">
    <ui-accordion-trigger>Is it animated?</ui-accordion-trigger>
    <ui-accordion-content>
      Yes, height animations driven by data-state and the --height variable.
    </ui-accordion-content>
  </ui-accordion-item>
</ui-accordion>
`

@customElement({
  name: 'accordion-demo',
  template: TEMPLATE,
  dependencies: [UiAccordion, UiAccordionItem, UiAccordionTrigger, UiAccordionContent],
})
export class AccordionDemo {}
