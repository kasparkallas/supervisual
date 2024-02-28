import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

import 'reactflow/dist/style.css';

const queryClient = new QueryClient()

const initNodes = [
  {
    id: 'a',
    data: { label: 'Node A' },
    position: { x: 250, y: 0 },
  },
  {
    id: 'b',
    data: { label: 'Node B' },
    position: { x: 100, y: 100 },
  },
];

const initEdges = [
  {
    id: 'a-b',
    source: 'a',
    target: 'b',
  },
];

function App() {
  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  return (<QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
  );
}

export default App;
