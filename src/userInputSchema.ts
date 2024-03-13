import { z } from "zod";
import { isAddress } from "viem";

export const ethereumAddressSchema = z
  .string()
  .trim()
  .transform((x) => x.toLowerCase())
  .refine(isAddress, {
    message: "Invalid Ethereum address",
  });

export const urlSchema = z.object({
  token: ethereumAddressSchema.or(z.literal("")).default(""),
  accounts: ethereumAddressSchema
    .transform((x) => [x])
    .or(ethereumAddressSchema.array())
    .default([]),
});

export const formSchema = z.object({
  token: ethereumAddressSchema,
  accounts: z
    .array(
      z.object({
        value: ethereumAddressSchema,
      }),
    )
    .transform((x) => x.filter((y) => y.value).map((y) => y.value)),
});

export type FormInput = z.input<typeof formSchema>;
export type FormOutput = z.output<typeof formSchema>;
export type Config = z.output<typeof urlSchema>;
