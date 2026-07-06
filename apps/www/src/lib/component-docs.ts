/**
 * Docs index — drives the sidebar and the dynamic component page.
 * One entry per component; examples render via au-compose with ?raw sources.
 */
import { AlertDemo } from '@/registry/default/examples/alert-demo'
import alertDemoSource from '@/registry/default/examples/alert-demo.ts?raw'
import { AlertDestructive } from '@/registry/default/examples/alert-destructive'
import alertDestructiveSource from '@/registry/default/examples/alert-destructive.ts?raw'
import { AspectRatioDemo } from '@/registry/default/examples/aspect-ratio-demo'
import aspectRatioDemoSource from '@/registry/default/examples/aspect-ratio-demo.ts?raw'
import { AspectRatioSquare } from '@/registry/default/examples/aspect-ratio-square'
import aspectRatioSquareSource from '@/registry/default/examples/aspect-ratio-square.ts?raw'
import { AvatarDemo } from '@/registry/default/examples/avatar-demo'
import avatarDemoSource from '@/registry/default/examples/avatar-demo.ts?raw'
import { AvatarFallbackDemo } from '@/registry/default/examples/avatar-fallback'
import avatarFallbackSource from '@/registry/default/examples/avatar-fallback.ts?raw'
import { BadgeDemo } from '@/registry/default/examples/badge-demo'
import badgeDemoSource from '@/registry/default/examples/badge-demo.ts?raw'
import { BadgeCustom } from '@/registry/default/examples/badge-custom'
import badgeCustomSource from '@/registry/default/examples/badge-custom.ts?raw'
import { BreadcrumbDemo } from '@/registry/default/examples/breadcrumb-demo'
import breadcrumbDemoSource from '@/registry/default/examples/breadcrumb-demo.ts?raw'
import { BreadcrumbEllipsis } from '@/registry/default/examples/breadcrumb-ellipsis'
import breadcrumbEllipsisSource from '@/registry/default/examples/breadcrumb-ellipsis.ts?raw'
import { ButtonDemo } from '@/registry/default/examples/button-demo'
import buttonDemoSource from '@/registry/default/examples/button-demo.ts?raw'
import { ButtonVariantsExample } from '@/registry/default/examples/button-variants'
import buttonVariantsSource from '@/registry/default/examples/button-variants.ts?raw'
import { ButtonGroupDemo } from '@/registry/default/examples/button-group-demo'
import buttonGroupDemoSource from '@/registry/default/examples/button-group-demo.ts?raw'
import { ButtonGroupNested } from '@/registry/default/examples/button-group-nested'
import buttonGroupNestedSource from '@/registry/default/examples/button-group-nested.ts?raw'
import { CardDemo } from '@/registry/default/examples/card-demo'
import cardDemoSource from '@/registry/default/examples/card-demo.ts?raw'
import { CardSimple } from '@/registry/default/examples/card-simple'
import cardSimpleSource from '@/registry/default/examples/card-simple.ts?raw'
import { EmptyDemo } from '@/registry/default/examples/empty-demo'
import emptyDemoSource from '@/registry/default/examples/empty-demo.ts?raw'
import { EmptyPlain } from '@/registry/default/examples/empty-plain'
import emptyPlainSource from '@/registry/default/examples/empty-plain.ts?raw'
import { InputDemo } from '@/registry/default/examples/input-demo'
import inputDemoSource from '@/registry/default/examples/input-demo.ts?raw'
import { InputForm } from '@/registry/default/examples/input-form'
import inputFormSource from '@/registry/default/examples/input-form.ts?raw'
import { InputGroupDemo } from '@/registry/default/examples/input-group-demo'
import inputGroupDemoSource from '@/registry/default/examples/input-group-demo.ts?raw'
import { InputGroupKbd } from '@/registry/default/examples/input-group-kbd'
import inputGroupKbdSource from '@/registry/default/examples/input-group-kbd.ts?raw'
import { ItemDemo } from '@/registry/default/examples/item-demo'
import itemDemoSource from '@/registry/default/examples/item-demo.ts?raw'
import { ItemGroupDemo } from '@/registry/default/examples/item-group'
import itemGroupSource from '@/registry/default/examples/item-group.ts?raw'
import { KbdDemo } from '@/registry/default/examples/kbd-demo'
import kbdDemoSource from '@/registry/default/examples/kbd-demo.ts?raw'
import { KbdInline } from '@/registry/default/examples/kbd-inline'
import kbdInlineSource from '@/registry/default/examples/kbd-inline.ts?raw'
import { LabelDemo } from '@/registry/default/examples/label-demo'
import labelDemoSource from '@/registry/default/examples/label-demo.ts?raw'
import { LabelCheckbox } from '@/registry/default/examples/label-checkbox'
import labelCheckboxSource from '@/registry/default/examples/label-checkbox.ts?raw'
import { NativeSelectDemo } from '@/registry/default/examples/native-select-demo'
import nativeSelectDemoSource from '@/registry/default/examples/native-select-demo.ts?raw'
import { NativeSelectLabel } from '@/registry/default/examples/native-select-label'
import nativeSelectLabelSource from '@/registry/default/examples/native-select-label.ts?raw'
import { SeparatorDemo } from '@/registry/default/examples/separator-demo'
import separatorDemoSource from '@/registry/default/examples/separator-demo.ts?raw'
import { SeparatorSemantic } from '@/registry/default/examples/separator-semantic'
import separatorSemanticSource from '@/registry/default/examples/separator-semantic.ts?raw'
import { SkeletonDemo } from '@/registry/default/examples/skeleton-demo'
import skeletonDemoSource from '@/registry/default/examples/skeleton-demo.ts?raw'
import { SkeletonCard } from '@/registry/default/examples/skeleton-card'
import skeletonCardSource from '@/registry/default/examples/skeleton-card.ts?raw'
import { SpinnerDemo } from '@/registry/default/examples/spinner-demo'
import spinnerDemoSource from '@/registry/default/examples/spinner-demo.ts?raw'
import { SpinnerButton } from '@/registry/default/examples/spinner-button'
import spinnerButtonSource from '@/registry/default/examples/spinner-button.ts?raw'
import { TableDemo } from '@/registry/default/examples/table-demo'
import tableDemoSource from '@/registry/default/examples/table-demo.ts?raw'
import { TableFooterDemo } from '@/registry/default/examples/table-footer'
import tableFooterSource from '@/registry/default/examples/table-footer.ts?raw'
import { TextareaDemo } from '@/registry/default/examples/textarea-demo'
import textareaDemoSource from '@/registry/default/examples/textarea-demo.ts?raw'
import { TextareaLabel } from '@/registry/default/examples/textarea-label'
import textareaLabelSource from '@/registry/default/examples/textarea-label.ts?raw'
import { TooltipDemo } from '@/registry/default/examples/tooltip-demo'
import tooltipDemoSource from '@/registry/default/examples/tooltip-demo.ts?raw'
import { TypographyDemo } from '@/registry/default/examples/typography-demo'
import typographyDemoSource from '@/registry/default/examples/typography-demo.ts?raw'

import { AccordionDemo } from '@/registry/default/examples/accordion-demo'
import accordionDemoSource from '@/registry/default/examples/accordion-demo.ts?raw'
import { AccordionMultiple } from '@/registry/default/examples/accordion-multiple'
import accordionMultipleSource from '@/registry/default/examples/accordion-multiple.ts?raw'
import { CheckboxDemo } from '@/registry/default/examples/checkbox-demo'
import checkboxDemoSource from '@/registry/default/examples/checkbox-demo.ts?raw'
import { CheckboxControlled } from '@/registry/default/examples/checkbox-controlled'
import checkboxControlledSource from '@/registry/default/examples/checkbox-controlled.ts?raw'
import { CollapsibleDemo } from '@/registry/default/examples/collapsible-demo'
import collapsibleDemoSource from '@/registry/default/examples/collapsible-demo.ts?raw'
import { CollapsibleControlled } from '@/registry/default/examples/collapsible-controlled'
import collapsibleControlledSource from '@/registry/default/examples/collapsible-controlled.ts?raw'
import { InputOtpDemo } from '@/registry/default/examples/input-otp-demo'
import inputOtpDemoSource from '@/registry/default/examples/input-otp-demo.ts?raw'
import { InputOtpControlled } from '@/registry/default/examples/input-otp-controlled'
import inputOtpControlledSource from '@/registry/default/examples/input-otp-controlled.ts?raw'
import { PaginationDemo } from '@/registry/default/examples/pagination-demo'
import paginationDemoSource from '@/registry/default/examples/pagination-demo.ts?raw'
import { PaginationInteractive } from '@/registry/default/examples/pagination-interactive'
import paginationInteractiveSource from '@/registry/default/examples/pagination-interactive.ts?raw'
import { ProgressDemo } from '@/registry/default/examples/progress-demo'
import progressDemoSource from '@/registry/default/examples/progress-demo.ts?raw'
import { ProgressLive } from '@/registry/default/examples/progress-live'
import progressLiveSource from '@/registry/default/examples/progress-live.ts?raw'
import { RadioGroupDemo } from '@/registry/default/examples/radio-group-demo'
import radioGroupDemoSource from '@/registry/default/examples/radio-group-demo.ts?raw'
import { RadioGroupControlled } from '@/registry/default/examples/radio-group-controlled'
import radioGroupControlledSource from '@/registry/default/examples/radio-group-controlled.ts?raw'
import { SliderDemo } from '@/registry/default/examples/slider-demo'
import sliderDemoSource from '@/registry/default/examples/slider-demo.ts?raw'
import { SliderRange } from '@/registry/default/examples/slider-range'
import sliderRangeSource from '@/registry/default/examples/slider-range.ts?raw'
import { SwitchDemo } from '@/registry/default/examples/switch-demo'
import switchDemoSource from '@/registry/default/examples/switch-demo.ts?raw'
import { SwitchControlled } from '@/registry/default/examples/switch-controlled'
import switchControlledSource from '@/registry/default/examples/switch-controlled.ts?raw'
import { TabsDemo } from '@/registry/default/examples/tabs-demo'
import tabsDemoSource from '@/registry/default/examples/tabs-demo.ts?raw'
import { TabsControlled } from '@/registry/default/examples/tabs-controlled'
import tabsControlledSource from '@/registry/default/examples/tabs-controlled.ts?raw'
import { ToggleDemo } from '@/registry/default/examples/toggle-demo'
import toggleDemoSource from '@/registry/default/examples/toggle-demo.ts?raw'
import { ToggleVariantsDemo } from '@/registry/default/examples/toggle-variants'
import toggleVariantsDemoSource from '@/registry/default/examples/toggle-variants.ts?raw'
import { ToggleGroupDemo } from '@/registry/default/examples/toggle-group-demo'
import toggleGroupDemoSource from '@/registry/default/examples/toggle-group-demo.ts?raw'
import { ToggleGroupSingle } from '@/registry/default/examples/toggle-group-single'
import toggleGroupSingleSource from '@/registry/default/examples/toggle-group-single.ts?raw'

import { DialogDemo } from '@/registry/default/examples/dialog-demo'
import dialogDemoSource from '@/registry/default/examples/dialog-demo.ts?raw'
import { DialogControlled } from '@/registry/default/examples/dialog-controlled'
import dialogControlledSource from '@/registry/default/examples/dialog-controlled.ts?raw'
import { AlertDialogDemo } from '@/registry/default/examples/alert-dialog-demo'
import alertDialogDemoSource from '@/registry/default/examples/alert-dialog-demo.ts?raw'
import { AlertDialogDestructive } from '@/registry/default/examples/alert-dialog-destructive'
import alertDialogDestructiveSource from '@/registry/default/examples/alert-dialog-destructive.ts?raw'
import { SheetDemo } from '@/registry/default/examples/sheet-demo'
import sheetDemoSource from '@/registry/default/examples/sheet-demo.ts?raw'
import { SheetSides } from '@/registry/default/examples/sheet-sides'
import sheetSidesSource from '@/registry/default/examples/sheet-sides.ts?raw'
import { PopoverDemo } from '@/registry/default/examples/popover-demo'
import popoverDemoSource from '@/registry/default/examples/popover-demo.ts?raw'
import { PopoverControlled } from '@/registry/default/examples/popover-controlled'
import popoverControlledSource from '@/registry/default/examples/popover-controlled.ts?raw'
import { HoverCardDemo } from '@/registry/default/examples/hover-card-demo'
import hoverCardDemoSource from '@/registry/default/examples/hover-card-demo.ts?raw'
import { TooltipControlled } from '@/registry/default/examples/tooltip-controlled'
import tooltipControlledSource from '@/registry/default/examples/tooltip-controlled.ts?raw'

export interface ComponentExample {
  title: string
  component: unknown
  source: string
}

export interface ComponentDoc {
  name: string
  title: string
  description: string
  examples: ComponentExample[]
}

export const componentDocs: ComponentDoc[] = [
  {
    name: 'accordion',
    title: 'Accordion',
    description: 'A vertically stacked set of interactive headings that each reveal a section of content.',
    examples: [
      { title: 'Default', component: AccordionDemo, source: accordionDemoSource },
      { title: 'Multiple', component: AccordionMultiple, source: accordionMultipleSource },
    ],
  },
  {
    name: 'alert',
    title: 'Alert',
    description: 'Displays a callout for user attention.',
    examples: [
      { title: 'Default', component: AlertDemo, source: alertDemoSource },
      { title: 'Destructive', component: AlertDestructive, source: alertDestructiveSource },
    ],
  },
  {
    name: 'alert-dialog',
    title: 'Alert Dialog',
    description: 'A modal dialog that interrupts the user with important content and expects a response.',
    examples: [
      { title: 'Default', component: AlertDialogDemo, source: alertDialogDemoSource },
      { title: 'Destructive', component: AlertDialogDestructive, source: alertDialogDestructiveSource },
    ],
  },
  {
    name: 'aspect-ratio',
    title: 'Aspect Ratio',
    description: 'Displays content within a desired ratio.',
    examples: [
      { title: 'Image', component: AspectRatioDemo, source: aspectRatioDemoSource },
      { title: 'Ratios', component: AspectRatioSquare, source: aspectRatioSquareSource },
    ],
  },
  {
    name: 'avatar',
    title: 'Avatar',
    description: 'An image element with a fallback for representing the user.',
    examples: [
      { title: 'Default', component: AvatarDemo, source: avatarDemoSource },
      { title: 'Fallback', component: AvatarFallbackDemo, source: avatarFallbackSource },
    ],
  },
  {
    name: 'badge',
    title: 'Badge',
    description: 'Displays a badge or a component that looks like a badge.',
    examples: [
      { title: 'Variants', component: BadgeDemo, source: badgeDemoSource },
      { title: 'Custom', component: BadgeCustom, source: badgeCustomSource },
    ],
  },
  {
    name: 'breadcrumb',
    title: 'Breadcrumb',
    description: 'Displays the path to the current resource using a hierarchy of links.',
    examples: [
      { title: 'Default', component: BreadcrumbDemo, source: breadcrumbDemoSource },
      { title: 'Ellipsis', component: BreadcrumbEllipsis, source: breadcrumbEllipsisSource },
    ],
  },
  {
    name: 'button',
    title: 'Button',
    description: 'Displays a button or a component that looks like a button.',
    examples: [
      { title: 'Default', component: ButtonDemo, source: buttonDemoSource },
      { title: 'Variants', component: ButtonVariantsExample, source: buttonVariantsSource },
    ],
  },
  {
    name: 'button-group',
    title: 'Button Group',
    description: 'Groups related buttons and controls with collapsed borders.',
    examples: [
      { title: 'Default', component: ButtonGroupDemo, source: buttonGroupDemoSource },
      { title: 'Composed', component: ButtonGroupNested, source: buttonGroupNestedSource },
    ],
  },
  {
    name: 'card',
    title: 'Card',
    description: 'Displays a card with header, content, and footer.',
    examples: [
      { title: 'Default', component: CardDemo, source: cardDemoSource },
      { title: 'Simple', component: CardSimple, source: cardSimpleSource },
    ],
  },
  {
    name: 'checkbox',
    title: 'Checkbox',
    description: 'A control that allows the user to toggle between checked and not checked.',
    examples: [
      { title: 'Default', component: CheckboxDemo, source: checkboxDemoSource },
      { title: 'Controlled', component: CheckboxControlled, source: checkboxControlledSource },
    ],
  },
  {
    name: 'collapsible',
    title: 'Collapsible',
    description: 'An interactive component which expands/collapses a panel.',
    examples: [
      { title: 'Default', component: CollapsibleDemo, source: collapsibleDemoSource },
      { title: 'Controlled', component: CollapsibleControlled, source: collapsibleControlledSource },
    ],
  },
  {
    name: 'dialog',
    title: 'Dialog',
    description: 'A window overlaid on the primary content, rendering the content underneath inert.',
    examples: [
      { title: 'Default', component: DialogDemo, source: dialogDemoSource },
      { title: 'Controlled', component: DialogControlled, source: dialogControlledSource },
    ],
  },
  {
    name: 'empty',
    title: 'Empty',
    description: 'Displays an empty state with optional media, title, description and actions.',
    examples: [
      { title: 'Default', component: EmptyDemo, source: emptyDemoSource },
      { title: 'Plain', component: EmptyPlain, source: emptyPlainSource },
    ],
  },
  {
    name: 'hover-card',
    title: 'Hover Card',
    description: 'For sighted users to preview content available behind a link.',
    examples: [{ title: 'Default', component: HoverCardDemo, source: hoverCardDemoSource }],
  },
  {
    name: 'input',
    title: 'Input',
    description: 'Displays a form input field or a component that looks like an input field.',
    examples: [
      { title: 'Default', component: InputDemo, source: inputDemoSource },
      { title: 'Form', component: InputForm, source: inputFormSource },
    ],
  },
  {
    name: 'input-group',
    title: 'Input Group',
    description: 'Composes an input with icons, buttons or keyboard hints.',
    examples: [
      { title: 'With icon', component: InputGroupDemo, source: inputGroupDemoSource },
      { title: 'With kbd', component: InputGroupKbd, source: inputGroupKbdSource },
    ],
  },
  {
    name: 'input-otp',
    title: 'Input OTP',
    description: 'Accessible one-time-password input with copy-paste functionality.',
    examples: [
      { title: 'Default', component: InputOtpDemo, source: inputOtpDemoSource },
      { title: 'Controlled', component: InputOtpControlled, source: inputOtpControlledSource },
    ],
  },
  {
    name: 'item',
    title: 'Item',
    description: 'A flexible list-item with media, content and actions.',
    examples: [
      { title: 'Default', component: ItemDemo, source: itemDemoSource },
      { title: 'Group', component: ItemGroupDemo, source: itemGroupSource },
    ],
  },
  {
    name: 'kbd',
    title: 'Kbd',
    description: 'Displays keyboard keys and shortcuts.',
    examples: [
      { title: 'Default', component: KbdDemo, source: kbdDemoSource },
      { title: 'Inline', component: KbdInline, source: kbdInlineSource },
    ],
  },
  {
    name: 'label',
    title: 'Label',
    description: 'Renders an accessible label associated with a control.',
    examples: [
      { title: 'Default', component: LabelDemo, source: labelDemoSource },
      { title: 'With checkbox', component: LabelCheckbox, source: labelCheckboxSource },
    ],
  },
  {
    name: 'native-select',
    title: 'Native Select',
    description: 'A styled native <select> element — as a custom attribute, so options stay native.',
    examples: [
      { title: 'Default', component: NativeSelectDemo, source: nativeSelectDemoSource },
      { title: 'With label', component: NativeSelectLabel, source: nativeSelectLabelSource },
    ],
  },
  {
    name: 'pagination',
    title: 'Pagination',
    description: 'Pagination with page navigation, next and previous links.',
    examples: [
      { title: 'Default', component: PaginationDemo, source: paginationDemoSource },
      { title: 'Interactive', component: PaginationInteractive, source: paginationInteractiveSource },
    ],
  },
  {
    name: 'popover',
    title: 'Popover',
    description: 'Displays rich content in a portal, triggered by a button.',
    examples: [
      { title: 'Default', component: PopoverDemo, source: popoverDemoSource },
      { title: 'Controlled', component: PopoverControlled, source: popoverControlledSource },
    ],
  },
  {
    name: 'progress',
    title: 'Progress',
    description: 'Displays an indicator showing the completion progress of a task.',
    examples: [
      { title: 'Default', component: ProgressDemo, source: progressDemoSource },
      { title: 'Live', component: ProgressLive, source: progressLiveSource },
    ],
  },
  {
    name: 'radio-group',
    title: 'Radio Group',
    description: 'A set of checkable buttons where no more than one can be checked at a time.',
    examples: [
      { title: 'Default', component: RadioGroupDemo, source: radioGroupDemoSource },
      { title: 'Controlled', component: RadioGroupControlled, source: radioGroupControlledSource },
    ],
  },
  {
    name: 'separator',
    title: 'Separator',
    description: 'Visually or semantically separates content.',
    examples: [
      { title: 'Default', component: SeparatorDemo, source: separatorDemoSource },
      { title: 'Semantic', component: SeparatorSemantic, source: separatorSemanticSource },
    ],
  },
  {
    name: 'sheet',
    title: 'Sheet',
    description: 'Extends the dialog to display content that complements the main content of the screen.',
    examples: [
      { title: 'Default', component: SheetDemo, source: sheetDemoSource },
      { title: 'Sides', component: SheetSides, source: sheetSidesSource },
    ],
  },
  {
    name: 'skeleton',
    title: 'Skeleton',
    description: 'Use to show a placeholder while content is loading.',
    examples: [
      { title: 'Default', component: SkeletonDemo, source: skeletonDemoSource },
      { title: 'Card', component: SkeletonCard, source: skeletonCardSource },
    ],
  },
  {
    name: 'slider',
    title: 'Slider',
    description: 'An input where the user selects a value from within a given range.',
    examples: [
      { title: 'Default', component: SliderDemo, source: sliderDemoSource },
      { title: 'Range', component: SliderRange, source: sliderRangeSource },
    ],
  },
  {
    name: 'spinner',
    title: 'Spinner',
    description: 'An indicator showing an in-progress operation.',
    examples: [
      { title: 'Sizes', component: SpinnerDemo, source: spinnerDemoSource },
      { title: 'In a button', component: SpinnerButton, source: spinnerButtonSource },
    ],
  },
  {
    name: 'switch',
    title: 'Switch',
    description: 'A control that allows the user to toggle between on and off.',
    examples: [
      { title: 'Default', component: SwitchDemo, source: switchDemoSource },
      { title: 'Controlled', component: SwitchControlled, source: switchControlledSource },
    ],
  },
  {
    name: 'table',
    title: 'Table',
    description: 'A responsive table — parts are attributes on native table elements.',
    examples: [
      { title: 'Default', component: TableDemo, source: tableDemoSource },
      { title: 'With footer', component: TableFooterDemo, source: tableFooterSource },
    ],
  },
  {
    name: 'tabs',
    title: 'Tabs',
    description: 'A set of layered sections of content displayed one at a time.',
    examples: [
      { title: 'Default', component: TabsDemo, source: tabsDemoSource },
      { title: 'Controlled', component: TabsControlled, source: tabsControlledSource },
    ],
  },
  {
    name: 'textarea',
    title: 'Textarea',
    description: 'Displays a form textarea or a component that looks like a textarea.',
    examples: [
      { title: 'Default', component: TextareaDemo, source: textareaDemoSource },
      { title: 'With label', component: TextareaLabel, source: textareaLabelSource },
    ],
  },
  {
    name: 'toggle',
    title: 'Toggle',
    description: 'A two-state button that can be either on or off.',
    examples: [
      { title: 'Default', component: ToggleDemo, source: toggleDemoSource },
      { title: 'Variants', component: ToggleVariantsDemo, source: toggleVariantsDemoSource },
    ],
  },
  {
    name: 'toggle-group',
    title: 'Toggle Group',
    description: 'A set of two-state buttons that can be toggled on or off.',
    examples: [
      { title: 'Multiple', component: ToggleGroupDemo, source: toggleGroupDemoSource },
      { title: 'Single', component: ToggleGroupSingle, source: toggleGroupSingleSource },
    ],
  },
  {
    name: 'tooltip',
    title: 'Tooltip',
    description:
      'A popup that displays information related to an element when it receives keyboard focus or the mouse hovers over it.',
    examples: [
      { title: 'Default', component: TooltipDemo, source: tooltipDemoSource },
      { title: 'Controlled', component: TooltipControlled, source: tooltipControlledSource },
    ],
  },
  {
    name: 'typography',
    title: 'Typography',
    description: 'Styles for headings, paragraphs, lists — a class recipe, not a component.',
    examples: [{ title: 'Default', component: TypographyDemo, source: typographyDemoSource }],
  },
]

export function getComponentDoc(name: string): ComponentDoc | null {
  return componentDocs.find((d) => d.name === name) ?? null
}
