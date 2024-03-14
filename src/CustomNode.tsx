import React, { memo } from "react";
import { Handle, Position } from "reactflow";
import { MyNode } from "./dataMapper";
import { cn } from "./lib/utils";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./components/ui/hover-card";
import { Button } from "./components/ui/button";
import copy from "copy-text-to-clipboard";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Address } from "viem";

const route = getRouteApi("/");

function CustomNode({ data }: MyNode) {
  const navigate = useNavigate();
  const search = route.useSearch();

  return (
    <div
      className={cn(
        "rounded-md border-2 border-stone-600 px-4 py-2 shadow-md",
        data.isPool ? "bg-amber-100" : "bg-white",
      )}
    >
      <div className="flex">
        <div className="ml-2">
          <div
            className={cn(
              "font-mono text-lg",
              data.isSelected ? "font-extrabold" : "",
            )}
          >
            <HoverCard>
              <HoverCardTrigger>{data?.label}</HoverCardTrigger>
              <HoverCardContent>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => copy(data.address)}>
                    Copy address
                  </Button>
                  {!data.isSelected ? (
                    <Button
                      onClick={() => {
                        navigate({
                          search: {
                            ...search,
                            accounts: [
                              ...search.accounts,
                              data.address as Address,
                            ],
                          },
                        });
                      }}
                    >
                      Add to selection
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        navigate({
                          search: {
                            ...search,
                            accounts: search.accounts.filter(
                              (x) =>
                                x.toLowerCase() !== data.address.toLowerCase(),
                            ), // todo: clean-up
                          },
                        });
                      }}
                    >
                      Remove from selection
                    </Button>
                  )}
                  <Button asChild>
                    <a
                      target="_blank"
                      href={`https://console.superfluid.finance/${data.chain!}/accounts/${data.address}`}
                    >
                      View in Console
                    </a>
                  </Button>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(CustomNode);
