import { defineConfig } from 'vite'
import freRefresh from 'fre-refresh-vite'

export default defineConfig({
  plugins: [freRefresh()],
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  },
  resolve: {
    alias: {
      'fre': '/Users/jacobmaynard/Documents/Repos/fre-clone/src/index.ts',
      'fre-refresh-core': '/Users/jacobmaynard/Documents/Repos/fre-clone/packages/core/src/index.ts',
      'fre-refresh-utils': '/Users/jacobmaynard/Documents/Repos/fre-clone/packages/utils/src/index.ts',
    }
  }
})
