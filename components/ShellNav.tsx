'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ExternalLink,
  Sparkles,
  Coffee,
  Building2,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import PersonaSwitcherModal from './PersonaSwitcherModal';

interface NavItem {
  label: string;
  href: string;
}

interface ShellNavProps {
  role?: 'barista' | 'owner' | 'trainer' | 'admin';
  orgId?: string;
  orgName?: string;
  userName?: string;
}

const roleNav: Record<string, NavItem[]> = {
  barista: [],
  owner: [],
  trainer: [{ label: 'Daftar Cohort', href: '/trainer' }],
  admin: [
    { label: 'Dasbor', href: '/admin' },
    { label: 'Organisasi', href: '/admin/organizations' },
  ],
};

const ROLE_BADGES = {
  barista: { title: 'Barista Learner', color: 'bg-crema-100 text-roast-900 border-crema-300' },
  owner: { title: 'Owner & Manager', color: 'bg-paper-200 text-roast-900 border-paper-400' },
  trainer: { title: 'Instruktur Resmi', color: 'bg-cherry-50 text-cherry-900 border-cherry-200' },
  admin: { title: 'Platform Admin', color: 'bg-roast-950 text-white border-roast-800' },
};

export default function ShellNav({
  role = 'barista',
  orgId = 'org-kopisenja-01',
  orgName = 'Kopi Senja Utama',
  userName,
}: ShellNavProps) {
  const pathname = usePathname();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const navItems: NavItem[] =
    role === 'owner' && orgId
      ? [
          { label: 'Ringkasan & Tim', href: `/org/${orgId}/overview` },
          { label: 'Portal Barista', href: `/org/${orgId}/learn` },
        ]
      : role === 'barista' && orgId
      ? [
          { label: 'Silabus & Modul', href: `/org/${orgId}/learn` },
        ]
      : roleNav[role] ?? [];

  const roleMeta = ROLE_BADGES[role] || ROLE_BADGES.barista;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-paper-300 shadow-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Left: Brand Identity */}
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              <Link href="/" className="inline-flex items-center gap-3 group shrink-0">
                <img
                  src="/cherry-logo-tight.png"
                  alt="Cherry Coffee Roastery"
                  className="h-9 sm:h-10 w-auto object-contain group-hover:opacity-90 transition-opacity"
                />
                <div className="flex flex-col border-l border-paper-300 pl-2.5 sm:pl-3">
                  <span className="font-serif font-black text-lg sm:text-xl tracking-tight text-roast-950 leading-none">
                    Cherry<span className="font-sans font-light text-cherry-700 text-base sm:text-lg ml-0.5">Edu</span>
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-roast-500 uppercase mt-0.5 font-bold">
                    Teams Platform
                  </span>
                </div>
              </Link>

              {/* Context Org & Outlet Name */}
              {orgName && (
                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-paper-300">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-roast-700 font-semibold truncate max-w-[170px]">
                    {orgName}
                  </span>
                </div>
              )}

              {/* Desktop Nav Items */}
              {navItems.length > 0 && (
                <nav className="hidden md:flex items-center gap-2 ml-2">
                  {navItems.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                          active
                            ? 'bg-paper-100 text-roast-950 font-bold border border-paper-300 shadow-2xs'
                            : 'text-roast-600 hover:text-roast-950 hover:bg-paper-50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Right: Actions, Persona Switcher & Portal Link */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* External Cherry Edu Portal Link */}
              <a
                href="https://edu.cherrycoffeeroastery.com/paths"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs text-roast-600 hover:text-roast-950 font-medium px-2.5 py-1.5 rounded-md hover:bg-paper-50 transition border border-transparent hover:border-paper-200"
                title="Buka portal kurikulum Cherry Edu"
              >
                <span>Akademi Cherry Edu</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* 1-Click Role Switcher Pill */}
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-paper-300 bg-paper-50 hover:bg-white hover:border-roast-600 shadow-2xs transition text-left group"
                title="Klik untuk berpindah peran demo secara instan"
              >
                <div className="w-2 h-2 rounded-full bg-cherry-700 animate-pulse" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-roast-950 font-serif leading-none group-hover:text-cherry-800 transition">
                      {userName || roleMeta.title}
                    </span>
                    <ChevronDown className="w-3 h-3 text-roast-400 group-hover:text-roast-800 transition" />
                  </div>
                  <span className="text-[9px] font-mono text-roast-500 uppercase tracking-wider leading-none mt-0.5">
                    Mode Demo (Klik Ganti)
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Persona Switcher Modal */}
      <PersonaSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentRole={role}
      />
    </>
  );
}
