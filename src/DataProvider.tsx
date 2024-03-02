import { useQuery } from "@tanstack/react-query";

import { getBuiltGraphSDK } from "subgraph";

import Diagram from "./Diagram";
import { ReactFlowProvider } from "reactflow";
import { UserInput } from "./userInputSchema";
import { dataMapper } from "./dataMapper";

const sdk = getBuiltGraphSDK({
  url: "https://polygon-mumbai.subgraph.x.superfluid.dev/",
});

type Props = UserInput;

function DataProvider({ account, token }: Props) {
  const result = useQuery({
    // todo, query key based on account and token
    queryKey: [account, token],
    queryFn: () =>
      sdk.AllRelevantEntities({
        account: account,
        token: token,
      }),
    select: (data) => dataMapper(account, data),
  });

  // todo: handle loading better

  return (
    <ReactFlowProvider>
      {result.data && (
        <Diagram nodes={result.data.nodes} edges={result.data.edges} />
      )}
    </ReactFlowProvider>
  );
}

export default DataProvider;
