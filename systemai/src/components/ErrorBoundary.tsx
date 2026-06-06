import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded-xl border border-red-700 bg-red-950/60 p-6 text-red-100">
          <h2 className="text-lg font-semibold">Rendering failure</h2>
          <p className="mt-2 text-sm">{this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
