import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { PolkadotProvider } from './providers/PolkadotProvider';
import { WalletProvider } from './providers/WalletProvider';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import Institution from './pages/Institution';
import Verify from './pages/Verify';
import Institutions from './pages/Institutions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PolkadotProvider>
        <WalletProvider>
          <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/credentials" element={<Credentials />} />
                <Route path="/institution" element={<Institution />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/institutions" element={<Institutions />} />
              </Routes>
            </MainLayout>
          </Router>
          <Toaster position="top-right" richColors />
        </WalletProvider>
      </PolkadotProvider>
    </QueryClientProvider>
  );
}

export default App;