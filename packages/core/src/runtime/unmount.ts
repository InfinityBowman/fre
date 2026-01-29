import type { Fiber, FC } from 'fre'
import { fibersForComponent, lastSeen } from './fibersForComponent'

/**
 * Hook into fre's unmount phase.
 * Clean up fiber tracking when components are removed.
 */
export function setupUnmountHook(options: any) {
  const oldUnmount = options.unmount
  options.unmount = (fiber: Fiber) => {
    if (fiber && typeof fiber.type === 'function') {
      // Remove this fiber from tracking
      const fibers = fibersForComponent.get(fiber.type as FC)
      if (fibers) {
        const index = fibers.indexOf(fiber)
        if (index !== -1) {
          fibers.splice(index, 1)
        }
        // Clean up empty arrays
        if (fibers.length === 0) {
          fibersForComponent.delete(fiber.type as FC)
        }
      }

      // Clean up lastSeen
      const key = fiber.node || fiber
      if (lastSeen.has(key)) {
        lastSeen.delete(key)
      }
    }

    if (oldUnmount) oldUnmount(fiber)
  }
}
