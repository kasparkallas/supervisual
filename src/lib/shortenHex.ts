export function shortenHex(address: string, chars = 4) {
  return (
    address.slice(2, chars + 2) +
    "…" +
    address.slice(address.length - chars, address.length)
  );
}
