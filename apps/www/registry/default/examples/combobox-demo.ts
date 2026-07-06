import { customElement } from 'aurelia'
import {
  UiCombobox,
  UiComboboxControl,
  UiComboboxContent,
  UiComboboxItem,
} from '@/registry/default/ui/combobox'

const TEMPLATE = `
<ui-combobox value.two-way="framework" placeholder="Search framework…">
  <ui-combobox-control class="w-[220px]"></ui-combobox-control>
  <ui-combobox-content>
    <ui-combobox-item repeat.for="fw of frameworks" value.bind="fw.value" label.bind="fw.label">\${fw.label}</ui-combobox-item>
  </ui-combobox-content>
</ui-combobox>
<p class="text-muted-foreground mt-4 text-sm">Selected: \${framework || '—'}</p>
`

@customElement({
  name: 'combobox-demo',
  template: TEMPLATE,
  dependencies: [UiCombobox, UiComboboxControl, UiComboboxContent, UiComboboxItem],
})
export class ComboboxDemo {
  framework = ''
  frameworks = [
    { value: 'aurelia', label: 'Aurelia' },
    { value: 'next.js', label: 'Next.js' },
    { value: 'sveltekit', label: 'SvelteKit' },
    { value: 'nuxt.js', label: 'Nuxt.js' },
    { value: 'remix', label: 'Remix' },
    { value: 'astro', label: 'Astro' },
  ]
}
