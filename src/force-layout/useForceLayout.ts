import { useEffect } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { useReactFlow, ReactFlowState, useStore, Node } from "reactflow";
import collide from "./rectangleCollide";

type SimNodeType = SimulationNodeDatum & Node;

const elementCountSelector = (state: ReactFlowState) =>
  state.nodeInternals.size + state.edges.length;

const nodesInitializedSelector = (state: ReactFlowState) =>
  Array.from(state.nodeInternals.values()).every(
    (node) => node.width && node.height,
  ) && state.nodeInternals.size;

function useForceLayout(enable: boolean) {
  const elementCount = useStore(elementCountSelector);
  const nodesInitialized = useStore(nodesInitializedSelector);
  const { setNodes, getNodes, getEdges } = useReactFlow();

  useEffect(() => {
    if (!enable) {
      return;
    }

    const nodes = getNodes();
    const edges = getEdges();

    if (!nodes.length || !nodesInitialized) {
      return;
    }

    const simulationNodes: SimNodeType[] = nodes.map((node) => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
    }));

    const simulationLinks: SimulationLinkDatum<SimNodeType>[] = edges.map(
      (edge) => edge,
    );

    const simulation = forceSimulation()
      .nodes(simulationNodes)
      .force("charge", forceManyBody().strength(-150))
      .force(
        "link",
        forceLink(simulationLinks)
          .id((d: any) => d.id)
          .strength(0.003)
          .distance(500),
      )
      .force("x", forceX().x(0).strength(0.008))
      .force("y", forceY().y(0).strength(0.004))
      .force("collide", collide())
      .on("tick", () => {
        setNodes((nodes) =>
          nodes.map((node, i) => {
            const { x, y } = simulationNodes[i];

            if (node.dragging) {
              // Setting the fx/fy properties of a node tells the simulation to
              // "fix" the node at that position and ignore any forces that would
              // normally cause it to move.
              //
              // The node is still part of the simulation, though, and will push
              // other nodes around while the simulation runs.
              simulationNodes[i].fx = node.position.x;
              simulationNodes[i].fy = node.position.y;
            }

            return { ...node, position: { x: x ?? 0, y: y ?? 0 } };
          }),
        );
      });

    return () => {
      simulation.stop();
    };
  }, [elementCount, getNodes, getEdges, setNodes, nodesInitialized, enable]);
}

export default useForceLayout;
