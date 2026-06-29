import path from "path";
import { readFileSync } from "fs";
import react from "@vitejs/plugin-react";
import { defineConfig, Plugin } from "vite";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

const ReactCompilerConfig = {};

// `@graphql-mesh/runtime` does `import { AggregateError } from "@graphql-tools/utils"`,
// but @graphql-tools/utils v10+ dropped that re-export (AggregateError is a standard
// global since ES2021; older versions only ponyfilled it). Re-add it from the global so
// both the Rollup production build and esbuild's dev dep pre-bundling resolve the import.
const UTILS_INDEX_RE = /@graphql-tools[\\/]utils[\\/]esm[\\/]index\.js$/;
// Match an actual (re-)export of the symbol, not any mention of it, so the shim is skipped
// only when the version already exports it (v8/v9) — avoiding a duplicate-export error —
// and still applies if a future version merely references the name without exporting it.
const EXPORTS_AGGREGATE_ERROR = /export\b[^\n]*AggregateError/;
// Mirror the v9 ponyfill: use the native global, fall back to a minimal class for runtimes
// (old WebViews/SSR) where it is absent.
const AGGREGATE_ERROR_SHIM = `
export const AggregateError =
  globalThis.AggregateError ??
  class AggregateError extends Error {
    constructor(errors, message) {
      super(message);
      this.errors = errors;
      this.name = "AggregateError";
    }
  };
`;

const needsShim = (id: string, code: string) =>
  UTILS_INDEX_RE.test(id.split("?")[0]) && !EXPORTS_AGGREGATE_ERROR.test(code);

// For `vite build` (Rollup).
const graphqlToolsAggregateError = (): Plugin => ({
  name: "graphql-tools-aggregate-error",
  transform(code, id) {
    if (needsShim(id, code)) {
      return { code: code + AGGREGATE_ERROR_SHIM, map: null };
    }
  },
});

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    TanStackRouterVite(),
    graphqlToolsAggregateError(),
  ],
  optimizeDeps: {
    // For `vite dev` (esbuild dependency pre-bundling).
    esbuildOptions: {
      plugins: [
        {
          name: "graphql-tools-aggregate-error",
          setup(build) {
            build.onLoad({ filter: UTILS_INDEX_RE }, (args) => {
              const code = readFileSync(args.path, "utf8");
              if (!needsShim(args.path, code)) return;
              return { contents: code + AGGREGATE_ERROR_SHIM, loader: "js" };
            });
          },
        },
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
