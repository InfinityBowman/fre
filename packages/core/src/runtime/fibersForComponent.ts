import type { Fiber, FC } from 'fre'

/**
 * WeakMap tracking all fibers that use a given component function.
 * Key: Component function
 * Value: Array of fibers using that component
 */
export const fibersForComponent = new WeakMap<FC, Fiber[]>()

/**
 * WeakMap mapping old component functions to their replacements.
 * Used during HMR to redirect old types to new implementations.
 */
export const mappedComponents = new WeakMap<FC, FC>()

/**
 * Map tracking the last seen fiber for deduplication.
 * Used to handle fiber reuse during reconciliation.
 */
export const lastSeen = new Map<any, Fiber>()
