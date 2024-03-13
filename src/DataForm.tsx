import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { FormInput, FormOutput, formSchema } from "./userInputSchema";
import { Button } from "./components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from "./components/ui/form";
import { Input } from "./components/ui/input";
import { getRouteApi, useNavigate } from "@tanstack/react-router";

const route = getRouteApi("/");

export function DataForm() {
  const navigate = useNavigate();
  const search = route.useSearch();

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: search.token,
      accounts: search.accounts.length
        ? search.accounts.map((x) => ({ value: x }))
        : [{ value: "" }],
    },
  });

  const { fields, append } = useFieldArray({
    name: "accounts",
    control: form.control,
  });

  function onSubmit(values: FormOutput) {
    navigate({
      search: values,
    });
  }

  console.log(form.getValues());

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (e) => {
          console.error(e);
        })}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token</FormLabel>
              <FormDescription>The token...</FormDescription>
              <FormControl>
                <Input placeholder="0x..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel>Accounts</FormLabel>
          <FormDescription>The accounts...</FormDescription>
          {fields.map((field, index) => (
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append({ value: "" })}
          >
            Add account
          </Button>
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
