/**
 * Form-control helpers shared by the native checkbox/switch/radio-group
 * engines — reproduce the small slice of `@zag-js/dom-query` those machines
 * rely on: the visually-hidden input style, press tracking (`data-active`),
 * form-reset tracking, and programmatic input syncing that fires the same
 * events Zag dispatches so external listeners observe identical behavior.
 */

/** Zag's visuallyHiddenStyle, pre-serialized the way `@zag-js/vanilla` would. */
export const visuallyHiddenStyle =
  'border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;word-wrap:normal;'

/** Set the checked property AND attribute, like Zag's setElementChecked. */
export function setElementChecked(el: HTMLInputElement | null, checked: boolean): void {
  if (!el) return
  el.checked = checked
  if (checked) el.setAttribute('checked', '')
  else el.removeAttribute('checked')
}

/**
 * Zag's dispatchInputCheckedEvent: sync the input then emit a bubbling
 * `click` so form libraries listening on the input observe the programmatic
 * change (the engines' own click handlers re-send the same value — a no-op).
 */
export function dispatchInputCheckedEvent(el: HTMLInputElement | null, checked: boolean): void {
  if (!el) return
  setElementChecked(el, checked)
  el.dispatchEvent(new Event('click', { bubbles: true }))
}

/** Run `callback` when the input's owning form resets. Returns cleanup. */
export function trackFormReset(
  el: HTMLElement | null,
  callback: () => void,
): (() => void) | undefined {
  if (!el) return
  const form =
    el instanceof HTMLInputElement ? el.form : (el.closest('form') as HTMLFormElement | null)
  if (!form) return
  const onReset = (event: Event) => {
    if (event.defaultPrevented) return
    callback()
  }
  form.addEventListener('reset', onReset, { passive: true })
  return () => form.removeEventListener('reset', onReset)
}

export interface TrackPressOptions {
  pointerNode: HTMLElement | null
  keyboardNode?: HTMLElement | null
  isValidKey?: (event: KeyboardEvent) => boolean
  onPress?: () => void
  onPressStart?: () => void
  onPressEnd?: () => void
}

/**
 * Zag's trackPress: `data-active` while pressing — pointerdown on the
 * pointer node until pointerup anywhere (press completes only inside), plus
 * the keyboard equivalent (Space held on the focused hidden input).
 */
export function trackPress(options: TrackPressOptions): () => void {
  const {
    pointerNode,
    keyboardNode = pointerNode,
    isValidKey = (e) => e.key === 'Enter',
    onPress,
    onPressStart,
    onPressEnd,
  } = options
  if (!pointerNode) return () => {}

  let removeEndListeners = () => {}
  let removeAccessibleListeners = () => {}

  const startPointerPress = (startEvent: PointerEvent) => {
    removeEndListeners()
    const endPointerPress = (endEvent: PointerEvent) => {
      const target = endEvent.target
      if (target instanceof Node && pointerNode.contains(target)) onPress?.()
      else onPressEnd?.()
    }
    const cancelPress = () => onPressEnd?.()
    window.addEventListener('pointerup', endPointerPress, { once: true })
    window.addEventListener('pointercancel', cancelPress, { once: true })
    removeEndListeners = () => {
      window.removeEventListener('pointerup', endPointerPress)
      window.removeEventListener('pointercancel', cancelPress)
    }
    if (keyboardNode && document.activeElement === keyboardNode && startEvent.pointerType === 'mouse') {
      startEvent.preventDefault()
    }
    onPressStart?.()
  }

  const startAccessiblePress = () => {
    const handleKeydown = (keydownEvent: KeyboardEvent) => {
      if (!isValidKey(keydownEvent)) return
      const handleKeyup = (keyupEvent: KeyboardEvent) => {
        if (!isValidKey(keyupEvent)) return
        onPress?.()
        onPressEnd?.()
      }
      removeEndListeners()
      keyboardNode?.addEventListener('keyup', handleKeyup)
      removeEndListeners = () => keyboardNode?.removeEventListener('keyup', handleKeyup)
      onPressStart?.()
    }
    const handleBlur = () => onPressEnd?.()
    keyboardNode?.addEventListener('keydown', handleKeydown)
    keyboardNode?.addEventListener('blur', handleBlur)
    removeAccessibleListeners = () => {
      keyboardNode?.removeEventListener('keydown', handleKeydown)
      keyboardNode?.removeEventListener('blur', handleBlur)
    }
  }

  pointerNode.addEventListener('pointerdown', startPointerPress as EventListener)
  keyboardNode?.addEventListener('focus', startAccessiblePress)

  return () => {
    pointerNode.removeEventListener('pointerdown', startPointerPress as EventListener)
    keyboardNode?.removeEventListener('focus', startAccessiblePress)
    removeEndListeners()
    removeAccessibleListeners()
  }
}
