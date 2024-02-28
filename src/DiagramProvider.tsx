import { useQuery } from "@tanstack/react-query";

import { getBuiltGraphSDK, AllRelevantEntitiesQuery } from "subgraph";

import Diagram from "./Diagram";

const sdk = getBuiltGraphSDK();

function DiagramProvider() {
  const result = useQuery({
    // todo, query key based on account and token
    queryKey: ["ExampleQuery"],
    queryFn: () =>
      sdk.AllRelevantEntities({
        // toLower
        account: "",
        token: "",
      }),
    // select: (data) => {
    //     data.
    // }
  });

  return <Diagram />;
}

export default DiagramProvider;

// # Utils
const mapper = (chainId: number, data: AllRelevantEntitiesQuery) => {
  return {};
};
