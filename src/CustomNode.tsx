import { memo, useEffect, useMemo, useState } from "react";
import { Handle, NodeProps, NodeToolbar, Position } from "reactflow";
import { MyNode } from "./dataMapper";
import { cn } from "./lib/utils";
import { Button } from "./components/ui/button";
import copy from "copy-text-to-clipboard";
import { getRouteApi } from "@tanstack/react-router";
import { Address } from "viem";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import { useQuery } from "@tanstack/react-query";
import { useAddressDisplayInfo } from "./useAddressDisplayInfo";

const route = getRouteApi("/");

type ProfileResponse = {
  name: string;
  avatar?: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
};

export function CustomNode2({
  dragging,
  selected,
  data,
}: NodeProps<MyNode["data"]>) {
  const findDisplayInfo = !data.isSuperApp && !data.isPool;
  const addressDisplayInfo = useAddressDisplayInfo(
    findDisplayInfo ? data.address : undefined,
  );

  const label = useMemo(() => {
    return (
      <span
        className={cn(
          "text-sm",
          !addressDisplayInfo?.primaryName ? "font-mono" : "",
          data.isSelected ? "font-extrabold" : "",
        )}
      >
        {addressDisplayInfo?.primaryName ?? data?.label}
      </span>
    );
  }, [data.label, data.isSelected, addressDisplayInfo]);

  const look = useMemo(() => {
    if (data.isPool) {
      return (
        <div
          className={cn(
            "rounded-xl border-2 border-stone-600 bg-amber-100 px-4 py-2 shadow-md",
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs">GDA pool</span>
            {label}
          </div>
        </div>
      );
    }

    if (data.isSuperApp) {
      return (
        <div
          className={cn(
            "rounded-xl border-2 border-stone-600 bg-pink-100 px-4 py-2 shadow-md",
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs">SuperApp</span>
            {label}
          </div>
        </div>
      );
    }

    const basePaperStyles = {
      borderWidth: 2,
      borderRadius: "50%",
      borderColor: "black",
    };

    return (
      <div className="flex flex-col items-center gap-1">
        {addressDisplayInfo?.primaryAvatarUrl ? (
          <img
            className="h-[50px] w-[50px] rounded-full"
            style={basePaperStyles}
            src={addressDisplayInfo.primaryAvatarUrl}
          ></img>
        ) : (
          <Jazzicon
            paperStyles={basePaperStyles}
            diameter={50}
            seed={jsNumberForAddress(data.address)}
          />
        )}
        {label}
      </div>
    );
  }, [data, label, addressDisplayInfo]);

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

function CustomNode(props: NodeProps<MyNode["data"]>) {
  const { dragging, selected, data } = props;
  const navigate = route.useNavigate();

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
              href={
                data.isPool
                  ? `https://console.superfluid.finance/${data.chain!}/pools/${data.address}`
                  : `https://console.superfluid.finance/${data.chain!}/accounts/${data.address}`
              }
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
