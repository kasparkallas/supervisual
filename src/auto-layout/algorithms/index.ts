import { type Node, type Edge } from "reactflow";

import dagre from "./dagre";

// the layout direction (T = top, R = right, B = bottom, L = left, TB = top to bottom, ...)
export type Direction = "TB" | "LR" | "RL" | "BT";

export type LayoutAlgorithmOptions = {
  direction: Direction;
  spacing: [number, number];
};

export type LayoutAlgorithm = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutAlgorithmOptions,
) => { nodes: Node[]; edges: Edge[] };

export default {
  dagre,
};
