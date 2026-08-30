"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
    // Hard refresh if needed or soft state reset
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleCopyError = () => {
    if (this.state.error) {
      const errorText = `Error: ${this.state.error.toString()}\nStack: ${this.state.errorInfo?.componentStack || ''}`;
      navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 antialiased">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E0D8CC] shadow-xl p-6 sm:p-8 text-center space-y-6">
            
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* Error Message Header */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-brand-dark tracking-tight">
                Terjadi Kendala Teknis
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Aplikasi mengalami kesalahan yang tidak terduga. Jangan khawatir, data Anda tetap aman. Silakan coba muat ulang halaman ini.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-primary/20 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                Muat Ulang Halaman
              </button>

              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = "/";
                  }
                }}
                className="w-full py-2.5 px-4 bg-[#FAF8F5] hover:bg-[#F2ECE3] text-brand-dark rounded-xl text-xs font-bold border border-[#E0D8CC] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4 text-gray-500" />
                Kembali ke Beranda
              </button>
            </div>

            {/* Expandable Technical Details */}
            <div className="border-t border-gray-100 pt-4 text-left">
              <button
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-400 hover:text-gray-600 cursor-pointer py-1"
              >
                <span>Rincian Teknis Error (QA / Debug)</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 space-y-2 animate-fadeIn">
                  <div className="p-3 bg-gray-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-40 leading-tight">
                    <p className="font-bold text-red-400 mb-1">{this.state.error?.toString()}</p>
                    <pre className="whitespace-pre-wrap text-gray-300 text-[9px] font-mono">
                      {this.state.errorInfo?.componentStack || "Tidak ada rincian komponen."}
                    </pre>
                  </div>

                  <button
                    onClick={this.handleCopyError}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary hover:underline cursor-pointer ml-auto"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Berhasil Disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Detail Error</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
