import { memo, useEffect, useMemo, useState } from "react";
import { Handle, NodeProps, NodeToolbar, Position } from "reactflow";
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
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";

const route = getRouteApi("/");

export function CustomNode2({ dragging, selected, data }: NodeProps<MyNode>) {
  const label = useMemo(() => {
    return (
      <span
        className={cn(
          "font-mono text-sm",
          data.isSelected ? "font-extrabold" : "",
        )}
      >
        {data?.label}
      </span>
    );
  }, [data.label, data.isSelected]);

  const look = useMemo(() => {
    if (data.isPool) {
      return (
        <div
          className={cn(
            "rounded-xl border-2 border-stone-600 bg-amber-100 px-4 py-2 shadow-md",
          )}
        >
          {label}
        </div>
      );
    }

    if (data.isSuperApp) {
      return (
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              "rounded-full border-2 border-stone-600 bg-pink-100 px-4 py-2 shadow-md",
            )}
          >
            {label}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <Jazzicon
          paperStyles={{
            "border-width": 2,
            "border-radius": "50%",
            "border-color": "black",
          }}
          diameter={50}
          seed={jsNumberForAddress(data.address)}
        />
        {label}
      </div>
    );
  }, [data, label]);

  return (
    <>
      {look}
      <Handle
        className="invisible absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 transform"
        type="target"
        position={Position.Top}
      />
      <Handle
        className="invisible absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 transform"
        type="source"
        position={Position.Bottom}
      />
    </>
  );
}

function CustomNode(props: NodeProps<MyNode>) {
  const { dragging, selected, data } = props;
  const navigate = useNavigate();

  const search = route.useSearch();

  const [isVisible, setIsVisible] = useState(selected);

  useEffect(() => {
    if (!isVisible && selected && !dragging) {
      const timeout = setTimeout(() => {
        setIsVisible(true);
      }, 250);

      return () => clearTimeout(timeout);
    } else {
      setIsVisible(false);
    }
  }, [selected, dragging]);

  return (
    <>
      <CustomNode2 {...props} />
      <NodeToolbar isVisible={isVisible} position={Position.Bottom}>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            className="text-xs"
            variant="outline"
            onClick={() => copy(data.address)}
          >
            Copy address
          </Button>
          {!data.isSelected ? (
            <Button
              size="sm"
              className="text-xs"
              variant="outline"
              onClick={() => {
                navigate({
                  search: {
                    ...search,
                    accounts: [...search.accounts, data.address as Address],
                  },
                });
              }}
            >
              Add to selection
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-xs"
              variant="outline"
              onClick={() => {
                navigate({
                  search: {
                    ...search,
                    accounts: search.accounts.filter(
                      (x) => x.toLowerCase() !== data.address.toLowerCase(),
                    ),
                  },
                });
              }}
            >
              Remove from selection
            </Button>
          )}
          <Button size="sm" className="text-xs" variant="outline" asChild>
            <a
              target="_blank"
              href={`https://console.superfluid.finance/${data.chain!}/accounts/${data.address}`}
            >
              View in Console
            </a>
          </Button>
        </div>
      </NodeToolbar>
    </>

    // <HoverCard openDelay={0} closeDelay={0} open={!dragging && selected}>
    //   <HoverCardTrigger>
    //     <HoverCardPrimitive.Portal>
    //       <HoverCardContent align="center">
    //         <div className="flex flex-col gap-3">
    //           <Button onClick={() => copy(data.address)}>
    //             Copy address
    //           </Button>
    //           {!data.isSelected ? (
    //             <Button
    //               onClick={() => {
    //                 navigate({
    //                   search: {
    //                     ...search,
    //                     accounts: [
    //                       ...search.accounts,
    //                       data.address as Address,
    //                     ],
    //                   },
    //                 });
    //               }}
    //             >
    //               Add to selection
    //             </Button>
    //           ) : (
    //             <Button
    //               onClick={() => {
    //                 navigate({
    //                   search: {
    //                     ...search,
    //                     accounts: search.accounts.filter(
    //                       (x) =>
    //                         x.toLowerCase() !==
    //                         data.address.toLowerCase(),
    //                     ), // todo: clean-up
    //                   },
    //                 });
    //               }}
    //             >
    //               Remove from selection
    //             </Button>
    //           )}
    //           <Button asChild>
    //             <a
    //               target="_blank"
    //               href={`https://console.superfluid.finance/${data.chain!}/accounts/${data.address}`}
    //             >
    //               View in Console
    //             </a>
    //           </Button>
    //         </div>
    //       </HoverCardContent>
    //     </HoverCardPrimitive.Portal>
    //   </HoverCardTrigger>
    // </HoverCard>
  );
}

export default memo(CustomNode);
