/**
 * Unique-id generation for machine instances and ARIA relationships
 * (aria-labelledby / aria-describedby / aria-controls).
 *
 * Counter-based: stable within a page lifetime, no crypto needed. SSR-safe id
 * coordination is out of scope until the SSR story lands (see architecture §4).
 */

let counter = 0

/** `createId('tooltip')` → `"ui-tooltip-1"`, `"ui-tooltip-2"`, … */
export function createId(scope: string): string {
  return `ui-${scope}-${++counter}`
}
