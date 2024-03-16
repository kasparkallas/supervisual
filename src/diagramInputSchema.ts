import { z } from "zod";
import { isAddress } from "viem";
import { uniq } from "lodash";

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
  .transform((x) => uniq(x))
  .default([]);

export const diagramInputSchema = z.object({
  block: z.coerce.number().nullable().default(null),
  chain: z.coerce.number().default(10),
  tokens: ethereumAddressCollectionSchema,
  accounts: ethereumAddressCollectionSchema,
});

export type DiagramInput = z.output<typeof diagramInputSchema>;
