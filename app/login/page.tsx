"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError("Email atau password tidak valid. Coba lagi.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-roast-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-10 text-center">
          <Link href="https://edu.cherrycoffeeroastery.com" className="inline-flex items-center gap-3 group mb-5">
            <div className="w-10 h-10 rounded-lg bg-cherry-700 flex items-center justify-center shrink-0 group-hover:bg-cherry-600 transition-colors">
              <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden>
                <circle cx="7" cy="13" r="4" fill="#F9E5E7" opacity="0.9"/>
                <circle cx="13" cy="13" r="4" fill="#F9E5E7" opacity="0.7"/>
                <path d="M10 9 C10 9 11 4 13 3 C13 3 10 4 9 7" stroke="#F9E5E7" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col border-l border-roast-800 pl-3 text-left">
              <span className="font-serif font-black text-2xl tracking-tight text-paper-100 leading-none">
                Cherry<span className="font-sans font-light text-cherry-400 text-xl ml-0.5">Edu</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-roast-500 uppercase mt-0.5">Teams Platform</span>
            </div>
          </Link>
          <p className="text-xs text-roast-500 font-sans leading-relaxed">
            Masuk untuk mengakses platform pelatihan kompetensi barista
          </p>
        </div>

        {/* Card */}
        <div className="bg-roast-900 border border-roast-800 rounded-2xl p-6 sm:p-8 shadow-elevated">
          <div className="pb-4 mb-5 border-b border-roast-800">
            <h1 className="font-serif font-bold text-xl text-paper-100">Masuk ke Akun</h1>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-cherry-950 border border-cherry-900 text-cherry-300 rounded-lg px-3.5 py-2.5 text-xs" role="alert">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><path d="m12 8 0 4"/><path d="m12 16 .01 0"/>
              </svg>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="kamu@kopikamu.id"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-roast-600 leading-relaxed">
            Belum punya akun?{" "}
            <span className="text-roast-500">Hubungi admin organisasimu untuk mendapat undangan.</span>
          </p>
        </div>

        <p className="mt-6 text-center text-[10px] font-mono text-roast-700 uppercase tracking-wider">
          Cherry Edu Teams · Platform B2B Kompetensi Kopi
        </p>
      </div>
    </div>
  );
}
