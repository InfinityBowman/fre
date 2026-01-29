import { transformSync } from '@babel/core'
import type { Plugin, ResolvedConfig } from 'vite'
// @ts-ignore - react-refresh doesn't have types
import reactRefreshBabel from 'react-refresh/babel'

export interface FreRefreshOptions {
  include?: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  parserPlugins?: string[]
}

const defaultInclude = /\.(t|j)sx?$/
const defaultExclude = /node_modules/

function createFilter(
  include: string | RegExp | (string | RegExp)[] = defaultInclude,
  exclude: string | RegExp | (string | RegExp)[] = defaultExclude
) {
  const includePatterns = Array.isArray(include) ? include : [include]
  const excludePatterns = Array.isArray(exclude) ? exclude : [exclude]

  return (id: string): boolean => {
    // Check excludes first
    for (const pattern of excludePatterns) {
      if (typeof pattern === 'string') {
        if (id.includes(pattern)) return false
      } else if (pattern.test(id)) {
        return false
      }
    }

    // Then check includes
    for (const pattern of includePatterns) {
      if (typeof pattern === 'string') {
        if (id.includes(pattern)) return true
      } else if (pattern.test(id)) {
        return true
      }
    }

    return false
  }
}

/**
 * Vite plugin for Fre Fast Refresh (HMR)
 */
export default function freRefresh(options: FreRefreshOptions = {}): Plugin {
  let shouldSkip = false
  let config: ResolvedConfig
  const filter = createFilter(options.include, options.exclude)

  return {
    name: 'fre-refresh',

    configResolved(resolvedConfig) {
      config = resolvedConfig
      shouldSkip =
        resolvedConfig.isProduction ||
        resolvedConfig.command === 'build' ||
        resolvedConfig.server?.hmr === false
    },

    async transform(code: string, id: string, transformOptions?: { ssr?: boolean }) {
      const ssr = transformOptions?.ssr === true

      // Skip in production, build, SSR, or non-matching files
      if (
        shouldSkip ||
        ssr ||
        !filter(id) ||
        id.includes('?worker')
      ) {
        return
      }

      // Determine parser plugins based on file extension
      const parserPlugins: string[] = [
        'jsx',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        ...(options.parserPlugins || [])
      ]

      if (/\.tsx?$/.test(id)) {
        parserPlugins.push('typescript')
      }

      // Transform with react-refresh babel plugin
      const result = transform(code, id, parserPlugins)

      // Check if transformation produced refresh calls
      const hasReg = /\$RefreshReg\$\(/.test(result.code)
      const hasSig = /\$RefreshSig\$\(/.test(result.code)

      // If no refresh calls, return original code
      if (!hasReg && !hasSig) {
        return code
      }

      // Build the prelude that sets up refresh globals
      const prelude = `
import 'fre-refresh-core';
import { flush as __fre_flush } from 'fre-refresh-utils';

let __fre_prevRefreshReg;
let __fre_prevRefreshSig;

if (import.meta.hot) {
  __fre_prevRefreshReg = self.$RefreshReg$ || (() => {});
  __fre_prevRefreshSig = self.$RefreshSig$ || ((type) => type);

  self.$RefreshReg$ = (type, id) => {
    self.__FRE_REFRESH__.register(type, ${JSON.stringify(id)} + " " + id);
  };

  self.$RefreshSig$ = () => {
    let status = 'begin';
    let savedType;
    return (type, key, forceReset, getCustomHooks) => {
      if (!savedType) savedType = type;
      status = self.__FRE_REFRESH__.sign(type || savedType, key, forceReset, getCustomHooks, status);
      return type;
    };
  };
}
`.trim()

      // If only signatures (no registrations), just add prelude
      if (hasSig && !hasReg) {
        return {
          code: `${prelude}\n${result.code}`,
          map: result.map,
        }
      }

      // Full HMR support with accept handler
      const postlude = `
if (import.meta.hot) {
  self.$RefreshReg$ = __fre_prevRefreshReg;
  self.$RefreshSig$ = __fre_prevRefreshSig;

  import.meta.hot.accept((mod) => {
    try {
      __fre_flush();
    } catch (e) {
      console.error('[fre-refresh] Failed to flush updates:', e);
      self.location.reload();
    }
  });
}
`.trim()

      return {
        code: `${prelude}\n${result.code}\n${postlude}`,
        map: result.map,
      }
    },
  }
}

/**
 * Transform code using react-refresh babel plugin
 */
function transform(code: string, filename: string, parserPlugins: string[]) {
  const result = transformSync(code, {
    plugins: [[reactRefreshBabel, { skipEnvCheck: true }]],
    parserOpts: {
      plugins: parserPlugins as any,
    },
    ast: false,
    sourceMaps: true,
    filename,
    sourceFileName: filename,
    configFile: false,
    babelrc: false,
  })

  return {
    code: result?.code || code,
    map: result?.map || null,
  }
}

// Also export as named export
export { freRefresh }
