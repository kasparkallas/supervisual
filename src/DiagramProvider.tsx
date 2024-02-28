import { useQuery } from '@tanstack/react-query'

import { getBuiltGraphSDK } from "subgraph";

import Diagram from "./Diagram";

const sdk = getBuiltGraphSDK();

function DiagramProvider() {
    const result = useQuery({
        queryKey: ['ExampleQuery'], queryFn: () => sdk.AllRelevantEntities({
            // toLower
            account: "",
            token: "",
        })
    })

    return (
        <Diagram />
    )
}

export default DiagramProvider;