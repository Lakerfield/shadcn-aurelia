/**
 * Behavior facades — one factory per interactive behavior. Engine v1 is Zag;
 * Phase 7 swaps these for native implementations behind the same signatures.
 */
import * as accordion from '@zag-js/accordion'
import * as checkbox from '@zag-js/checkbox'
import * as collapsible from '@zag-js/collapsible'
import * as pinInput from '@zag-js/pin-input'
import * as progress from '@zag-js/progress'
import * as radioGroup from '@zag-js/radio-group'
import * as slider from '@zag-js/slider'
import * as switchNs from '@zag-js/switch'
import * as tabs from '@zag-js/tabs'
import * as toggleGroup from '@zag-js/toggle-group'
import { ZagBehavior } from '../adapter/zag-behavior'

export type AccordionApi = ReturnType<typeof accordion.connect>
export const createAccordionBehavior = (): ZagBehavior<AccordionApi> =>
  new ZagBehavior<AccordionApi>(accordion.machine, accordion.connect)

export type CheckboxApi = ReturnType<typeof checkbox.connect>
export const createCheckboxBehavior = (): ZagBehavior<CheckboxApi> =>
  new ZagBehavior<CheckboxApi>(checkbox.machine, checkbox.connect)

export type CollapsibleApi = ReturnType<typeof collapsible.connect>
export const createCollapsibleBehavior = (): ZagBehavior<CollapsibleApi> =>
  new ZagBehavior<CollapsibleApi>(collapsible.machine, collapsible.connect)

export type PinInputApi = ReturnType<typeof pinInput.connect>
export const createPinInputBehavior = (): ZagBehavior<PinInputApi> =>
  new ZagBehavior<PinInputApi>(pinInput.machine, pinInput.connect)

export type ProgressApi = ReturnType<typeof progress.connect>
export const createProgressBehavior = (): ZagBehavior<ProgressApi> =>
  new ZagBehavior<ProgressApi>(progress.machine, progress.connect)

export type RadioGroupApi = ReturnType<typeof radioGroup.connect>
export const createRadioGroupBehavior = (): ZagBehavior<RadioGroupApi> =>
  new ZagBehavior<RadioGroupApi>(radioGroup.machine, radioGroup.connect)

export type SliderApi = ReturnType<typeof slider.connect>
export const createSliderBehavior = (): ZagBehavior<SliderApi> =>
  new ZagBehavior<SliderApi>(slider.machine, slider.connect)

export type SwitchApi = ReturnType<typeof switchNs.connect>
export const createSwitchBehavior = (): ZagBehavior<SwitchApi> =>
  new ZagBehavior<SwitchApi>(switchNs.machine, switchNs.connect)

export type TabsApi = ReturnType<typeof tabs.connect>
export const createTabsBehavior = (): ZagBehavior<TabsApi> =>
  new ZagBehavior<TabsApi>(tabs.machine, tabs.connect)

export type ToggleGroupApi = ReturnType<typeof toggleGroup.connect>
export const createToggleGroupBehavior = (): ZagBehavior<ToggleGroupApi> =>
  new ZagBehavior<ToggleGroupApi>(toggleGroup.machine, toggleGroup.connect)
