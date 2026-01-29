/**
 * @fre-refresh/core
 *
 * Hot Module Replacement runtime for Fre.
 * Similar to @prefresh/core but designed for Fre's fiber architecture.
 */

import type { Fiber, FC, Hooks } from 'fre'
import { NAMESPACE, HOOK_CLEANUP } from './constants'
import { computeKey, signaturesForType, type Signature } from './computeKey'
import { fibersForComponent, mappedComponents, lastSeen } from './runtime/fibersForComponent'

// Import setup functions
import { setupFiberHook } from './runtime/fiber'
import { setupDiffHook } from './runtime/diff'
import { setupDiffedHook } from './runtime/diffed'
import { setupUnmountHook } from './runtime/unmount'

// Deferred initialization to avoid circular dependency issues
let initialized = false
let freUpdate: typeof import('fre').update

function ensureInitialized() {
  if (initialized) return
  initialized = true

  // Dynamic import to break circular dependency
  import('fre').then(fre => {
    freUpdate = fre.update
    setupFiberHook(fre.options)
    setupDiffHook(fre.options)
    setupDiffedHook(fre.options)
    setupUnmountHook(fre.options)
  })
}

// Initialize on next tick to ensure fre is fully loaded
if (typeof queueMicrotask !== 'undefined') {
  queueMicrotask(ensureInitialized)
} else {
  setTimeout(ensureInitialized, 0)
}

// Type ID registry
const typesById = new Map<string, FC>()
// Pending component replacements
let pendingUpdates: [FC, FC][] = []

/**
 * Sign a component type with a signature for HMR tracking.
 * Called by the babel plugin to track hook signatures.
 */
function sign(
  type: FC | undefined,
  key: string | undefined,
  forceReset: boolean | undefined,
  getCustomHooks: (() => Function[]) | undefined,
  status: string | undefined
): string | undefined {
  if (type) {
    if (status === 'begin') {
      signaturesForType.set(type, {
        type,
        key,
        forceReset,
        getCustomHooks: getCustomHooks || (() => []),
      })
      return 'needsHooks'
    } else if (status === 'needsHooks') {
      const signature = signaturesForType.get(type)
      if (signature) {
        signature.fullKey = computeKey(signature)
      }
    }
  }
  return undefined
}

/**
 * Replace a component with its new implementation.
 * This is the core HMR logic that swaps components and triggers re-renders.
 */
function replaceComponent(OldType: FC, NewType: FC, resetHookState: boolean): void {
  const fibers = fibersForComponent.get(OldType)
  if (!fibers || fibers.length === 0) return

  // Migrate fiber tracking to new component
  fibersForComponent.delete(OldType)
  fibersForComponent.set(NewType, fibers)

  // Map old type to new type for future lookups
  mappedComponents.set(OldType, NewType)

  // Remove from pending updates
  pendingUpdates = pendingUpdates.filter(p => p[0] !== OldType)

  // Update each fiber using this component
  fibers.forEach(fiber => {
    if (!fiber) return

    // Handle fiber lookup through lastSeen for deduplication
    let currentFiber = fiber
    const key = fiber.node || fiber
    if (lastSeen.has(key)) {
      currentFiber = lastSeen.get(key)!
      lastSeen.delete(key)
    }

    // Skip if fiber is no longer mounted (no parent)
    if (!currentFiber || !currentFiber.parent) return

    // Update the fiber's type to the new component
    ;(currentFiber as any).type = NewType

    // Handle hook state
    if (resetHookState) {
      // Reset hooks - call cleanup functions first
      if (currentFiber.hooks) {
        cleanupHooks(currentFiber.hooks)
        // Reset hooks to empty state
        currentFiber.hooks = {
          list: [],
          effect: [],
          layout: []
        }
      }
    } else {
      // Just run cleanup functions but preserve state
      if (currentFiber.hooks) {
        runCleanups(currentFiber.hooks)
      }
    }

    // Trigger re-render
    if (freUpdate) freUpdate(currentFiber)
  })
}

/**
 * Clean up all hooks and reset state
 */
function cleanupHooks(hooks: Hooks): void {
  if (hooks.list) {
    hooks.list.forEach(hook => {
      // Check if hook has a cleanup function (index 2 in HookEffect)
      if (Array.isArray(hook) && typeof hook[HOOK_CLEANUP] === 'function') {
        try {
          hook[HOOK_CLEANUP]()
        } catch (e) {
          console.error('[fre-refresh] Error in cleanup:', e)
        }
      }
    })
  }
}

/**
 * Run cleanup functions without resetting state
 */
function runCleanups(hooks: Hooks): void {
  // Run effect cleanups
  if (hooks.effect) {
    hooks.effect.forEach(effect => {
      if (typeof effect[HOOK_CLEANUP] === 'function') {
        try {
          effect[HOOK_CLEANUP]()
          effect[HOOK_CLEANUP] = undefined
        } catch (e) {
          console.error('[fre-refresh] Error in effect cleanup:', e)
        }
      }
    })
  }

  // Run layout effect cleanups
  if (hooks.layout) {
    hooks.layout.forEach(effect => {
      if (typeof effect[HOOK_CLEANUP] === 'function') {
        try {
          effect[HOOK_CLEANUP]()
          effect[HOOK_CLEANUP] = undefined
        } catch (e) {
          console.error('[fre-refresh] Error in layout cleanup:', e)
        }
      }
    })
  }
}

/**
 * Register a component type with an ID.
 * Called by the babel plugin after each component definition.
 */
function register(type: unknown, id: string): void {
  if (typeof type !== 'function') return

  const fn = type as FC

  if (typesById.has(id)) {
    const existing = typesById.get(id)!
    if (existing !== fn) {
      // Component has changed - queue for update
      pendingUpdates.push([existing, fn])
      typesById.set(id, fn)
    }
  } else {
    typesById.set(id, fn)
  }

  // Initialize signature if not present
  if (!signaturesForType.has(fn)) {
    signaturesForType.set(fn, {
      type: fn,
      getCustomHooks: () => [],
    })
  }
}

/**
 * Get pending component updates
 */
function getPendingUpdates(): [FC, FC][] {
  return pendingUpdates
}

/**
 * Clear pending updates
 */
function flush(): void {
  pendingUpdates = []
}

/**
 * Get signature for a component type
 */
function getSignature(type: FC): Signature | undefined {
  return signaturesForType.get(type)
}

// Export the refresh API on the global object
declare global {
  interface Window {
    [NAMESPACE]: typeof freRefreshAPI
  }
}

const freRefreshAPI = {
  getSignature,
  register,
  getPendingUpdates,
  flush,
  replaceComponent,
  sign,
  computeKey,
}

if (typeof self !== 'undefined') {
  ;(self as any)[NAMESPACE] = freRefreshAPI
}

export {
  getSignature,
  register,
  getPendingUpdates,
  flush,
  replaceComponent,
  sign,
  computeKey,
  NAMESPACE,
}
