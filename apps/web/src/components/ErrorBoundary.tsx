import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f9fafb',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '0.75rem',
              padding: '2rem 2.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              maxWidth: '480px',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {this.state.error || 'An unexpected error occurred. Please reload the page.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: '' });
                window.location.href = '/';
              }}
              style={{
                padding: '0.5rem 1.25rem',
                background: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
