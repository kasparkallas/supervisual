import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  ProOptions,
  OnConnect,
  addEdge,
} from "reactflow";
import useForceLayout from "./force-layout/useForceLayout";

import "reactflow/dist/style.css";
import { useCallback, useEffect, useMemo } from "react";
import { MyEdge, MyNode } from "./dataMapper";

type Props = {
  nodes: MyNode[];
  edges: MyEdge[];
};

import CustomNode from "./CustomNode";
import dagreLayout from "./auto-layout/algorithms/dagre";
import FloatingEdge from "./floating-edge/FloatingEdge";
import FloatingConnectionLine from "./floating-edge/FloatingConnectionLine";
import useAutoLayout from "./auto-layout/useAutoLayout";

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  floating: FloatingEdge as any, // todo: types
};

const proOptions: ProOptions = { account: "paid-pro", hideAttribution: true };

function Diagram(props: Props) {
  const { screenToFlowPosition } = useReactFlow();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (props.nodes.length) {
      const { nodes, edges } = dagreLayout(props.nodes, props.edges, {
        direction: "TB",
        spacing: [200, 300],
      });
      return { nodes, edges };
    } else {
      return { nodes: [], edges: [] };
    }
  }, [props.edges, props.nodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // useEffect(() => {
  //   if (props.nodes.length) {
  //     const { nodes, edges } = dagreLayout(props.nodes, props.edges, {
  //       direction: "TB",
  //       spacing: [200, 300],
  //     });
  //     setNodes(nodes);
  //     setEdges(edges);
  //   } else {
  //     setNodes([]);
  //     setEdges([]);
  //   }
  // }, [props.nodes, props.edges, setNodes, setEdges]);

  useForceLayout(props.nodes.length < 75);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      proOptions={proOptions}
      nodeTypes={nodeTypes}
      fitView
      edgeTypes={edgeTypes}
      connectionLineComponent={FloatingConnectionLine as any} // todo: types
      minZoom={0.1}
    >
      <Background />
      {/* <Controls /> */}
    </ReactFlow>
  );
}

export default Diagram;
