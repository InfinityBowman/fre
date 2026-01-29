# fre-refresh-utils

Utility functions for Fre Hot Module Replacement.

## Installation

```bash
npm install fre-refresh-utils
# or
pnpm add fre-refresh-utils
# or
yarn add fre-refresh-utils
```

## Overview

This package provides utility functions used by `fre-refresh-vite` to coordinate HMR updates.

## Usage

```javascript
import { flush, isComponent } from 'fre-refresh-utils'

// Flush all pending component updates
// This compares signatures and triggers replaceComponent
flush()

// Check if a value is a component function
if (isComponent(exportedValue)) {
  // Handle component
}
```

## API

### `flush()`

Flushes all pending component updates. This function:

1. Gets pending updates from `fre-refresh-core`
2. Compares signatures between old and new components
3. Calls `replaceComponent` with appropriate reset flag
4. Clears the pending updates queue

### `isComponent(value)`

Returns `true` if the value is likely a component function (starts with uppercase letter).

## Requirements

- fre-refresh-core >= 1.0.0

## License

MIT
