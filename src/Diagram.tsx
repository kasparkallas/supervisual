import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Controls,
  MiniMap,
} from "reactflow";
import Dagre from "@dagrejs/dagre";

import "reactflow/dist/style.css";
import { useMemo } from "react";

type Props = {
  nodes: Node[];
  edges: Edge[];
};

const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  if (!nodes.length) {
    return { nodes, edges };
  }

  g.setGraph({
    rankdir: "TB",
    nodesep: 250,
    ranksep: 250,
    ranker: "longest-path",
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => g.setNode(node.id, node as any)); // TODO: fix types

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = g.node(node.id);
      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

function Diagram(props: Props) {
  const layoutedElements = useMemo(
    () => getLayoutedElements(props.nodes, props.edges),
    [props.nodes, props.edges],
  );

  const [nodes, , onNodesChange] = useNodesState(layoutedElements.nodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedElements.edges);

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={edges}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}

export default Diagram;
