/** Minimal LCS-based unified diff for `shadcn-aurelia diff`. */

export const unifiedDiff = (a: string, b: string, context = 2): string => {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  // LCS table
  const m = aLines.length
  const n = bLines.length
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = aLines[i] === bLines[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }
  // walk to ops
  type Op = { kind: ' ' | '-' | '+'; line: string }
  const ops: Op[] = []
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (aLines[i] === bLines[j]) {
      ops.push({ kind: ' ', line: aLines[i] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ kind: '-', line: aLines[i++] })
    } else {
      ops.push({ kind: '+', line: bLines[j++] })
    }
  }
  while (i < m) ops.push({ kind: '-', line: aLines[i++] })
  while (j < n) ops.push({ kind: '+', line: bLines[j++] })

  if (!ops.some((o) => o.kind !== ' ')) return ''

  // keep only changed hunks with context
  const keep = new Array<boolean>(ops.length).fill(false)
  ops.forEach((op, idx) => {
    if (op.kind === ' ') return
    for (let k = Math.max(0, idx - context); k <= Math.min(ops.length - 1, idx + context); k++) {
      keep[k] = true
    }
  })
  const out: string[] = []
  let inGap = false
  ops.forEach((op, idx) => {
    if (keep[idx]) {
      out.push(`${op.kind} ${op.line}`)
      inGap = false
    } else if (!inGap) {
      out.push('  …')
      inGap = true
    }
  })
  return out.join('\n')
}
