import { useQuery } from "@tanstack/react-query";

import { getBuiltGraphSDK, AllRelevantEntitiesQuery } from "subgraph";

import Diagram from "./Diagram";
import { Input } from "./routes";

const sdk = getBuiltGraphSDK();

type Props = Input;

function DiagramProvider({ account, token }: Props) {
  const result = useQuery({
    // todo, query key based on account and token
    queryKey: [account, token],
    queryFn: () =>
      sdk.AllRelevantEntities({
        account: account,
        token: token,
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
