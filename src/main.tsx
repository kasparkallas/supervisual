import React from "react";
import ReactDOM from "react-dom/client";
import {
  RouterProvider,
  SearchParser,
  SearchSerializer,
  createRouter,
} from "@tanstack/react-router";
import qs from "query-string";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const customStringifier: SearchSerializer = (
  searchObj: Record<string, any>,
) => {
  const stringified = qs.stringify(searchObj, {
    arrayFormat: "comma",
    sort: (a, b) => {
      // sort chain and tokens to the front
      if (a === "chain") {
        return -1;
      }
      if (b === "chain") {
        return 1;
      }
      if (a === "tokens") {
        return -1;
      }
      if (b === "tokens") {
        return 1;
      }
      return 0;
    },
  });
  return `?${stringified}`;
};

const customParser: SearchParser = (searchString: string) => {
  const parsed = qs.parse(searchString, { arrayFormat: "comma" });
  return parsed;
};

// Create a new router instance
const router = createRouter({
  routeTree,
  parseSearch: customParser,
  stringifySearch: customStringifier,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
