import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import Institution from './pages/Institution';
import IssueCredential from './pages/IssueCredential';
import Verify from './pages/Verify';
import Institutions from './pages/Institutions';
import ErrorBoundary from './components/error/ErrorBoundary';
import { Suspense } from 'react';
import { Spinner } from './components/ui/Spinner';
import Settings from './pages/Settings';

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
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/credentials" element={<Credentials />} />
                <Route path="/institution" element={<Institution />} />
                <Route path="/institution/issue" element={<IssueCredential />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/institutions" element={<Institutions />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </MainLayout>
          </Suspense>
        </Router>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;