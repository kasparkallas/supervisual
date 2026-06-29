import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useMemo } from "react";
import { Button } from "./components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "./components/ui/form";
import { getRouteApi } from "@tanstack/react-router";
import { z } from "zod";
import { uniq } from "lodash";
import { ethereumAddressSchema } from "./diagramInputSchema";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from "./components/ui/select";
import sfMeta from "@superfluid-finance/metadata";
import { TokenMultiSelect } from "./TokenMultiSelect";
import { AccountMultiSelect } from "./AccountMultiSelect";

const addressArraySchema = z
  .array(ethereumAddressSchema)
  .transform((x) => uniq(x))
  .default([]);

const formSchema = z.object({
  chain: z.string().default("10").pipe(z.coerce.number()),
  tokens: addressArraySchema,
  accounts: addressArraySchema,
});

export type FormInput = z.input<typeof formSchema>;
export type FormOutput = z.output<typeof formSchema>;

const route = getRouteApi("/");

export function DataForm(props: { onSubmit: () => void }) {
  const navigate = route.useNavigate();
  const search = route.useSearch();

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chain: search.chain.toString(),
      tokens: search.tokens,
      accounts: search.accounts,
    },
  });

  // Networks are static; group them once into mainnets/testnets.
  const { mainnets, testnets } = useMemo(
    () => ({
      mainnets: sfMeta.networks.filter((n) => !n.isTestnet),
      testnets: sfMeta.networks.filter((n) => n.isTestnet),
    }),
    [],
  );

  // Must be `useWatch` (hook), NOT `form.watch()` (method): the React Compiler
  // memoizes the method call against the stable `form` object and freezes the
  // value, so the token list would stick to the initial network.
  const watchedChain = useWatch({
    control: form.control,
    name: "chain",
    defaultValue: search.chain.toString(),
  });
  const chainId = Number(watchedChain);

  function onSubmit(values: FormOutput) {
    form.clearErrors("root");
    const chainChanged = values.chain !== search.chain;
    navigate({
      // Block heights are chain-specific — drop the historical block on chain switch.
      search: { ...values, block: chainChanged ? null : search.block },
    });
    props.onSubmit();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () =>
          form.setError("root", {
            message: "Please double-check the addresses you entered.",
          }),
        )}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="chain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network</FormLabel>
              <Select
                value={field.value}
                onValueChange={(next) => {
                  field.onChange(next);
                  // Token addresses are chain-specific; clear them on switch.
                  form.setValue("tokens", []);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Mainnets</SelectLabel>
                    {mainnets.map((network) => (
                      <SelectItem
                        key={network.chainId.toString()}
                        value={network.chainId.toString()}
                      >
                        {network.humanReadableName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Testnets</SelectLabel>
                    {testnets.map((network) => (
                      <SelectItem
                        key={network.chainId.toString()}
                        value={network.chainId.toString()}
                      >
                        {network.humanReadableName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tokens</FormLabel>
              <FormControl>
                <TokenMultiSelect
                  key={chainId}
                  chainId={chainId}
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accounts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accounts</FormLabel>
              <FormControl>
                <AccountMultiSelect
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-red-500">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" className="float-end">
          Save selection
        </Button>
      </form>
    </Form>
  );
}
