/**
 * ui-form — connects @aurelia/validation to the ui-field anatomy.
 *
 *   export class ProfileForm {
 *     private rules = resolve(IValidationRules)
 *     controller = resolve(newInstanceForScope(IValidationController))
 *     model = { username: '' }
 *     binding() { this.rules.on(this.model).ensure('username').required() }
 *   }
 *
 *   <ui-form controller.bind="controller" valid-submit.trigger="save()">
 *     <ui-field name="username">
 *       <ui-field-label>Username</ui-field-label>
 *       <ui-input value.bind="model.username & validate"></ui-input>
 *       <ui-field-error></ui-field-error>
 *     </ui-field>
 *     <ui-button type="submit">Submit</ui-button>
 *   </ui-form>
 *
 * The host renders a native <form novalidate>; submitting validates through
 * the bound controller and dispatches a bubbling `valid-submit` CustomEvent
 * when everything passes. Validation results flow to matching
 * `<ui-field name="…">` descendants (data-invalid, aria-invalid,
 * aria-describedby and ui-field-error messages).
 *
 * Requires `ValidationHtmlConfiguration` registered in main.ts for the
 * `& validate` binding behavior.
 */
import { customElement, bindable, INode, resolve } from 'aurelia'
import type {
  IValidationController,
  ValidationEvent,
  ValidationResultsSubscriber,
} from '@aurelia/validation-html'
import type { ValidationResult } from '@aurelia/validation'
import { fieldValidationContext, type FieldValidationSource } from '@/registry/default/ui/field'
import { cn } from '@/registry/default/lib/cn'

const TEMPLATE = `
<form ref="formEl" novalidate data-slot="form" class.bind="classes"
      submit.trigger="onSubmit($event)">
  <au-slot></au-slot>
</form>
`

type ErrorListener = (errors: string[]) => void

@customElement({ name: 'ui-form', template: TEMPLATE })
export class UiForm implements FieldValidationSource, ValidationResultsSubscriber {
  @bindable() controller: IValidationController | null = null

  formEl!: HTMLFormElement

  private readonly host: HTMLElement = resolve(INode) as HTMLElement
  private results: ValidationResult[] = []
  private readonly listeners = new Map<string, Set<ErrorListener>>()
  private subscribedTo: IValidationController | null = null
  private authorClasses = ''

  created(): void {
    this.host.style.display = 'contents'
  }

  binding(): void {
    fieldValidationContext.set(this.host, this)
  }

  bound(): void {
    this.authorClasses = this.host.getAttribute('class') ?? ''
    this.subscribe()
  }

  get classes(): string {
    return cn(this.authorClasses)
  }

  controllerChanged(): void {
    this.subscribe()
  }

  private subscribe(): void {
    if (this.subscribedTo === this.controller) return
    this.subscribedTo?.removeSubscriber(this)
    this.results = []
    this.subscribedTo = this.controller
    this.controller?.addSubscriber(this)
  }

  handleValidationEvent(event: ValidationEvent): void {
    for (const { result } of event.removedResults) {
      const i = this.results.indexOf(result)
      if (i !== -1) this.results.splice(i, 1)
    }
    for (const { result } of event.addedResults) {
      if (!result.valid) this.results.push(result)
    }
    for (const [name, set] of this.listeners) {
      const errors = this.errorsFor(name)
      set.forEach((l) => l(errors))
    }
  }

  private errorsFor(name: string): string[] {
    return this.results
      .filter((r) => String(r.propertyName ?? '') === name && r.message)
      .map((r) => r.message as string)
  }

  subscribeErrors(name: string, listener: ErrorListener): () => void {
    let set = this.listeners.get(name)
    if (!set) this.listeners.set(name, (set = new Set()))
    set.add(listener)
    listener(this.errorsFor(name))
    return () => set.delete(listener)
  }

  onSubmit(e: Event): boolean {
    e.preventDefault()
    void this.submit()
    return false
  }

  /** Validate (when a controller is bound) and emit `valid-submit` on success. */
  async submit(): Promise<boolean> {
    if (this.controller) {
      const result = await this.controller.validate()
      if (!result.valid) return false
    }
    this.host.dispatchEvent(new CustomEvent('valid-submit', { bubbles: true }))
    return true
  }

  /** Clear all validation results (e.g. after a successful save). */
  reset(): void {
    this.controller?.reset()
    this.formEl.reset()
  }

  detaching(): void {
    this.subscribedTo?.removeSubscriber(this)
    this.subscribedTo = null
    this.listeners.clear()
    fieldValidationContext.delete(this.host)
  }
}
