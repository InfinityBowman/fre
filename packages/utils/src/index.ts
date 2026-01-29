import { NAMESPACE } from 'fre-refresh-core'

interface Signature {
  key?: string
  fullKey?: string
  forceReset?: boolean
}

interface FreRefreshRuntime {
  getSignature: (type: Function) => Signature | undefined
  getPendingUpdates: () => [Function, Function][]
  flush: () => void
  replaceComponent: (oldType: Function, newType: Function, resetHookState: boolean) => void
  computeKey: (signature: Signature) => string
}

function getRefresh(): FreRefreshRuntime | undefined {
  return (self as any)[NAMESPACE]
}

/**
 * Compare signatures between old and new component versions.
 * Determines whether hook state should be reset.
 */
const compareSignatures = (prev: Function, next: Function): void => {
  const refresh = getRefresh()
  if (!refresh) return

  const prevSignature: Signature = refresh.getSignature(prev) || {}
  const nextSignature: Signature = refresh.getSignature(next) || {}

  // Reset state if:
  // 1. Key changed (hook structure changed)
  // 2. Full computed key changed (custom hooks changed)
  // 3. forceReset flag is set
  if (
    prevSignature.key !== nextSignature.key ||
    refresh.computeKey(prevSignature) !== refresh.computeKey(nextSignature) ||
    nextSignature.forceReset
  ) {
    refresh.replaceComponent(prev, next, true)
  } else {
    refresh.replaceComponent(prev, next, false)
  }
}

/**
 * Flush all pending component updates.
 * Called by the Vite plugin when HMR triggers.
 */
export const flush = (): void => {
  const refresh = getRefresh()
  if (!refresh) {
    console.warn('[fre-refresh] Runtime not initialized')
    return
  }

  const pending = [...refresh.getPendingUpdates()]
  refresh.flush()

  if (pending.length > 0) {
    pending.forEach(([prev, next]) => {
      compareSignatures(prev, next)
    })
  }
}

/**
 * Check if a value is a component (function starting with uppercase).
 */
export const isComponent = (exportValue: unknown): boolean => {
  if (typeof exportValue === 'function') {
    const name = (exportValue as any).name || (exportValue as any).displayName
    return (
      typeof name === 'string' &&
      name.length > 0 &&
      name[0] === name[0].toUpperCase()
    )
  }
  return false
}
