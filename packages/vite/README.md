# fre-refresh-vite

Vite plugin for Fre Fast Refresh (Hot Module Replacement).

## Installation

```bash
npm install fre-refresh-vite fre-refresh-core fre-refresh-utils -D
# or
pnpm add fre-refresh-vite fre-refresh-core fre-refresh-utils -D
# or
yarn add fre-refresh-vite fre-refresh-core fre-refresh-utils -D
```

## Usage

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import freRefresh from 'fre-refresh-vite'

export default defineConfig({
  plugins: [freRefresh()],
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  }
})
```

That's it! Your Fre components will now hot reload while preserving state.

## Options

```typescript
freRefresh({
  // Files to include (default: /\.(t|j)sx?$/)
  include: /\.tsx?$/,

  // Files to exclude (default: /node_modules/)
  exclude: /node_modules/,

  // Additional babel parser plugins
  parserPlugins: ['decorators-legacy']
})
```

## How It Works

1. **Code Transformation** - Uses `react-refresh/babel` to inject registration and signature calls into your component files

2. **Runtime Injection** - Adds imports for `fre-refresh-core` and `fre-refresh-utils` to transformed files

3. **HMR Handling** - Adds `import.meta.hot.accept()` handlers that flush updates when files change

### Example Transformation

Input:
```jsx
export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

Output (simplified):
```javascript
import 'fre-refresh-core'
import { flush } from 'fre-refresh-utils'

var _s = $RefreshSig$()
export function Counter() {
  _s()
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
_s(Counter, "useState{[count, setCount](0)}")
$RefreshReg$(Counter, "Counter")

if (import.meta.hot) {
  import.meta.hot.accept(() => flush())
}
```

## Requirements

- Vite >= 4.0.0
- Fre >= 2.0.0 (with options hooks support)

## Component Requirements

For HMR to work properly:

1. **Components must be named** - Anonymous default exports won't work:
   ```jsx
   // Won't work
   export default () => <div>Hello</div>

   // Works
   export default function Hello() {
     return <div>Hello</div>
   }
   ```

2. **Component names must start with uppercase**:
   ```jsx
   // Won't be detected as component
   function helper() { ... }

   // Will be detected
   function Helper() { ... }
   ```

3. **Hooks must follow the rules of hooks** - Custom hooks should start with `use`

## Troubleshooting

### State is resetting on every change

This usually means the hook signature changed. Check if you're:
- Adding/removing hooks
- Changing hook order
- Modifying custom hooks

### HMR not triggering

Make sure:
- The file matches the include pattern
- The file doesn't match the exclude pattern
- The component is properly named

### Full page reload instead of HMR

Check the browser console for errors. Common causes:
- Syntax errors in the component
- Runtime errors during render
- Component not properly exported

## License

MIT
