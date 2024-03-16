import { memo, useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";
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
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

const route = getRouteApi("/");

function CustomNode({ dragging, data }: NodeProps<MyNode>) {
  const navigate = useNavigate();
  const search = route.useSearch();

  return (
    <HoverCard
      openDelay={500}
      closeDelay={0}
      open={dragging ? false : undefined}
    >
      <HoverCardTrigger>
        <div
          className={cn(
            "rounded-xl border-2 border-stone-600 px-4 py-2 shadow-md",
            data.isPool
              ? "bg-amber-100"
              : data.isSuperApp
                ? "bg-pink-100"
                : "bg-white",
          )}
        >
          <Handle
            className="invisible"
            // className="invisible absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 transform"
            type="target"
            position={Position.Top}
          />
          <Handle
            className="invisible"
            // className="invisible absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 transform"
            type="source"
            position={Position.Bottom}
          />
          <div className="flex">
            <div className="ml-2">
              <div
                className={cn(
                  "font-mono text-lg",
                  data.isSelected ? "font-extrabold" : "",
                )}
              >
                {data?.label}
                <HoverCardPrimitive.Portal>
                  <HoverCardContent align="center">
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
                                    x.toLowerCase() !==
                                    data.address.toLowerCase(),
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
                </HoverCardPrimitive.Portal>
              </div>
            </div>
          </div>
        </div>
      </HoverCardTrigger>
    </HoverCard>
  );
}

export default memo(CustomNode);
