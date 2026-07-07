/**
 * TanStack Table adapter — @tanstack/table-core behind the facade.
 *
 * table-core is framework-agnostic but push-based: every state change goes
 * through `onStateChange` and expects the host framework to re-render. This
 * adapter owns that loop: it keeps the table state, feeds it back via
 * setOptions, and notifies subscribers so Aurelia components can re-read
 * `api.getHeaderGroups()` / `api.getRowModel()` etc.
 *
 *   const engine = createTableEngine({ data, columns, getSortedRowModel: getSortedRowModel() })
 *   engine.subscribe(() => { this.rows = engine.api.getRowModel().rows })
 *   engine.api.setPageIndex(1)                       // → subscriber fires
 *   engine.setOptions({ data: newData })             // → subscriber fires
 */
import {
  createTable,
  getCoreRowModel,
  type RowData,
  type Table,
  type TableOptions,
  type TableOptionsResolved,
  type TableState,
  type Updater,
} from '@tanstack/table-core'

export interface TableEngineOptions<TData extends RowData> extends Omit<
  TableOptions<TData>,
  'getCoreRowModel' | 'state' | 'onStateChange' | 'renderFallbackValue'
> {
  /** Optional row-model factory override; defaults to getCoreRowModel(). */
  getCoreRowModel?: TableOptions<TData>['getCoreRowModel']
  /** Initial (partial) table state, merged over table.initialState. */
  state?: Partial<TableState>
}

export interface TableEngine<TData extends RowData> {
  readonly api: Table<TData>
  /** Called after every state or options change. Returns a disposer. */
  subscribe(listener: () => void): () => void
  /** Update options (new data, new columns, …) and re-notify. */
  setOptions(options: Partial<TableEngineOptions<TData>>): void
}

export const createTableEngine = <TData extends RowData>(
  options: TableEngineOptions<TData>,
): TableEngine<TData> => {
  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((l) => l())

  const { state: initialState, ...tableOptions } = options
  const resolved: TableOptionsResolved<TData> = {
    getCoreRowModel: getCoreRowModel(),
    ...tableOptions,
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
  }
  const table = createTable(resolved)

  let state: TableState = { ...table.initialState, ...initialState }
  let extra: Partial<TableOptions<TData>> = {}

  const apply = () => {
    table.setOptions((prev) => ({
      ...prev,
      ...extra,
      state: { ...state },
      onStateChange: (updater: Updater<TableState>) => {
        state = typeof updater === 'function' ? updater(state) : updater
        apply()
        notify()
      },
    }))
  }
  apply()

  return {
    api: table,
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    setOptions(next: Partial<TableEngineOptions<TData>>): void {
      const { state: nextState, ...rest } = next
      if (nextState) state = { ...state, ...nextState }
      extra = { ...extra, ...rest }
      apply()
      notify()
    },
  }
}
