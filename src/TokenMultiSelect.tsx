import { useMemo, useRef, useState } from "react";
import { isAddress } from "viem";
import {
  getSuperTokensForChain,
  findSuperToken,
  SuperTokenEntry,
} from "./lib/superTokenList";
import { shortenHex } from "./lib/shortenHex";
import { cn } from "./lib/utils";

type ControlAccessibilityProps = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "aria-describedby" | "aria-invalid"
>;

type Props = {
  chainId: number;
  /** Selected token addresses (lower-cased). */
  value: string[];
  onChange: (next: string[]) => void;
} & ControlAccessibilityProps;

type Option =
  | { kind: "token"; token: SuperTokenEntry }
  | { kind: "custom"; address: string };

const MAX_SUGGESTIONS = 50;

function TokenIcon({
  logoURI,
  symbol,
  size,
}: {
  logoURI?: string;
  symbol: string;
  size: "sm" | "md";
}) {
  const dimension = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  if (logoURI) {
    return (
      <img
        src={logoURI}
        alt=""
        className={cn(dimension, "shrink-0 rounded-full")}
      />
    );
  }
  return (
    <span
      className={cn(
        dimension,
        "flex shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[9px] font-semibold text-neutral-600",
      )}
    >
      {symbol.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function TokenMultiSelect({
  chainId,
  value,
  onChange,
  ...controlProps
}: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const tokens = useMemo(() => getSuperTokensForChain(chainId), [chainId]);
  const selectedSet = useMemo(
    () => new Set(value.map((v) => v.toLowerCase())),
    [value],
  );

  const query = search.trim().toLowerCase();
  const options = useMemo<Option[]>(() => {
    const available = tokens.filter(
      (t) => !selectedSet.has(t.address.toLowerCase()),
    );
    const matched = (
      query
        ? available.filter(
            (t) =>
              t.symbol.toLowerCase().includes(query) ||
              t.name.toLowerCase().includes(query) ||
              t.address.toLowerCase().includes(query),
          )
        : available
    ).slice(0, MAX_SUGGESTIONS);

    const opts: Option[] = matched.map((token) => ({ kind: "token", token }));

    const trimmed = search.trim();
    const isKnown = matched.some(
      (t) => t.address.toLowerCase() === trimmed.toLowerCase(),
    );
    if (
      isAddress(trimmed) &&
      !selectedSet.has(trimmed.toLowerCase()) &&
      !isKnown
    ) {
      opts.push({ kind: "custom", address: trimmed });
    }
    return opts;
  }, [tokens, selectedSet, query, search]);

  const showDropdown = open && options.length > 0;
  const clampedActive = Math.min(activeIndex, Math.max(options.length - 1, 0));

  const add = (address: string) => {
    const lower = address.toLowerCase();
    if (!selectedSet.has(lower)) {
      onChange([...value, lower]);
    }
    setSearch("");
    setActiveIndex(0);
    // Collapse the dropdown after a pick (keep focus for the next entry).
    setOpen(false);
    inputRef.current?.focus();
  };

  const remove = (address: string) => {
    const lower = address.toLowerCase();
    onChange(value.filter((v) => v.toLowerCase() !== lower));
  };

  const selectOption = (opt: Option) => {
    if (opt.kind === "token") add(opt.token.address);
    else add(opt.address);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (options.length > 0) {
        e.preventDefault();
        selectOption(options[clampedActive]);
      }
    } else if (e.key === "Backspace" && search === "" && value.length > 0) {
      remove(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        className="flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-sm ring-offset-white focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-950 focus-within:ring-offset-2"
        onMouseDown={(e) => {
          // Don't steal focus when clicking a chip's remove button.
          if (e.target === e.currentTarget) inputRef.current?.focus();
        }}
      >
        {value.map((address) => {
          const token = findSuperToken(chainId, address);
          const label = token?.symbol ?? shortenHex(address);
          return (
            <span
              key={address}
              className="flex items-center gap-1 rounded-full border bg-neutral-50 py-0.5 pl-1 pr-1 text-xs"
            >
              <TokenIcon logoURI={token?.logoURI} symbol={label} size="sm" />
              <span className="px-0.5">{label}</span>
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
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={
            value.length === 0 ? "Search symbol, name, or paste 0x…" : ""
          }
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:text-gray-500"
        />
      </div>

      {showDropdown && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto overscroll-contain rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt, index) => {
            const isActive = index === clampedActive;
            return (
              <li key={opt.kind === "token" ? opt.token.address : "custom"}>
                <button
                  type="button"
                  // Keep focus on the input so the dropdown doesn't close first.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                    isActive ? "bg-neutral-100" : "hover:bg-neutral-50",
                  )}
                >
                  {opt.kind === "token" ? (
                    <>
                      <TokenIcon
                        logoURI={opt.token.logoURI}
                        symbol={opt.token.symbol}
                        size="md"
                      />
                      <span className="font-medium">{opt.token.symbol}</span>
                      <span className="truncate text-xs text-neutral-500">
                        {opt.token.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[9px] font-semibold text-neutral-600">
                        +
                      </span>
                      <span className="font-medium">Add custom token</span>
                      <span className="truncate text-xs text-neutral-500">
                        {shortenHex(opt.address)}
                      </span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
