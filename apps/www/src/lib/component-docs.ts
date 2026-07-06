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
import { FieldDemo } from '@/registry/default/examples/field-demo'
import fieldDemoSource from '@/registry/default/examples/field-demo.ts?raw'
import { FieldChoiceCard } from '@/registry/default/examples/field-choice-card'
import fieldChoiceCardSource from '@/registry/default/examples/field-choice-card.ts?raw'
import { FormDemo } from '@/registry/default/examples/form-demo'
import formDemoSource from '@/registry/default/examples/form-demo.ts?raw'
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
import { SidebarDemo } from '@/registry/default/examples/sidebar-demo'
import sidebarDemoSource from '@/registry/default/examples/sidebar-demo.ts?raw'
import { SidebarIcon } from '@/registry/default/examples/sidebar-icon'
import sidebarIconSource from '@/registry/default/examples/sidebar-icon.ts?raw'
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
import { ChartDemo } from '@/registry/default/examples/chart-demo'
import chartDemoSource from '@/registry/default/examples/chart-demo.ts?raw'
import { ChartLine } from '@/registry/default/examples/chart-line'
import chartLineSource from '@/registry/default/examples/chart-line.ts?raw'
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
import { DropdownMenuDemo } from '@/registry/default/examples/dropdown-menu-demo'
import dropdownMenuDemoSource from '@/registry/default/examples/dropdown-menu-demo.ts?raw'
import { DropdownMenuCheckboxes } from '@/registry/default/examples/dropdown-menu-checkboxes'
import dropdownMenuCheckboxesSource from '@/registry/default/examples/dropdown-menu-checkboxes.ts?raw'
import { DropdownMenuRadioGroupDemo } from '@/registry/default/examples/dropdown-menu-radio-group'
import dropdownMenuRadioGroupSource from '@/registry/default/examples/dropdown-menu-radio-group.ts?raw'
import { ContextMenuDemo } from '@/registry/default/examples/context-menu-demo'
import contextMenuDemoSource from '@/registry/default/examples/context-menu-demo.ts?raw'
import { MenubarDemo } from '@/registry/default/examples/menubar-demo'
import menubarDemoSource from '@/registry/default/examples/menubar-demo.ts?raw'
import { ComboboxDemo } from '@/registry/default/examples/combobox-demo'
import comboboxDemoSource from '@/registry/default/examples/combobox-demo.ts?raw'
import { CommandDemo } from '@/registry/default/examples/command-demo'
import commandDemoSource from '@/registry/default/examples/command-demo.ts?raw'
import { NavigationMenuDemo } from '@/registry/default/examples/navigation-menu-demo'
import navigationMenuDemoSource from '@/registry/default/examples/navigation-menu-demo.ts?raw'
import { ResizableDemo } from '@/registry/default/examples/resizable-demo'
import resizableDemoSource from '@/registry/default/examples/resizable-demo.ts?raw'
import { ResizableHandleDemo } from '@/registry/default/examples/resizable-handle-demo'
import resizableHandleDemoSource from '@/registry/default/examples/resizable-handle-demo.ts?raw'
import { ScrollAreaDemo } from '@/registry/default/examples/scroll-area-demo'
import scrollAreaDemoSource from '@/registry/default/examples/scroll-area-demo.ts?raw'
import { ScrollAreaHorizontal } from '@/registry/default/examples/scroll-area-horizontal'
import scrollAreaHorizontalSource from '@/registry/default/examples/scroll-area-horizontal.ts?raw'
import { DirectionDemo } from '@/registry/default/examples/direction-demo'
import directionDemoSource from '@/registry/default/examples/direction-demo.ts?raw'
import { CalendarDemo } from '@/registry/default/examples/calendar-demo'
import calendarDemoSource from '@/registry/default/examples/calendar-demo.ts?raw'
import { DataTableDemo } from '@/registry/default/examples/data-table-demo'
import dataTableDemoSource from '@/registry/default/examples/data-table-demo.ts?raw'
import { DatePickerDemo } from '@/registry/default/examples/date-picker-demo'
import datePickerDemoSource from '@/registry/default/examples/date-picker-demo.ts?raw'
import { CarouselDemo } from '@/registry/default/examples/carousel-demo'
import carouselDemoSource from '@/registry/default/examples/carousel-demo.ts?raw'
import { CarouselMultiple } from '@/registry/default/examples/carousel-multiple'
import carouselMultipleSource from '@/registry/default/examples/carousel-multiple.ts?raw'
import { SonnerDemo } from '@/registry/default/examples/sonner-demo'
import sonnerDemoSource from '@/registry/default/examples/sonner-demo.ts?raw'
import { SelectDemo } from '@/registry/default/examples/select-demo'
import selectDemoSource from '@/registry/default/examples/select-demo.ts?raw'
import { SelectScrollable } from '@/registry/default/examples/select-scrollable'
import selectScrollableSource from '@/registry/default/examples/select-scrollable.ts?raw'

import { AttachmentDemo } from '@/registry/default/examples/attachment-demo'
import attachmentDemoSource from '@/registry/default/examples/attachment-demo.ts?raw'
import { AttachmentGroup } from '@/registry/default/examples/attachment-group'
import attachmentGroupSource from '@/registry/default/examples/attachment-group.ts?raw'
import { BubbleDemo } from '@/registry/default/examples/bubble-demo'
import bubbleDemoSource from '@/registry/default/examples/bubble-demo.ts?raw'
import { BubbleReactions } from '@/registry/default/examples/bubble-reactions'
import bubbleReactionsSource from '@/registry/default/examples/bubble-reactions.ts?raw'
import { MarkerDemo } from '@/registry/default/examples/marker-demo'
import markerDemoSource from '@/registry/default/examples/marker-demo.ts?raw'
import { MessageDemo } from '@/registry/default/examples/message-demo'
import messageDemoSource from '@/registry/default/examples/message-demo.ts?raw'
import { MessageScrollerDemo } from '@/registry/default/examples/message-scroller-demo'
import messageScrollerDemoSource from '@/registry/default/examples/message-scroller-demo.ts?raw'
import { ChatDemo } from '@/registry/default/examples/chat-demo'
import chatDemoSource from '@/registry/default/examples/chat-demo.ts?raw'

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
    name: 'attachment',
    title: 'Attachment',
    description: 'File and upload chips for chat input and messages.',
    examples: [
      { title: 'States & sizes', component: AttachmentDemo, source: attachmentDemoSource },
      { title: 'Group', component: AttachmentGroup, source: attachmentGroupSource },
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
    name: 'bubble',
    title: 'Bubble',
    description: 'Chat bubbles with variants, alignment and reactions.',
    examples: [
      { title: 'Variants', component: BubbleDemo, source: bubbleDemoSource },
      { title: 'Reactions & interactive', component: BubbleReactions, source: bubbleReactionsSource },
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
    name: 'calendar',
    title: 'Calendar',
    description: 'A date field component that allows users to enter and edit dates.',
    examples: [{ title: 'Default', component: CalendarDemo, source: calendarDemoSource }],
  },
  {
    name: 'carousel',
    title: 'Carousel',
    description: 'A carousel with motion and swipe built using Embla.',
    examples: [
      { title: 'Default', component: CarouselDemo, source: carouselDemoSource },
      { title: 'Multiple items', component: CarouselMultiple, source: carouselMultipleSource },
    ],
  },
  {
    name: 'chart',
    title: 'Chart',
    description: 'Themeable charts on chart.js, wired to the shadcn chart color variables.',
    examples: [
      { title: 'Bar', component: ChartDemo, source: chartDemoSource },
      { title: 'Line', component: ChartLine, source: chartLineSource },
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
    name: 'combobox',
    title: 'Combobox',
    description: 'Autocomplete input and command palette with a list of suggestions.',
    examples: [{ title: 'Default', component: ComboboxDemo, source: comboboxDemoSource }],
  },
  {
    name: 'command',
    title: 'Command',
    description: 'Fast, composable command menu for searching and running actions.',
    examples: [{ title: 'Default', component: CommandDemo, source: commandDemoSource }],
  },
  {
    name: 'context-menu',
    title: 'Context Menu',
    description: 'Displays a menu located at the pointer, triggered by a right click or a long press.',
    examples: [{ title: 'Default', component: ContextMenuDemo, source: contextMenuDemoSource }],
  },
  {
    name: 'data-table',
    title: 'Data Table',
    description: 'Powerful table with sorting, filtering, selection and pagination on @tanstack/table-core.',
    examples: [{ title: 'Default', component: DataTableDemo, source: dataTableDemoSource }],
  },
  {
    name: 'date-picker',
    title: 'Date Picker',
    description: 'A date picker component with calendar in a popover.',
    examples: [{ title: 'Default', component: DatePickerDemo, source: datePickerDemoSource }],
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
    name: 'direction',
    title: 'Direction',
    description: 'RTL provider — flips reading direction for all wrapped components.',
    examples: [{ title: 'RTL', component: DirectionDemo, source: directionDemoSource }],
  },
  {
    name: 'dropdown-menu',
    title: 'Dropdown Menu',
    description: 'Displays a menu to the user — such as a set of actions or functions — triggered by a button.',
    examples: [
      { title: 'Default', component: DropdownMenuDemo, source: dropdownMenuDemoSource },
      { title: 'Checkboxes', component: DropdownMenuCheckboxes, source: dropdownMenuCheckboxesSource },
      { title: 'Radio Group', component: DropdownMenuRadioGroupDemo, source: dropdownMenuRadioGroupSource },
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
    name: 'field',
    title: 'Field',
    description: 'Accessible form field anatomy: label, control, description and error wiring.',
    examples: [
      { title: 'Default', component: FieldDemo, source: fieldDemoSource },
      { title: 'Choice Card', component: FieldChoiceCard, source: fieldChoiceCardSource },
    ],
  },
  {
    name: 'form',
    title: 'Form',
    description: 'Form validation with @aurelia/validation wired into the field anatomy.',
    examples: [{ title: 'Default', component: FormDemo, source: formDemoSource }],
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
    name: 'marker',
    title: 'Marker',
    description: 'Inline timeline or day markers between chat messages.',
    examples: [{ title: 'Variants', component: MarkerDemo, source: markerDemoSource }],
  },
  {
    name: 'menubar',
    title: 'Menubar',
    description: 'A visually persistent menu common in desktop applications that provides quick access to a consistent set of commands.',
    examples: [{ title: 'Default', component: MenubarDemo, source: menubarDemoSource }],
  },
  {
    name: 'message',
    title: 'Message',
    description: 'A chat message row: avatar plus content column with header and footer.',
    examples: [{ title: 'Default', component: MessageDemo, source: messageDemoSource }],
  },
  {
    name: 'message-scroller',
    title: 'Message Scroller',
    description: 'Chat transcript viewport with follow-bottom autoscroll, turn anchoring and scroll buttons.',
    examples: [
      { title: 'Default', component: MessageScrollerDemo, source: messageScrollerDemoSource },
      { title: 'Chat', component: ChatDemo, source: chatDemoSource },
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
    name: 'navigation-menu',
    title: 'Navigation Menu',
    description: 'A collection of links for navigating websites, with expandable panels.',
    examples: [{ title: 'Default', component: NavigationMenuDemo, source: navigationMenuDemoSource }],
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
    name: 'resizable',
    title: 'Resizable',
    description: 'Accessible resizable panel groups and layouts with keyboard support.',
    examples: [
      { title: 'Default', component: ResizableDemo, source: resizableDemoSource },
      { title: 'With Handle', component: ResizableHandleDemo, source: resizableHandleDemoSource },
    ],
  },
  {
    name: 'scroll-area',
    title: 'Scroll Area',
    description: 'Augments native scroll functionality with custom, themeable scrollbars.',
    examples: [
      { title: 'Default', component: ScrollAreaDemo, source: scrollAreaDemoSource },
      { title: 'Horizontal', component: ScrollAreaHorizontal, source: scrollAreaHorizontalSource },
    ],
  },
  {
    name: 'select',
    title: 'Select',
    description: 'Displays a list of options for the user to pick from — triggered by a button.',
    examples: [
      { title: 'Default', component: SelectDemo, source: selectDemoSource },
      { title: 'Scrollable Groups', component: SelectScrollable, source: selectScrollableSource },
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
    name: 'sidebar',
    title: 'Sidebar',
    description: 'A composable, themeable and customizable application sidebar.',
    examples: [
      { title: 'Default', component: SidebarDemo, source: sidebarDemoSource },
      { title: 'Icon', component: SidebarIcon, source: sidebarIconSource },
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
    name: 'sonner',
    title: 'Sonner',
    description: 'An opinionated toast component with stacked notifications.',
    examples: [{ title: 'Default', component: SonnerDemo, source: sonnerDemoSource }],
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
