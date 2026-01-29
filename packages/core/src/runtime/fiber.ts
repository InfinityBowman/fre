import type { Fiber, FC } from 'fre'
import { fibersForComponent, mappedComponents } from './fibersForComponent'

/**
 * Get the current mapped component type.
 * Follows the chain of mappings to find the latest version.
 */
const getMappedComponent = (type: FC): FC => {
  if (mappedComponents.has(type)) {
    return getMappedComponent(mappedComponents.get(type)!)
  }
  return type
}

const BUILT_IN_COMPONENTS = ['Fragment', 'Suspense', 'ErrorBoundary']

const isBuiltIn = (type: FC): boolean => {
  return BUILT_IN_COMPONENTS.includes(type.name)
}

/**
 * Hook into fre's fiber creation to:
 * 1. Redirect old component types to their new versions
 * 2. Track fibers by component type for later replacement
 */
export function setupFiberHook(options: any) {
  const oldFiber = options.fiber
  options.fiber = (fiber: Fiber) => {
    if (fiber && typeof fiber.type === 'function' && !isBuiltIn(fiber.type as FC)) {
      const foundType = getMappedComponent(fiber.type as FC)
      if (foundType !== fiber.type) {
        // Update fiber to use the new component implementation
        fiber.type = foundType
      }
    }

    if (oldFiber) oldFiber(fiber)
  }
}
