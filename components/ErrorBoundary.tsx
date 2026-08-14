import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
    
    // Auto handle stale chunk / dynamic import cache mismatch error after Vercel deployment
    const isChunkError = 
      error?.name === 'ChunkLoadError' || 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Expected a JavaScript-or-Wasm module script');

    if (isChunkError && !sessionStorage.getItem('chunk_reload_attempted')) {
      sessionStorage.setItem('chunk_reload_attempted', 'true');
      window.location.reload();
    }
  }

  private handleReset = () => {
    sessionStorage.removeItem('chunk_reload_attempted');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 text-center">
            <div className="w-16 h-16 bg-rose-50 border-4 border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500 animate-bounce" />
            </div>
            
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Opps, Terjadi Kesalahan</h1>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed font-medium">
              Aplikasi mengalami kendala saat memuat modul atau data. Ini biasanya terjadi karena gangguan jaringan sementara atau pembaruan sistem.
            </p>

            {this.state.error && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-left font-mono text-[10px] text-slate-500 overflow-x-auto max-h-24">
                {this.state.error.toString()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                onClick={this.handleReset}
                id="btn-retry-error"
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white text-xs font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/15 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Muat Ulang
              </button>
              <button
                onClick={this.handleGoHome}
                id="btn-home-error"
                className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 text-xs font-bold py-3 px-4 rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
