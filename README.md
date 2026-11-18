# Supervisual

Visualizes Superfluid streams (CFA) and distribution pools (GDA) as a diagram. The URL holds the full state (chain, tokens, accounts, block), so a link reproduces the same graph.

Live at https://supervisual.kazpi.com.

## Run locally

```sh
pnpm install
pnpm dev
```

`pnpm build` type checks and builds.

## Notes

- Data comes from the Superfluid subgraph (`packages/subgraph`).
- Account names and avatars come from the Whois API at `whois.superfluid.finance`.
- [CLAUDE.md](CLAUDE.md) has the editing rules and dependency notes.
