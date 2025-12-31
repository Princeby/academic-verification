// src/components/error/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center space-x-2 text-destructive mb-2">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>Application Error</CardTitle>
              </div>
              <CardDescription>
                Something went wrong. Please try refreshing the page or returning home.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="font-semibold text-sm mb-2">Error Message:</p>
                  <pre className="text-xs overflow-x-auto bg-background p-2 rounded">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
              
              {this.state.errorInfo && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-semibold mb-2 text-muted-foreground hover:text-foreground">
                    Stack Trace (click to expand)
                  </summary>
                  <pre className="text-xs overflow-x-auto bg-muted p-4 rounded mt-2">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.handleReset} className="flex-1">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                If this problem persists, please contact support or check the browser console for more details.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;