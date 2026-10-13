import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render failure', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <p role="alert" className="state state-error">
          This section failed to render.
        </p>
      );
    }
    return this.props.children;
  }
}
