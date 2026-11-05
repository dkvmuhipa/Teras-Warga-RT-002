import React from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

/**
 * Wraps React.lazy imports with automatic one-time page reload when a new deployment
 * invalidates old hashed chunk filenames (ChunkLoadError / Failed to fetch dynamically imported module).
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const storageKey = 'teras_rt02_chunk_retry';
    try {
      const module = await factory();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(storageKey);
      }
      return module;
    } catch (error) {
      if (typeof window !== 'undefined') {
        const alreadyRetried = sessionStorage.getItem(storageKey);
        if (!alreadyRetried) {
          sessionStorage.setItem(storageKey, '1');
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw error;
    }
  });
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kendala teknis saat memuat halaman.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    try {
      sessionStorage.removeItem('teras_rt02_chunk_retry');
    } catch {
      // ignore storage errors
    }
    window.location.reload();
  };

  handleGoHome = () => {
    try {
      sessionStorage.removeItem('teras_rt02_chunk_retry');
    } catch {
      // ignore storage errors
    }
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center mx-auto mb-5">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 mb-3">
              Pembaruan / Pemulihan Sistem
            </span>
            <h1 className="text-xl font-black text-slate-900 mb-2">
              Halaman Perlu Dimuat Ulang
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Sistem Teras Warga RT 002 baru saja diperbarui atau koneksi internet Anda sempat terputus saat membuka menu ini. Silakan muat ulang halaman untuk melanjutkan.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Sekarang
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Ke Beranda RT 002
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
