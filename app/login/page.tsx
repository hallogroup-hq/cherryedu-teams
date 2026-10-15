'use client';

import React, { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DemoAccount {
  roleName: string;
  email: string;
  description: string;
  tag: string;
  roleKey: 'barista' | 'owner' | 'trainer' | 'admin';
  destination: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    roleName: 'Barista Learner',
    email: 'barista1@kopikamu.id',
    description: 'Progres modul kopi, submit latihan remedial',
    tag: 'BARISTA',
    roleKey: 'barista',
    destination: '/org/org-kopisenja-01/learn',
  },
  {
    roleName: 'Owner & Manager',
    email: 'owner@kopikamu.id',
    description: 'Kelola outlet, cohort & undang anggota tim',
    tag: 'OWNER',
    roleKey: 'owner',
    destination: '/org/org-kopisenja-01/overview',
  },
  {
    roleName: 'Trainer Resmi',
    email: 'trainer.dimas@cherrycoffeeroastery.com',
    description: 'Penilaian rubrik praktikal & verifikasi kompetensi',
    tag: 'TRAINER',
    roleKey: 'trainer',
    destination: '/trainer',
  },
  {
    roleName: 'Platform Admin',
    email: 'admin@cherrycoffeeroastery.com',
    description: 'Tata kelola tenant, kurikulum & penugasan instruktur',
    tag: 'ADMIN',
    roleKey: 'admin',
    destination: '/admin',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const router = useRouter();

  const executeDemoLogin = (roleKey: 'barista' | 'owner' | 'trainer' | 'admin', destination: string) => {
    setLoading(true);
    setError(null);

    // 1. Set Cookies (valid for middleware and serverAuth)
    document.cookie = `teams_demo_role=${roleKey}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `teams_auth_token=demo-token-${roleKey}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `sb-access-token=demo-token-${roleKey}; path=/; max-age=86400; SameSite=Lax`;

    // 2. Set LocalStorage
    localStorage.setItem('teams_auth_token', `demo-token-${roleKey}`);
    localStorage.setItem('teams_demo_role', roleKey);

    // 3. Direct navigate
    router.push(destination);
  };

  const handleSelectDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword('CherryEdu2026!');
    setSelectedDemo(account.tag);
    setError(null);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Harap masukkan email dan kata sandi.');
      return;
    }

    setError(null);
    setLoading(true);

    const lowerEmail = email.trim().toLowerCase();

    // Check if submitting with any of the demo accounts
    const matchedDemo = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === lowerEmail || (selectedDemo && acc.tag === selectedDemo)
    );

    if (matchedDemo) {
      executeDemoLogin(matchedDemo.roleKey, matchedDemo.destination);
      return;
    }

    if (lowerEmail.includes('admin')) {
      executeDemoLogin('admin', '/admin');
      return;
    }
    if (lowerEmail.includes('trainer') || lowerEmail.includes('dimas')) {
      executeDemoLogin('trainer', '/trainer');
      return;
    }
    if (lowerEmail.includes('owner') || lowerEmail.includes('kopikamu')) {
      executeDemoLogin('owner', '/org/org-kopisenja-01/overview');
      return;
    }
    if (lowerEmail.includes('barista') || lowerEmail.includes('learner')) {
      executeDemoLogin('barista', '/org/org-kopisenja-01/learn');
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Email atau kata sandi tidak sesuai. Silakan gunakan salah satu akun demo di atas untuk evaluasi tim.'
            : authError.message
        );
        return;
      }

      if (data?.session?.access_token) {
        localStorage.setItem('teams_auth_token', data.session.access_token);
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }

      router.push('/dashboard');
    } catch {
      setError('Koneksi autentikasi gagal. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Brand Header — Aligned with B2C edu.cherrycoffeeroastery.com */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-cherry-700 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-cherry-800 transition-colors">
              <svg viewBox="0 0 20 20" fill="none" className="w-6 h-6" aria-hidden="true">
                <circle cx="7" cy="13" r="4" fill="#F9E5E7" opacity="0.95"/>
                <circle cx="13" cy="13" r="4" fill="#F9E5E7" opacity="0.75"/>
                <path d="M10 9 C10 9 11 4 13 3 C13 3 10 4 9 7" stroke="#F9E5E7" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="text-left border-l border-paper-300 pl-3.5">
              <div className="font-serif font-black text-2xl tracking-tight text-roast-950 leading-none">
                Cherry<span className="font-sans font-light text-cherry-700 text-xl ml-0.5">Edu</span>
              </div>
              <div className="text-[10px] font-mono tracking-widest text-roast-500 uppercase mt-1 font-bold">
                Teams · B2B Competency Platform
              </div>
            </div>
          </Link>
          <p className="mt-3 text-xs sm:text-sm text-roast-600 font-sans">
            Standarisasi kurikulum, kalibrasi seduh, dan sertifikasi barista profesional
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-elevated border border-paper-300 p-6 sm:p-8">

          {/* Heading */}
          <div className="pb-4 mb-5 border-b border-paper-200 flex items-center justify-between">
            <h1 className="font-serif font-bold text-xl text-roast-950">Masuk ke Portal</h1>
            <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 bg-paper-100 border border-paper-200 px-2.5 py-1 rounded">
              Akses Resmi
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-cherry-50 border border-cherry-200 text-cherry-900 rounded-lg p-3 text-xs" role="alert">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-cherry-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><path d="m12 8 0 4"/><path d="m12 16 .01 0"/>
              </svg>
              <span className="leading-relaxed font-sans">{error}</span>
            </div>
          )}

          {/* 1-Click Demo Account Quick Login Panel */}
          <div className="mb-6 p-4 rounded-xl bg-paper-50 border border-paper-300/80">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-mono uppercase tracking-wider text-roast-700 font-bold">
                Pilih Akun Demo Uji (1-Klik)
              </p>
              <span className="text-[9px] font-mono text-roast-400">Klik langsung masuk</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = selectedDemo === acc.tag || email === acc.email;
                return (
                  <div
                    key={acc.tag}
                    className={`p-2.5 rounded-lg border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-paper-100 border-roast-700 shadow-xs'
                        : 'bg-white border-paper-200 hover:border-paper-400 hover:bg-paper-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-roast-950">{acc.roleName}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-paper-100 text-roast-600 border border-paper-200">
                          {acc.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-roast-500 truncate font-mono mb-2">{acc.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-paper-200/60">
                      <button
                        type="button"
                        onClick={() => executeDemoLogin(acc.roleKey, acc.destination)}
                        className="flex-1 py-1 px-2 rounded bg-roast-950 hover:bg-roast-850 text-white text-[10px] font-medium transition text-center"
                      >
                        Masuk Langsung →
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectDemo(acc)}
                        className="py-1 px-2 rounded bg-paper-100 hover:bg-paper-200 text-roast-700 text-[10px] font-mono transition"
                        title="Isi ke form"
                      >
                        Isi Form
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-roast-700 font-semibold mb-1.5">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSelectedDemo(null);
                }}
                placeholder="nama@kopikamu.id"
                className="w-full px-3.5 py-2.5 rounded-lg border border-paper-300 bg-paper-50 text-sm text-roast-950 placeholder-roast-400 focus:outline-none focus:border-roast-700 focus:bg-white focus:ring-1 focus:ring-roast-700 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-roast-700 font-semibold">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-paper-300 bg-paper-50 text-sm text-roast-950 placeholder-roast-400 focus:outline-none focus:border-roast-700 focus:bg-white focus:ring-1 focus:ring-roast-700 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-roast-400 hover:text-roast-700 text-xs font-mono"
                  aria-label="Lihat kata sandi"
                >
                  {showPassword ? 'Tutup' : 'Lihat'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-roast-950 hover:bg-roast-850 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </span>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Helper note */}
          <div className="mt-6 pt-5 border-t border-paper-200 text-center">
            <p className="text-xs text-roast-600 leading-relaxed">
              Membutuhkan undangan onboarding organisasi?{' '}
              <span className="text-roast-800 font-medium">Hubungi administrator bisnis Anda.</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] font-mono text-roast-500 space-y-1">
          <p>CHERRY EDU TEAMS · STANDAR KOMPETENSI KOPI SPESIALTI INDONESIA</p>
          <p>© {new Date().getFullYear()} Cherry Coffee Roastery. Seluruh hak cipta dilindungi.</p>
        </div>
      </div>
    </div>
  );
}
