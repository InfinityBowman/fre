import type { Fiber, FC } from 'fre'
import { fibersForComponent, lastSeen } from './fibersForComponent'

/**
 * Hook into fre's diffed phase (after component renders).
 * Used to track the latest fiber instance and deduplicate.
 */
export function setupDiffedHook(options: any) {
  const oldDiffed = options.diffed
  options.diffed = (fiber: Fiber) => {
    if (fiber && typeof fiber.type === 'function') {
      // Track the last seen fiber for this component
      const key = fiber.node || fiber
      lastSeen.set(key, fiber)

      // Deduplicate fibers in the tracking array
      const fibers = fibersForComponent.get(fiber.type as FC)
      if (fibers && fibers.length > 1) {
        // Remove duplicates that point to the same instance
        const uniqueFibers = fibers.filter((f, i) =>
          fibers.findIndex(ff => ff === f || ff.node === f.node) === i
        )
        if (uniqueFibers.length !== fibers.length) {
          fibersForComponent.set(fiber.type as FC, uniqueFibers)
        }
      }
    }

    if (oldDiffed) oldDiffed(fiber)
  }
}
