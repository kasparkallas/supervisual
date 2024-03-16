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
import { useCallback, useMemo } from "react";
import { MyEdge, MyNode } from "./dataMapper";

type Props = {
  nodes: MyNode[];
  edges: MyEdge[];
};

import CustomNode from "./CustomNode";
import dagreLayout from "./auto-layout/algorithms/dagre";
import FloatingEdge from "./floating-edge/FloatingEdge";
import FloatingConnectionLine from "./floating-edge/FloatingConnectionLine";

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  floating: FloatingEdge as any, // todo: types
};

const proOptions: ProOptions = { account: "paid-pro", hideAttribution: true };

function Diagram(props: Props) {
  const { screenToFlowPosition } = useReactFlow();

  const layoutedElements = useMemo(
    () =>
      dagreLayout(props.nodes as any, props.edges, {
        direction: "TB",
        spacing: [200, 300],
      }),
    [props.nodes, props.edges],
  );

  useForceLayout(props.nodes.length < 75);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    layoutedElements.nodes,
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    layoutedElements.edges,
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      proOptions={proOptions}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      edgeTypes={edgeTypes}
      connectionLineComponent={FloatingConnectionLine as any} // todo: types
      minZoom={0.1}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}

export default Diagram;
