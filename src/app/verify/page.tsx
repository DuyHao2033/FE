"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export default function VerifySearchPage() {
  const [certCode, setCertCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certCode.trim()) return;

    setIsLoading(true);
    router.push(`/verify/${certCode.trim()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_32px_120px_rgba(15,23,42,0.12)]">
        {/* Header section with gradient */}
        <div className="bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 px-8 py-10 text-white text-center">
          <div className="flex flex-col items-center">
            {/* Logo Placeholder */}
            <div className={`mb-6 flex items-center justify-center ${!logoError ? '' : 'rounded-2xl bg-white/15 backdrop-blur-md shadow-inner border border-white/20 p-4'}`}>
              {!logoError ? (
                <img 
                  src="/certificate/logo.png" 
                  alt="SIU Logo" 
                  className="h-24 w-auto object-contain transition-opacity"
                  onError={() => {
                    setLogoError(true);
                  }}
                />
              ) : (
                <ShieldCheck className="h-12 w-12" />
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-3">
              Hệ thống xác thực văn bằng
            </h1>
          </div>
          <p className="text-sky-100 text-lg max-w-md mx-auto leading-relaxed">
            Nhập mã số văn bằng hoặc chứng chỉ của bạn để bắt đầu quá trình tra cứu và xác thực thông tin.
          </p>
        </div>

        {/* Form section */}
        <div className="p-8 sm:p-12">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="relative group">
              <label 
                htmlFor="cert-code" 
                className="block text-sm font-semibold text-slate-700 mb-2 ml-1"
              >
                Mã văn bằng / chứng chỉ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                </div>
                <input
                  id="cert-code"
                  type="text"
                  value={certCode}
                  onChange={(e) => setCertCode(e.target.value)}
                  placeholder="Ví dụ: DEG-2024-0001"
                  autoComplete="off"
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-900 text-lg placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !certCode.trim()}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none group"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Kiểm tra văn bằng
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Guidelines / Help */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
              Hướng dẫn tra cứu
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                <div className="h-5 w-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                Tìm mã văn bằng được in trên văn bản hoặc chứng chỉ gốc.
              </li>
              <li className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                <div className="h-5 w-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                Nhập chính xác mã số vào khung tìm kiếm bên trên.
              </li>
              <li className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                <div className="h-5 w-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                Nhấn "Kiểm tra văn bằng" để xem thông tin chi tiết và bản xem trước PDF.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-100 px-8 py-4 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} SIU Digital Certificate Verification System.
          </p>
        </div>
      </div>
    </div>
  );
}
