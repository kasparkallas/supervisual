import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import DiagramProvider from './DiagramProvider';

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <DiagramProvider />
        </QueryClientProvider>
    )
}

export default App;