import { getBuiltGraphSDK } from "subgraph";

import Diagram from "./Diagram";
import { Panel, ReactFlowProvider } from "reactflow";
import { dataMapper } from "./dataMapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useQueries } from "@tanstack/react-query";
import { Config } from "./userInputSchema";
import { Button } from "./components/ui/button";
import { DataForm } from "./DataForm";
import { uniqBy } from "lodash";

const graphSDK = getBuiltGraphSDK({
  url: "https://optimism-mainnet.subgraph.x.superfluid.dev/",
});

type Props = Config;

function DataProvider({ accounts, token }: Props) {
  const hasEnoughInput = accounts.length && token;

  const queryResults = useQueries({
    queries: hasEnoughInput
      ? accounts.map((account) => ({
          queryKey: [account, token],
          queryFn: () =>
            graphSDK.AllRelevantEntities({
              account: account,
              token: token,
            }),
        }))
      : [],
  });

  console.log(queryResults);

  // todo: clean-up
  const results = !queryResults.some((x) => !x.data)
    ? queryResults
        .map((x) => x.data)
        .flat()
        .map((x) => dataMapper(accounts[0], x!))
        .reduce(
          (acc, curr) => {
            return {
              nodes: uniqBy([...acc.nodes, ...curr.nodes], (x) => x.id),
              edges: uniqBy([...acc.edges, ...curr.edges], (x) => x.id),
            };
          },
          { nodes: [], edges: [] },
        )
    : undefined;

  // todo: handle loading better

  return (
    <ReactFlowProvider>
      <Panel position="top-right">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="scale-95 rounded-full shadow-lg shadow-neutral-400 transition-transform hover:scale-100">
              Configure
            </Button>
          </DialogTrigger>
          <FormDialogContent />
        </Dialog>
      </Panel>
      {results && <Diagram nodes={results.nodes} edges={results.edges} />}
    </ReactFlowProvider>
  );
}

export default DataProvider;

// TODO: extract

const FormDialogContent = () => {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Select Token & Accounts</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <DataForm />
    </DialogContent>
  );
};
