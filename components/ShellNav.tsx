'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  owner:   [],
  trainer: [
    { label: 'Daftar Cohort', href: '/trainer' },
  ],
  admin: [
    { label: 'Dasbor',         href: '/admin' },
    { label: 'Organisasi',     href: '/admin/organizations' },
  ],
};

export default function ShellNav({ role = 'barista', orgId, orgName, userName }: ShellNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = role === 'owner' && orgId
    ? [
        { label: 'Ringkasan & Tim', href: `/org/${orgId}/overview` },
        { label: 'Portal Barista',  href: `/org/${orgId}/learn` },
      ]
    : role === 'barista' && orgId
    ? [
        { label: 'Kurikulum & Belajar', href: `/org/${orgId}/learn` },
      ]
    : roleNav[role] ?? [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-paper-300 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex items-center gap-3 group shrink-0">
              <div className="w-9 h-9 rounded-lg bg-cherry-700 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-cherry-800 transition-colors">
                <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
                  <circle cx="7" cy="13" r="4" fill="#F9E5E7" opacity="0.95"/>
                  <circle cx="13" cy="13" r="4" fill="#F9E5E7" opacity="0.75"/>
                  <path d="M10 9 C10 9 11 4 13 3 C13 3 10 4 9 7" stroke="#F9E5E7" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <div className="flex flex-col border-l border-paper-300 pl-3">
                <span className="font-serif font-black text-xl tracking-tight text-roast-950 leading-none">
                  Cherry<span className="font-sans font-light text-cherry-700 text-lg ml-0.5">Edu</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest text-roast-500 uppercase mt-0.5 font-bold">
                  Teams Platform
                </span>
              </div>
            </Link>

            {/* Context Org Name */}
            {orgName && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-paper-300">
                <span className="text-xs font-mono uppercase tracking-wider text-roast-700 font-semibold truncate max-w-[180px]">
                  {orgName}
                </span>
              </div>
            )}

            {/* Navigation links */}
            {navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-4 ml-2">
                {navItems.map((item) => {
                  const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${
                        active
                          ? 'bg-paper-100 text-roast-950 font-bold border border-paper-300'
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

          {/* Right: Role indicator & User actions */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-paper-100 border border-paper-300 text-roast-700 font-bold">
              {role === 'barista' ? 'Barista Learner' : role === 'owner' ? 'Owner / Manager' : role === 'trainer' ? 'Trainer Resmi' : 'Platform Admin'}
            </span>
            {userName && (
              <span className="text-xs text-roast-600 font-medium truncate max-w-[140px] hidden sm:inline">
                {userName}
              </span>
            )}
            <Link
              href="/login"
              className="text-xs font-mono uppercase tracking-wider text-roast-500 hover:text-cherry-700 ml-2 px-2 py-1 rounded transition-colors"
            >
              Keluar
            </Link>
          </div>

        </div>
      </div>
    </header>
  );
}
