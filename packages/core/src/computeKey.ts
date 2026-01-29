export interface Signature {
  type: Function
  key?: string
  fullKey?: string
  forceReset?: boolean
  getCustomHooks?: () => Function[]
}

/**
 * Compute a unique key for a component based on its signature.
 * This is used to detect when hooks have changed and state needs to be reset.
 */
export const computeKey = (signature: Signature): string => {
  let key = signature.key || ''

  if (signature.getCustomHooks) {
    const customHooks = signature.getCustomHooks()
    if (customHooks && customHooks.length > 0) {
      key += customHooks
        .map(hook => {
          const sig = signaturesForType.get(hook)
          return sig ? computeKey(sig) : ''
        })
        .join('::')
    }
  }

  return key
}

/**
 * Map storing signatures for component types.
 */
export const signaturesForType = new Map<Function, Signature>()
