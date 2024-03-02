import DataProvider from "@/DataProvider";
import { userInputSchema } from "@/userInputSchema";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: userInputSchema,
});

function Index() {
  const search = Route.useSearch();

  return <DataProvider {...search} />;
}
