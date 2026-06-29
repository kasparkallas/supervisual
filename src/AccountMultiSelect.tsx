import { useEffect, useMemo, useRef, useState } from "react";
import { getAddress, isAddress } from "viem";
import { shortenHex } from "./lib/shortenHex";

type ControlAccessibilityProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "aria-describedby" | "aria-invalid"
>;

type Props = {
  /** Selected account addresses (lower-cased). */
  value: string[];
  onChange: (next: string[]) => void;
} & ControlAccessibilityProps;

type ResolvedHandle = {
  address: string;
  name: string;
  avatarUrl: string | null;
};

type Suggestion =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "address"; address: string }
  | { status: "resolved"; resolved: ResolvedHandle }
  | { status: "notfound"; query: string };

const MIN_HANDLE_LENGTH = 3;
const DEBOUNCE_MS = 350;

/**
 * Resolve an ENS / Farcaster / Lens handle to an address via the Superfluid
 * name service (same backend as `useAddressDisplayInfo`, reverse direction).
 */
async function resolveHandle(handle: string): Promise<ResolvedHandle | null> {
  const response = await fetch(
    `https://whois.superfluid.finance/api/reverse-resolve/${encodeURIComponent(handle)}`,
  );
  if (!response.ok) return null;

  const profile = await response.json();
  const service: string | undefined = profile?.recommendedService;
  const address: unknown =
    (service ? profile?.[service]?.address : undefined) ??
    profile?.ENS?.address ??
    profile?.Farcaster?.address ??
    profile?.Lens?.address;

  if (typeof address !== "string" || !isAddress(address)) return null;

  const name: string =
    profile?.recommendedName ?? profile?.ENS?.handle ?? handle;
  const avatarUrl: string | null =
    profile?.recommendedAvatar ??
    (service ? profile?.[service]?.avatarUrl : undefined) ??
    profile?.ENS?.avatarUrl ??
    null;
  return { address: address.toLowerCase(), name, avatarUrl };
}

function Avatar({ src, label }: { src: string | null; label: string }) {
  if (src) {
    return <img src={src} alt="" className="h-5 w-5 shrink-0 rounded-full" />;
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[9px] font-semibold text-neutral-600">
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function AccountMultiSelect({
  value,
  onChange,
  ...controlProps
}: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion>({ status: "idle" });
  // lower-cased address -> display label (e.g. an ENS name the user typed)
  const [labels, setLabels] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(
    () => new Set(value.map((v) => v.toLowerCase())),
    [value],
  );

  // Live, debounced handle resolution for as-you-type reassurance.
  useEffect(() => {
    const text = search.trim();
    if (!text) {
      setSuggestion({ status: "idle" });
      return;
    }
    if (isAddress(text)) {
      setSuggestion({ status: "address", address: text.toLowerCase() });
      return;
    }
    if (text.length < MIN_HANDLE_LENGTH) {
      setSuggestion({ status: "idle" });
      return;
    }

    setSuggestion({ status: "loading" });
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const resolved = await resolveHandle(text);
        if (cancelled) return;
        setSuggestion(
          resolved
            ? { status: "resolved", resolved }
            : { status: "notfound", query: text },
        );
      } catch {
        if (!cancelled) setSuggestion({ status: "notfound", query: text });
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const addAddress = (address: string, name?: string) => {
    const lower = address.toLowerCase();
    if (!selectedSet.has(lower)) {
      onChange([...value, lower]);
    }
    if (name) {
      setLabels((prev) => ({ ...prev, [lower]: name }));
    }
    setSearch("");
    setSuggestion({ status: "idle" });
    inputRef.current?.focus();
  };

  const remove = (address: string) => {
    const lower = address.toLowerCase();
    onChange(value.filter((v) => v.toLowerCase() !== lower));
  };

  const commitSuggestion = () => {
    if (suggestion.status === "address") {
      addAddress(suggestion.address);
    } else if (suggestion.status === "resolved") {
      addAddress(suggestion.resolved.address, suggestion.resolved.name);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitSuggestion();
    } else if (e.key === "Backspace" && search === "" && value.length > 0) {
      remove(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showDropdown = open && suggestion.status !== "idle";

  return (
    <div className="relative">
      <div
        className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-sm ring-offset-white focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-950 focus-within:ring-offset-2"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) inputRef.current?.focus();
        }}
      >
        {value.map((address) => {
          const lower = address.toLowerCase();
          const checksummed = getAddress(lower);
          const label = labels[lower] ?? shortenHex(checksummed);
          return (
            <span
              key={address}
              title={checksummed}
              className="flex items-center gap-1 rounded-full border bg-neutral-50 py-0.5 pl-2 pr-1 text-xs"
            >
              <span>{label}</span>
              <button
                type="button"
                onClick={() => remove(address)}
                aria-label={`Remove ${label}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          {...controlProps}
          ref={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={
            value.length === 0 ? "Paste 0x… or type an ENS name" : ""
          }
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-gray-500"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {suggestion.status === "loading" && (
            <div className="px-3 py-1.5 text-neutral-500">Resolving…</div>
          )}

          {suggestion.status === "address" && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commitSuggestion();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-neutral-100"
            >
              <Avatar src={null} label="0" />
              <span className="font-medium">Add address</span>
              <span className="truncate text-xs text-neutral-500">
                {shortenHex(getAddress(suggestion.address))}
              </span>
            </button>
          )}

          {suggestion.status === "resolved" && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commitSuggestion();
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-neutral-100"
            >
              <Avatar
                src={suggestion.resolved.avatarUrl}
                label={suggestion.resolved.name}
              />
              <span className="font-medium">{suggestion.resolved.name}</span>
              <span className="truncate text-xs text-neutral-500">
                {shortenHex(getAddress(suggestion.resolved.address))}
              </span>
            </button>
          )}

          {suggestion.status === "notfound" && (
            <div className="px-3 py-1.5 text-neutral-500">
              No ENS / Farcaster / Lens match for &ldquo;{suggestion.query}
              &rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
