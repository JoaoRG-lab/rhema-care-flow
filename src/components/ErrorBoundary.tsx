import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Em produção, enviar para serviço de observabilidade (ex: Sentry)
    console.error('[ErrorBoundary] Erro capturado:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-red-100 p-4">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Algo deu errado</h2>
          <p className="max-w-sm text-sm text-gray-500">
            Ocorreu um erro inesperado. Nossa equipe foi notificada.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-2 max-w-lg overflow-auto rounded bg-gray-100 p-3 text-left text-xs text-gray-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="mt-2 rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
