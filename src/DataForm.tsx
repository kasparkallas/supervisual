import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "./components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "./components/ui/form";
import { Input } from "./components/ui/input";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ethereumAddressCollectionSchema } from "./userInputSchema";
import { Address } from "viem";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
import sfMeta from "@superfluid-finance/metadata";

const ethereumAddressFieldArraySchema = z
  .array(
    z.object({
      value: z.string().trim().optional(),
    }),
  )
  .transform((x) => x.filter((y) => y.value).map((y) => y.value))
  .pipe(ethereumAddressCollectionSchema);

const formSchema = z.object({
  chain: z.string().default("10").pipe(z.coerce.number()),
  tokens: ethereumAddressFieldArraySchema,
  accounts: ethereumAddressFieldArraySchema,
});

export type FormInput = z.input<typeof formSchema>;
export type FormOutput = z.output<typeof formSchema>;

const mapAddressesIntoFieldArray = (addresses: Address[]) => {
  return addresses.length
    ? addresses.map((x) => ({ value: x }))
    : [{ value: "" }];
};

const route = getRouteApi("/");

export function DataForm() {
  const navigate = useNavigate();
  const search = route.useSearch();

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chain: search.chain.toString(),
      tokens: mapAddressesIntoFieldArray(search.tokens),
      accounts: mapAddressesIntoFieldArray(search.accounts),
    },
  });

  const tokensFieldArray = useFieldArray({
    name: "tokens",
    control: form.control,
  });

  const accountsFieldArray = useFieldArray({
    name: "accounts",
    control: form.control,
  });

  function onSubmit(values: FormOutput) {
    navigate({
      search: values,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (e) => {
          // todo: handle better
          console.error(e);
        })}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="chain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Network</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {
                    // todo: optimize
                    sfMeta.networks.map((network) => (
                      <SelectItem
                        key={network.chainId.toString()}
                        value={network.chainId.toString()}
                      >
                        {network.humanReadableName}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel>Tokens</FormLabel>
          {/* <FormDescription>The tokens...</FormDescription> */}
          <div className="flex flex-col gap-1">
            {tokensFieldArray.fields.map((field, index) => (
              <FormField
                control={form.control}
                key={field.id}
                name={`tokens.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => tokensFieldArray.append({ value: "" })}
          >
            Add more
          </Button>
        </div>
        <div>
          <FormLabel>Accounts</FormLabel>
          {/* <FormDescription>The accounts...</FormDescription> */}
          <div className="flex flex-col gap-1">
            {accountsFieldArray.fields.map((field, index) => (
              <FormField
                control={form.control}
                key={field.id}
                name={`accounts.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => accountsFieldArray.append({ value: "" })}
          >
            Add more
          </Button>
        </div>
        <Button type="submit" className="float-end">
          Save selection
        </Button>
      </form>
    </Form>
  );
}
