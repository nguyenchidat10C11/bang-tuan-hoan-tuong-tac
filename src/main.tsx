import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050a16] text-slate-100 p-6">
          <div className="max-w-md rounded-2xl border border-rose-400/40 bg-slate-900/80 p-5 text-sm space-y-2">
            <h1 className="text-base font-bold text-rose-300">
              Không thể khởi chạy ứng dụng
            </h1>
            <p className="text-slate-300">{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
