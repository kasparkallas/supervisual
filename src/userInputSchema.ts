import { z } from "zod";
import { isAddress } from "viem";

export const ethereumAddressSchema = z
  .string()
  .trim()
  .transform((x) => x.toLowerCase())
  .refine(isAddress, {
    message: "Invalid Ethereum address",
  });

export const ethereumAddressCollectionSchema = ethereumAddressSchema
  .transform((x) => [x])
  .or(ethereumAddressSchema.array())
  .default([]);

export const diagramInputSchema = z.object({
  tokens: ethereumAddressCollectionSchema,
  accounts: ethereumAddressCollectionSchema,
});

export type DiagramInput = z.output<typeof diagramInputSchema>;
