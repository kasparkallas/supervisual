# Supervisual

Renders Superfluid CFA streams and GDA pool relationships as a shareable ReactFlow
diagram. URL state is part of the product: a link must reproduce the exact graph
(chain, tokens, accounts, historical block).

## Editing rules

- The `/` route's search params are the canonical app state. Schema + defaults:
  `src/diagramInputSchema.ts`; parse/stringify (comma-encoded arrays):
  `src/main.tsx`. When updating one field, preserve the others.
- Write route state via `getRouteApi("/")` → `route.useNavigate()` /
  `route.useSearch()`. A bare `useNavigate()` won't typecheck the search object.
- Never edit generated files: `src/routeTree.gen.ts` and
  `packages/subgraph/.graphclient/*`. Change route files, the GraphQL documents,
  or graphclient config instead.

## Data

- `packages/subgraph/AllRelevantEntities.graphql` defines the graph boundary.
  `DataProvider` passes the accounts twice (`accounts` and `accounts_bytes`) —
  different subgraph filters expect different scalar types.
- Subgraph data is all lower-cased; `src/dataMapper.ts` re-checksums node IDs via
  viem `getAddress`.
- `dataMapper` is the semantic merge layer: it dedupes accounts/pools, merges
  block/timestamp ranges, and sums duplicate edges. Flow rates are `bigint`; GDA
  member outflow is computed client-side as
  `(pool.flowRate / pool.totalUnits) * member.units`.
- Identity (ENS/Lens/Farcaster via `whois.superfluid.finance`, in
  `src/useAddressDisplayInfo.ts`) is best-effort display only — graph correctness
  must not depend on it.

## Rendering

- Dagre computes only the initial top-to-bottom layout; ReactFlow owns node/edge
  state after mount (custom `"custom"` nodes, `"floating"` edges).
- `DataProvider` remounts `Diagram` via a `key` whenever fetched data changes, so
  layout is recomputed from scratch — account for this if adding live updates.

## Dependency landmines

- Keep `.npmrc`'s `shamefully-hoist=true`; the graphclient/Mesh stack relies on it.
- Pin transitive deps via `pnpm.overrides`, not the top-level `overrides` field.
- `@graphql-mesh/runtime` imports `AggregateError` from `@graphql-tools/utils`,
  which v10+ removed; `vite.config.ts` shims it for both Rollup and esbuild. Read
  that comment before bumping GraphQL deps.
