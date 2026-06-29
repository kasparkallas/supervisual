import { shortenHex } from "./lib/shortenHex";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type Address, getAddress, isAddress } from "viem";

type AddressDisplayInfo = {
  addressChecksummed: Address;
  addressTruncated: string;
  profile: SuperfluidProfile | null;
  primaryName: string | null;
  primaryAvatarUrl: string | null;
};

export type SocialIdentity = {
  handle: string;
  avatarUrl: string | null;
  address?: string;
} | null;

/**
 * Type for the complete profile data structure returned by
 * `https://whois.superfluid.finance/api/resolve/{address}`.
 *
 * The API ranks identities across services and exposes the winner via the
 * `recommended*` fields — prefer those over hardcoding a client-side priority.
 * The per-service objects are kept as a defensive fallback; services may be
 * absent from the response (e.g. `Lens`, `AlfaFrens`).
 */
export type SuperfluidProfile = {
  ENS: SocialIdentity;
  Farcaster: SocialIdentity;
  Lens?: SocialIdentity;
  AlfaFrens?: SocialIdentity;
  TOREX?: SocialIdentity;
  recommendedName: string | null;
  recommendedAvatar: string | null;
  recommendedService: string | null;
};

export function useAddressDisplayInfo(
  address: string | undefined,
): AddressDisplayInfo | null {
  const addressLowerCased = address
    ? isAddress(address)
      ? (address.toLowerCase() as Address)
      : null
    : null;

  const { data: profile } = useQuery({
    queryKey: ["profile", addressLowerCased],
    queryFn: async () => {
      if (!addressLowerCased) {
        return null;
      }

      const response = await fetch(
        `https://whois.superfluid.finance/api/resolve/${addressLowerCased}`,
      );

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as SuperfluidProfile;
    },
  });

  return useMemo(() => {
    if (!addressLowerCased) return null;

    const addressChecksummed = getAddress(addressLowerCased);
    const addressTruncated = shortenHex(addressChecksummed);

    return {
      addressChecksummed,
      addressTruncated,
      profile: profile ?? null,
      primaryName:
        profile?.recommendedName ??
        profile?.ENS?.handle ??
        profile?.Lens?.handle?.replace("lens/", "") ??
        profile?.Farcaster?.handle ??
        null,
      primaryAvatarUrl:
        profile?.recommendedAvatar ??
        profile?.ENS?.avatarUrl ??
        profile?.Lens?.avatarUrl ??
        profile?.Farcaster?.avatarUrl ??
        profile?.AlfaFrens?.avatarUrl ??
        null,
    };
  }, [addressLowerCased, profile]);
}
