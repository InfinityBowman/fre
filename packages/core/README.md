# fre-refresh-core

Core runtime for Hot Module Replacement (HMR) in [Fre](https://github.com/frejs/fre) applications.

## Installation

```bash
npm install fre-refresh-core
# or
pnpm add fre-refresh-core
# or
yarn add fre-refresh-core
```

## Overview

This package provides the runtime that enables Fast Refresh / HMR for Fre components. It works by:

1. **Tracking components** - Maintains a registry of all component functions and their fiber instances
2. **Detecting changes** - Computes signatures for components to detect when hooks change
3. **Hot swapping** - Replaces component implementations without losing state

## Usage

This package is typically used internally by `fre-refresh-vite`. You don't need to import it directly in your application code.

However, if you're building a custom bundler integration, here's how the API works:

```javascript
import 'fre-refresh-core'

// The runtime exposes itself on the global object
const refresh = self.__FRE_REFRESH__

// Register a component
refresh.register(MyComponent, 'src/MyComponent.tsx MyComponent')

// Sign a component (for hook tracking)
const sign = refresh.sign(MyComponent, 'hookSignature', false, null, 'begin')

// After module update, flush pending changes
const pending = refresh.getPendingUpdates()
pending.forEach(([oldType, newType]) => {
  refresh.replaceComponent(oldType, newType, shouldResetHooks)
})
refresh.flush()
```

## API

### `register(type, id)`
Register a component function with a unique identifier.

### `sign(type, key, forceReset, getCustomHooks, status)`
Sign a component with its hook signature for change detection.

### `replaceComponent(oldType, newType, resetHookState)`
Replace a component implementation and trigger re-renders.

### `getPendingUpdates()`
Get the list of pending component updates.

### `flush()`
Clear the pending updates list.

### `getSignature(type)`
Get the signature for a component type.

## Requirements

- Fre >= 2.0.0 (with options hooks support)

## How It Works

The runtime hooks into Fre's lifecycle via the `options` system:

- `options.diff` - Called before component render, used to track fiber instances
- `options.diffed` - Called after component render, used for deduplication
- `options.unmount` - Called when component unmounts, used for cleanup

When a component is updated:
1. The new component function is registered with the same ID
2. The runtime detects the change and queues an update
3. On flush, it swaps `fiber.type` to the new function
4. It calls `update(fiber)` to trigger a re-render
5. If hooks changed, it resets hook state; otherwise state is preserved

## License

MIT
