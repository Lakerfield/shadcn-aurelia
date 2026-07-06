import { customElement } from 'aurelia'
import { UiRadioGroup, UiRadioGroupItem } from '@/registry/default/ui/radio-group'

const TEMPLATE = `
<div class="flex flex-col items-start gap-3">
  <ui-radio-group value.two-way="plan">
    <ui-radio-group-item value="free">Free — €0/mo</ui-radio-group-item>
    <ui-radio-group-item value="pro">Pro — €12/mo</ui-radio-group-item>
    <ui-radio-group-item value="team" disabled.bind="true">Team (coming soon)</ui-radio-group-item>
  </ui-radio-group>
  <p class="text-muted-foreground text-sm">Selected plan: \${plan}</p>
</div>
`

@customElement({
  name: 'radio-group-controlled',
  template: TEMPLATE,
  dependencies: [UiRadioGroup, UiRadioGroupItem],
})
export class RadioGroupControlled {
  plan = 'pro'
}
