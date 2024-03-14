import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Controls,
  MiniMap,
  useReactFlow,
  ProOptions,
  NodeOrigin,
  OnConnect,
  addEdge,
} from "reactflow";
import useForceLayout from "./useForceLayout";

import "reactflow/dist/style.css";
import { useCallback, useMemo } from "react";
import { MyEdge, MyNode } from "./dataMapper";
import Dagre from "@dagrejs/dagre";

type Props = {
  nodes: MyNode[];
  edges: MyEdge[];
};

import CustomNode from "./CustomNode";

const nodeTypes = {
  custom: CustomNode,
};

// const nodeOrigin: NodeOrigin = [0.5, 0.5]; // what is this?

const proOptions: ProOptions = { account: "paid-pro", hideAttribution: true };

function Diagram(props: Props) {
  const { screenToFlowPosition } = useReactFlow();

  const layoutedElements = useMemo(
    () => getLayoutedElements(props.nodes, props.edges),
    [props.nodes, props.edges],
  );

  useForceLayout();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    layoutedElements.nodes,
  ); // todo: fix types
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
      // onPaneClick={onPaneClick}
      // nodeOrigin={nodeOrigin}
      nodeTypes={nodeTypes}
      fitView
      // defaultViewport={{
      //   x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
      //   y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
      //   zoom: 0,
      // }}
    >
      <Background />
      <Controls />
      {/* <MiniMap /> */}
    </ReactFlow>
  );
}

export default Diagram;

// # Dagre stuff
const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (
  nodes: MyNode[],
  edges: MyEdge[],
): {
  nodes: Node[];
  edges: Edge[];
} => {
  if (!nodes.length) {
    return { nodes: [], edges };
  }

  g.setGraph({
    rankdir: "TB",
    nodesep: 200,
    ranksep: 300,
    ranker: "longest-path",
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => g.setNode(node.id, node));

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = g.node(node.id);
      return { ...node, position: { x, y } };
    }),
    edges,
  };
};
