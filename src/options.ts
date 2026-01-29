import type { Fiber } from './type'

/**
 * Options object for fre lifecycle hooks.
 * Similar to Preact's options system, this allows external tools
 * (like HMR plugins) to hook into fre's rendering lifecycle.
 */
export interface FreOptions {
  /**
   * Called when a fiber is created (before rendering)
   */
  fiber?: (fiber: Fiber) => void

  /**
   * Called before a component renders (diff begins)
   */
  diff?: (fiber: Fiber) => void

  /**
   * Called after a component has rendered (diff complete)
   */
  diffed?: (fiber: Fiber) => void

  /**
   * Called when a fiber is being unmounted
   */
  unmount?: (fiber: Fiber) => void

  /**
   * Called when a component throws an error
   */
  catchError?: (error: Error, fiber: Fiber) => void
}

/**
 * Global options object that plugins can hook into.
 * Plugins should save the previous hook and call it after their own logic.
 *
 * Example:
 * ```
 * const oldDiff = options.diff
 * options.diff = (fiber) => {
 *   // custom logic
 *   if (oldDiff) oldDiff(fiber)
 * }
 * ```
 */
export const options: FreOptions = {}
