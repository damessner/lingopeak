'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
  onDelete?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-5 space-y-3 text-xs select-none">
          <div className="flex items-center gap-2 text-red-400 font-extrabold uppercase tracking-wide">
            <span>⚠️ Question Card Crashed</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            An unexpected error occurred while rendering this editor card. This is usually caused by corrupted question properties.
          </p>
          {this.state.error && (
            <pre className="bg-black/40 border border-slate-900 rounded-lg p-2.5 text-[10px] text-red-300 overflow-x-auto max-w-full font-mono">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2 font-bold pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
            >
              Reset Card Data
            </button>
            {this.props.onDelete && (
              <button
                type="button"
                onClick={this.props.onDelete}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-350 px-3.5 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                Delete Question
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
