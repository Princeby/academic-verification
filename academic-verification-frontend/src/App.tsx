// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Suspense } from 'react';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import Institution from './pages/Institution';
import IssueCredential from './pages/IssueCredential';
import IssuedCredentials from './pages/IssuedCredentials';
import Verify from './pages/Verify';
import Institutions from './pages/Institutions';
import Settings from './pages/Settings';
import CreateDIDPage from './pages/CreateDIDPage';

// Error Boundary
import ErrorBoundary from './components/error/ErrorBoundary';

// UI
import { Spinner } from './components/ui/Spinner';

// Providers
import { PolkadotProvider } from './providers/PolkadotProvider';
import { WalletProvider } from './providers/WalletProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center">
      <Spinner size="lg" className="mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <PolkadotProvider>
          <WalletProvider>
            <Router>
              <Suspense fallback={<LoadingFallback />}>
                <MainLayout>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/verify" element={<Verify />} />
                    <Route path="/institutions" element={<Institutions />} />
                    
                    {/* User Routes */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/create-did" element={<CreateDIDPage />} />
                    <Route path="/credentials" element={<Credentials />} />
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Institution Routes */}
                    <Route path="/institution" element={<Institution />} />
                    <Route path="/institution/issue" element={<IssueCredential />} />
                    <Route path="/institution/issued" element={<IssuedCredentials />} />
                  </Routes>
                </MainLayout>
              </Suspense>
            </Router>
            <Toaster position="top-right" richColors />
          </WalletProvider>
        </PolkadotProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;