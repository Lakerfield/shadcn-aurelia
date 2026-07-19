/**
 * Keyboard helpers shared by the native engines — reproduce Zag's
 * `getEventKey` normalization: legacy IE key names are mapped to their
 * standard equivalents, and in RTL + horizontal orientation the left/right
 * arrows are swapped so "next" always follows the reading direction.
 */

const legacyKeyMap: Record<string, string> = {
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Esc: 'Escape',
  ' ': 'Space',
  ',': 'Comma',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
}

const rtlKeyMap: Record<string, string> = {
  ArrowLeft: 'ArrowRight',
  ArrowRight: 'ArrowLeft',
}

export interface EventKeyOptions {
  dir?: 'ltr' | 'rtl'
  orientation?: 'horizontal' | 'vertical'
}

export function getEventKey(event: KeyboardEvent, options: EventKeyOptions = {}): string {
  const { dir = 'ltr', orientation = 'horizontal' } = options
  let key = legacyKeyMap[event.key] ?? event.key
  const isRtl = dir === 'rtl' && orientation === 'horizontal'
  if (isRtl && key in rtlKeyMap) key = rtlKeyMap[key]
  return key
}

/** Safari does not focus buttons on click; Zag compensates by focusing manually. */
export const isSafari = (): boolean =>
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
  /apple/i.test(navigator.vendor ?? '')
