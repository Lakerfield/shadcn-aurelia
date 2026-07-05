/**
 * Controlled/uncontrolled bridge — Zag machine state ↔ Aurelia bindables.
 *
 * shadcn's `open`/`onOpenChange` idiom maps to Aurelia as:
 *   • `open.two-way` bindable on the root element
 *   • an `open-change` CustomEvent (bubbling) for event-style consumers
 *
 * The sync object guards against re-entrancy: a bindable write triggered by a
 * machine update must not echo back into the machine (and vice versa).
 */

export interface ControlledSyncOptions<T> {
  host: HTMLElement
  /** CustomEvent name dispatched on machine-driven changes, e.g. 'open-change'. */
  eventName: string
  /** Push a value into the machine (e.g. `api.setOpen(v)`). */
  setMachineValue: (value: T) => void
  /** Write a machine-driven value back to the bindable for two-way binding. */
  setBindable: (value: T) => void
}

export interface ControlledSync<T> {
  /** Call from the bindable's `*Changed` handler. */
  fromBindable(value: T | undefined): void
  /** Call from the machine subscription with the machine's current value. */
  fromMachine(value: T): void
}

export function createControlledSync<T>(options: ControlledSyncOptions<T>): ControlledSync<T> {
  const { host, eventName, setMachineValue, setBindable } = options
  let syncing = false
  let last: T | undefined

  return {
    fromBindable(value: T | undefined): void {
      if (syncing || value === undefined || value === last) return
      last = value
      syncing = true
      try {
        setMachineValue(value)
      } finally {
        syncing = false
      }
    },

    fromMachine(value: T): void {
      if (syncing || value === last) return
      last = value
      syncing = true
      try {
        setBindable(value)
        host.dispatchEvent(new CustomEvent<T>(eventName, { detail: value, bubbles: true }))
      } finally {
        syncing = false
      }
    },
  }
}
