import { extendedSuperTokenList } from "@superfluid-finance/tokenlist";

export type SuperTokenEntry = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

/**
 * Super Tokens listed for a given chain.
 *
 * `extendedSuperTokenList` also contains underlying ERC-20s (tagged
 * `underlying`). Those must be excluded here: the subgraph's token filter
 * expects Super Token ids, so picking an underlying token yields an empty graph.
 */
export function getSuperTokensForChain(chainId: number): SuperTokenEntry[] {
  return extendedSuperTokenList.tokens.filter(
    (token) => token.chainId === chainId && token.tags?.includes("supertoken"),
  );
}

export function findSuperToken(
  chainId: number,
  address: string,
): SuperTokenEntry | undefined {
  const lowerCased = address.toLowerCase();
  return getSuperTokensForChain(chainId).find(
    (token) => token.address.toLowerCase() === lowerCased,
  );
}
