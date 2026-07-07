/**
 * ui-field family — shadcn Field anatomy (convention A, host-styled).
 *
 *   <ui-field-set>
 *     <ui-field-legend>Profile</ui-field-legend>
 *     <ui-field-group>
 *       <ui-field name="username">
 *         <ui-field-label>Username</ui-field-label>
 *         <ui-input value.bind="model.username & validate"></ui-input>
 *         <ui-field-description>Your public handle.</ui-field-description>
 *         <ui-field-error></ui-field-error>
 *       </ui-field>
 *     </ui-field-group>
 *   </ui-field-set>
 *
 * ui-field wires label/control/description/error automatically: it locates
 * the form control among its descendants, assigns ids, and maintains
 * aria-labelledby / aria-describedby / aria-invalid. The `name` bindable
 * connects the field to a surrounding ui-form's validation results (see
 * ui/form); `invalid` + `errors.bind` on ui-field-error work standalone.
 *
 * All parts carry their classes on the host element so shadcn's
 * direct-child selectors ([&>[data-slot=field-label]] etc.) keep working.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import { cva, type VariantProps } from 'class-variance-authority'
import { createContext, createId, type Context } from '@shadcn-aurelia/primitives'
import { cn } from '@/registry/default/lib/cn'
import { UiSeparator } from '@/registry/default/ui/separator'

/** Published by ui-form (ui/form) so named fields can receive validation results. */
export interface FieldValidationSource {
  /** Subscribe to error messages for one property name; returns a disposer. */
  subscribeErrors(name: string, listener: (errors: string[]) => void): () => void
}

export const fieldValidationContext: Context<FieldValidationSource> =
  createContext<FieldValidationSource>()

export interface FieldOwner {
  readonly name: string
  readonly invalid: boolean
  readonly errors: string[]
  readonly control: HTMLElement | null
  labelEl: HTMLElement | null
  descriptionEl: HTMLElement | null
  errorEl: HTMLElement | null
  subscribe(listener: () => void): () => void
}

export const fieldContext: Context<FieldOwner> = createContext<FieldOwner>()

export const fieldVariants = cva(
  'group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
  {
    variants: {
      orientation: {
        vertical: ['flex-col [&>*]:w-full [&>.sr-only]:w-auto'],
        horizontal: [
          'flex-row items-center',
          '[&>[data-slot=field-label]]:flex-auto',
          'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
        responsive: [
          'flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto',
          '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
          '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
        ],
      },
    },
    defaultVariants: { orientation: 'vertical' },
  },
)

export type FieldVariants = VariantProps<typeof fieldVariants>

/** Form controls ui-field recognizes, in query order. Hidden inputs are skipped. */
const CONTROL_SELECTOR =
  'input:not([type=hidden]), textarea, select, [role=combobox], [role=listbox], [role=radiogroup], [role=slider], [role=spinbutton], [role=switch], [role=textbox], [role=group][data-slot=input-otp]'

const isCheckable = (el: HTMLElement): boolean =>
  el.matches(
    'input[type=checkbox], input[type=radio], [role=checkbox], [role=radio], [role=switch]',
  )

@customElement({ name: 'ui-field', template: '<au-slot></au-slot>' })
export class UiField implements FieldOwner {
  @bindable() orientation: FieldVariants['orientation'] = 'vertical'
  /** Property name for validation wiring via a surrounding ui-form. */
  @bindable() name = ''
  /** Manual invalid state (standalone use without ui-form). */
  @bindable() invalid = false

  errors: string[] = []
  control: HTMLElement | null = null
  labelEl: HTMLElement | null = null
  descriptionEl: HTMLElement | null = null
  errorEl: HTMLElement | null = null

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private readonly listeners = new Set<() => void>()
  private disposeValidation: (() => void) | null = null
  private authorClasses = ''

  binding(): void {
    fieldContext.set(this.host, this)
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field')
    this.host.setAttribute('role', 'group')
    this.applyClasses()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  attached(): void {
    this.control = this.findControl()
    if (this.control) {
      if (!this.control.id) this.control.id = createId('field-control')
      this.wireLabel()
    }
    if (this.name && this.host.parentElement) {
      const source = fieldValidationContext.get(this.host.parentElement)
      if (source) {
        this.disposeValidation = source.subscribeErrors(this.name, (errors) => {
          this.errors = errors
          this.invalid = errors.length > 0
          // messages can change while invalid stays true; always re-apply + notify
          this.applyInvalidState()
        })
      }
    }
    this.applyInvalidState()
  }

  private findControl(): HTMLElement | null {
    for (const el of this.host.querySelectorAll<HTMLElement>(CONTROL_SELECTOR)) {
      if (el.getAttribute('aria-hidden') === 'true' || el.hidden) continue
      // skip controls that belong to a nested field
      if (el.closest('[data-slot=field]') !== this.host) continue
      return el
    }
    return null
  }

  private wireLabel(): void {
    const control = this.control!
    if (!this.labelEl || control.hasAttribute('aria-label')) return
    const resolvesToText = (ids: string | null): boolean =>
      !!ids &&
      ids
        .split(' ')
        .some((id) => (document.getElementById(id)?.textContent ?? '').trim().length > 0)
    if (resolvesToText(control.getAttribute('aria-labelledby'))) return
    // controls that already get their name from a wrapping label (e.g. ui-checkbox with slotted text)
    const wrapping = control.closest('label')
    if (wrapping && (wrapping.textContent ?? '').trim().length > 0) return
    if (control.hasAttribute('aria-labelledby')) {
      // a behavior engine owns aria-labelledby (and rewrites it on every transition),
      // but it resolves to empty text — accname then falls through to aria-label
      const text = (this.labelEl.textContent ?? '').trim()
      if (text) control.setAttribute('aria-label', text)
      return
    }
    if (!this.labelEl.id) this.labelEl.id = createId('field-label')
    control.setAttribute('aria-labelledby', this.labelEl.id)
  }

  orientationChanged(): void {
    this.applyClasses()
  }

  invalidChanged(): void {
    this.applyInvalidState()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-orientation', this.orientation ?? 'vertical')
    this.host.className = cn(fieldVariants({ orientation: this.orientation }), this.authorClasses)
  }

  private applyInvalidState(): void {
    this.host.setAttribute('data-invalid', String(this.invalid))
    if (this.control) {
      if (this.invalid) this.control.setAttribute('aria-invalid', 'true')
      else this.control.removeAttribute('aria-invalid')
      const ids: string[] = []
      if (this.descriptionEl?.id) ids.push(this.descriptionEl.id)
      if (this.invalid && this.errorEl?.id) ids.push(this.errorEl.id)
      if (ids.length > 0) this.control.setAttribute('aria-describedby', ids.join(' '))
      else this.control.removeAttribute('aria-describedby')
    }
    this.listeners.forEach((l) => l())
  }

  detaching(): void {
    this.disposeValidation?.()
    this.disposeValidation = null
    this.listeners.clear()
    fieldContext.delete(this.host)
  }
}

@customElement({ name: 'ui-field-label', template: '<au-slot></au-slot>' })
export class UiFieldLabel {
  /** Optional explicit control id; defaults to the field's detected control. */
  @bindable({ attribute: 'for' }) htmlFor = ''

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: FieldOwner | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-label')
    this.host.className = cn(
      // ui/label base
      'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
      // FieldLabel additions
      'group/field-label peer/field-label w-fit leading-snug group-data-[disabled=true]/field:opacity-50',
      'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
      'has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10',
      author,
    )
    this.resolveOwner()
    this.host.addEventListener('click', this.onClick)
  }

  attached(): void {
    // projected content mounts after bound(); retry the downward lookup
    this.resolveOwner()
  }

  private resolveOwner(): FieldOwner | null {
    if (!this.owner) {
      // choice-card mode: the label WRAPS the field, so also look downward
      const inner = this.host.querySelector<HTMLElement>('[data-slot=field]')
      this.owner = fieldContext.get(this.host) ?? (inner ? (fieldContext.get(inner) ?? null) : null)
      if (this.owner && !this.owner.labelEl) this.owner.labelEl = this.host
    }
    return this.owner
  }

  /** No native <label> is possible on a custom element; forward activation manually. */
  private onClick = (e: MouseEvent): void => {
    const control = this.htmlFor
      ? document.getElementById(this.htmlFor)
      : (this.resolveOwner()?.control ?? null)
    if (!control) return
    const target = e.target as HTMLElement
    if (control.contains(target)) return
    // clicks on interactive elements (links, the control's own label, …) keep their behavior
    if (target.closest('a, button, label, input, select, textarea')) return
    if (isCheckable(control)) control.click()
    control.focus()
  }

  detaching(): void {
    this.host.removeEventListener('click', this.onClick)
    if (this.owner?.labelEl === this.host) this.owner.labelEl = null
  }
}

@customElement({ name: 'ui-field-title', template: '<au-slot></au-slot>' })
export class UiFieldTitle {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: FieldOwner | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-label')
    this.host.className = cn(
      'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
      author,
    )
    // inside a choice card the title is the effective label
    this.owner = fieldContext.get(this.host) ?? null
    if (this.owner && !this.owner.labelEl) this.owner.labelEl = this.host
  }

  detaching(): void {
    if (this.owner?.labelEl === this.host) this.owner.labelEl = null
  }
}

@customElement({ name: 'ui-field-description', template: '<au-slot></au-slot>' })
export class UiFieldDescription {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: FieldOwner | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-description')
    if (!this.host.id) this.host.id = createId('field-description')
    this.host.className = cn(
      'block text-sm leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance',
      // on the tinted bg of a checked choice card, muted-foreground misses 4.5:1
      'group-has-data-[state=checked]/field-label:text-foreground/75',
      'last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5',
      '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
      author,
    )
    this.owner = fieldContext.get(this.host) ?? null
    if (this.owner && !this.owner.descriptionEl) this.owner.descriptionEl = this.host
  }

  detaching(): void {
    if (this.owner?.descriptionEl === this.host) this.owner.descriptionEl = null
  }
}

const ERROR_TEMPLATE = `
<template if.bind="messages.length === 1">\${messages[0]}</template>
<ul if.bind="messages.length > 1" class="ml-4 flex list-disc flex-col gap-1">
  <li repeat.for="m of messages">\${m}</li>
</ul>
<au-slot></au-slot>
`

@customElement({ name: 'ui-field-error', template: ERROR_TEMPLATE })
export class UiFieldError {
  /** Standalone use: an array of strings or { message } objects. */
  @bindable() errors: Array<string | { message?: string }> | null = null

  messages: string[] = []

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private owner: FieldOwner | null = null
  private dispose: (() => void) | null = null

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-error')
    this.host.setAttribute('role', 'alert')
    if (!this.host.id) this.host.id = createId('field-error')
    this.host.className = cn('block text-sm font-normal text-destructive', author)
    this.owner = fieldContext.get(this.host) ?? null
    if (this.owner && !this.owner.errorEl) this.owner.errorEl = this.host
  }

  attached(): void {
    if (this.owner) {
      const sync = () => this.update()
      this.dispose = this.owner.subscribe(sync)
    }
    this.update()
  }

  errorsChanged(): void {
    this.update()
  }

  private update(): void {
    if (this.errors !== null) {
      const unique = new Set<string>()
      for (const e of this.errors) {
        const msg = typeof e === 'string' ? e : (e?.message ?? '')
        if (msg) unique.add(msg)
      }
      this.messages = [...unique]
    } else if (this.owner) {
      this.messages = [...new Set(this.owner.errors)]
    }
    // auto-hide only when the messages are managed here (bindable or field-driven)
    const managed = this.errors !== null || (this.owner?.name ?? '') !== ''
    this.host.hidden = managed && this.messages.length === 0
  }

  detaching(): void {
    this.dispose?.()
    this.dispose = null
    if (this.owner?.errorEl === this.host) this.owner.errorEl = null
  }
}

@customElement({ name: 'ui-field-content', template: '<au-slot></au-slot>' })
export class UiFieldContent {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-content')
    this.host.className = cn(
      'group/field-content flex flex-1 flex-col gap-1.5 leading-snug',
      author,
    )
  }
}

@customElement({ name: 'ui-field-group', template: '<au-slot></au-slot>' })
export class UiFieldGroup {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-group')
    this.host.className = cn(
      'group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4',
      author,
    )
  }
}

@customElement({ name: 'ui-field-set', template: '<au-slot></au-slot>' })
export class UiFieldSet {
  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-set')
    this.host.setAttribute('role', 'group')
    this.host.className = cn(
      'flex flex-col gap-6',
      'has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
      author,
    )
  }

  attached(): void {
    // a fieldset takes its accessible name from its legend
    const legend = this.host.querySelector<HTMLElement>('[data-slot=field-legend]')
    if (legend) {
      if (!legend.id) legend.id = createId('field-legend')
      this.host.setAttribute('aria-labelledby', legend.id)
    }
  }
}

@customElement({ name: 'ui-field-legend', template: '<au-slot></au-slot>' })
export class UiFieldLegend {
  @bindable() variant: 'legend' | 'label' = 'legend'

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private authorClasses = ''

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-legend')
    this.applyClasses()
  }

  variantChanged(): void {
    this.applyClasses()
  }

  private applyClasses(): void {
    this.host.setAttribute('data-variant', this.variant)
    this.host.className = cn(
      'block mb-3 font-medium',
      'data-[variant=legend]:text-base',
      'data-[variant=label]:text-sm',
      this.authorClasses,
    )
  }
}

const SEPARATOR_TEMPLATE = `
<ui-separator class="absolute inset-0 top-1/2"></ui-separator>
<span ref="contentEl" class="relative mx-auto block w-fit bg-background px-2 text-muted-foreground" data-slot="field-separator-content">
  <au-slot></au-slot>
</span>
`

@customElement({
  name: 'ui-field-separator',
  template: SEPARATOR_TEMPLATE,
  dependencies: [UiSeparator],
})
export class UiFieldSeparator {
  contentEl!: HTMLSpanElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement

  bound(): void {
    const author = this.host.getAttribute('class') ?? ''
    this.host.setAttribute('data-slot', 'field-separator')
    this.host.className = cn(
      'relative block -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2',
      author,
    )
  }

  attached(): void {
    const hasContent = (this.contentEl.textContent ?? '').trim().length > 0
    this.host.setAttribute('data-content', String(hasContent))
    if (!hasContent) this.contentEl.hidden = true
  }
}
