const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined

const paint = (code: number, text: string): string =>
  useColor ? `\u001b[${code}m${text}\u001b[0m` : text

export const green = (t: string): string => paint(32, t)
export const red = (t: string): string => paint(31, t)
export const yellow = (t: string): string => paint(33, t)
export const dim = (t: string): string => paint(2, t)
export const bold = (t: string): string => paint(1, t)

export const info = (msg: string): void => console.log(msg)
export const success = (msg: string): void => console.log(`${green('✔')} ${msg}`)
export const warn = (msg: string): void => console.warn(`${yellow('▲')} ${msg}`)
export const fail = (msg: string): never => {
  console.error(`${red('✘')} ${msg}`)
  process.exit(1)
}
