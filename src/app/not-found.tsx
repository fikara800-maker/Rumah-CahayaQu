export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-[#FAF8F5]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#E0D8CC] shadow-xl p-6 sm:p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#2D232E]">404 - Halaman Tidak Ditemukan</h2>
        <p className="text-xs text-gray-500">Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.</p>
        <a
          href="/"
          className="inline-block py-2.5 px-5 bg-[#8A4C93] hover:bg-[#8A4C93]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

