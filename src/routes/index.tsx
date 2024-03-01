import DiagramProvider from "@/DiagramProvider";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isAddress } from "viem";

// # Schema
const ethereumAddress = z
  .string()
  .trim()
  .transform((x) => x.toLowerCase())
  .refine(isAddress, {
    message: "Invalid Ethereum address",
  });

const input = z.object({
  token: ethereumAddress,
  account: ethereumAddress,
});

export type Input = z.infer<typeof input>;
// ---

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: input,
});

function Index() {
  const search = Route.useSearch();

  return <DiagramProvider {...search} />;
}
