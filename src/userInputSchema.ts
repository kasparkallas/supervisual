import { z } from "zod";
import { isAddress } from "viem";

export const ethereumAddressSchema = z
  .string()
  .trim()
  .transform((x) => x.toLowerCase())
  .refine(isAddress, {
    message: "Invalid Ethereum address",
  });

export const userInputSchema = z.object({
  token: ethereumAddressSchema,
  account: ethereumAddressSchema,
});

export type UserInput = z.infer<typeof userInputSchema>;
