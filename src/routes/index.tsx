import DataProvider from "@/DataProvider";
import { urlSchema } from "@/userInputSchema";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: urlSchema,
});

function Index() {
  const search = Route.useSearch();

  return <DataProvider {...search} />;
}
