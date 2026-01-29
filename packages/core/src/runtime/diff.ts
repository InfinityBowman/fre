import type { Fiber, FC } from 'fre'
import { fibersForComponent } from './fibersForComponent'

const BUILT_IN_COMPONENTS = ['Fragment', 'Suspense', 'ErrorBoundary']

const isBuiltIn = (type: FC): boolean => {
  return BUILT_IN_COMPONENTS.includes(type.name)
}

/**
 * Hook into fre's diff phase to track which fibers use which component.
 * This is called before a component renders.
 */
export function setupDiffHook(options: any) {
  const oldDiff = options.diff
  options.diff = (fiber: Fiber) => {
    if (fiber && typeof fiber.type === 'function' && !isBuiltIn(fiber.type as FC)) {
      const fibers = fibersForComponent.get(fiber.type as FC)
      if (!fibers) {
        fibersForComponent.set(fiber.type as FC, [fiber])
      } else {
        // Only add if not already tracked
        if (!fibers.includes(fiber)) {
          fibers.push(fiber)
        }
      }
    }

    if (oldDiff) oldDiff(fiber)
  }
}
