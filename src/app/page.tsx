"use client";

import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/common/ErrorBoundary";

const App = dynamic(() => import("../App"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFBF7]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#8A4C93] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600">Memuat Rumah CahayaQu...</p>
      </div>
    </div>
  ),
});

export default function Page() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}


