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
import { useQuery } from "@tanstack/react-query";

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

export function CustomNode2({ dragging, selected, data }: NodeProps<MyNode>) {
  const { data: profile } = useQuery({
    queryKey: ["ens", data.address],
    queryFn: () =>
      fetch(`https://ens.kasparkallas.com/address/${data.address}`).then((x) =>
        x.status === 200 ? (x.json() as unknown as ProfileResponse) : null,
      ),
  });

  const label = useMemo(() => {
    return (
      <span
        className={cn(
          "text-sm",
          !profile?.name ? "font-mono" : "",
          data.isSelected ? "font-extrabold" : "",
        )}
      >
        {profile?.name ?? data?.label}
      </span>
    );
  }, [data.label, data.isSelected, profile?.name]);

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
      height: "50px",
      width: "50px",
    };

    return (
      <div className="flex flex-col items-center gap-1">
        {profile?.avatar ? (
          <img
            className="rounded-full"
            style={basePaperStyles}
            src={profile.avatar.md}
          ></img>
        ) : (
          <Jazzicon
            paperStyles={basePaperStyles}
            seed={jsNumberForAddress(data.address)}
          />
        )}
        {label}
      </div>
    );
  }, [data, label, profile?.avatar]);

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
