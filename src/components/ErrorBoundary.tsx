import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Em dev loga o stack; em produção evita vazar detalhes
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
          <div className="text-4xl">⚽</div>
          <h1 className="text-xl font-black text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          {import.meta.env.DEV && (
            <pre className="text-xs text-destructive bg-muted p-3 rounded-lg max-w-sm overflow-auto text-left">
              {this.state.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="btn-gold px-6 py-3 rounded-xl font-bold text-sm"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
