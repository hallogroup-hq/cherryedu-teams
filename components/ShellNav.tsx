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
    { label: 'Cohorts', href: '/trainer' },
  ],
  admin: [
    { label: 'Dashboard',      href: '/admin' },
    { label: 'Organisations',  href: '/admin/organizations' },
    { label: 'Programs',       href: '/admin/programs' },
    { label: 'Trainers',       href: '/admin/trainers' },
    { label: 'Audit Log',      href: '/admin/audit' },
  ],
};

export default function ShellNav({ role = 'barista', orgId, orgName, userName }: ShellNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = role === 'owner' && orgId
    ? [
        { label: 'Overview',     href: `/org/${orgId}/overview` },
      ]
    : role === 'barista' && orgId
    ? [
        { label: 'Belajar',      href: `/org/${orgId}/learn` },
      ]
    : roleNav[role] ?? [];

  return (
    <header className="sticky top-0 z-40 bg-roast-950/95 backdrop-blur-md border-b border-roast-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-5">

          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            {/* Cherry logo mark — inline SVG cherry silhouette */}
            <div className="w-7 h-7 rounded bg-cherry-700 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden>
                <circle cx="7" cy="13" r="4" fill="#F9E5E7" opacity="0.9"/>
                <circle cx="13" cy="13" r="4" fill="#F9E5E7" opacity="0.7"/>
                <path d="M10 9 C10 9 11 4 13 3 C13 3 10 4 9 7" stroke="#F9E5E7" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col border-l border-roast-800 pl-2.5">
              <span className="font-serif font-black text-base tracking-tight text-paper-100 leading-none">
                Cherry<span className="font-sans font-light text-cherry-400 text-sm ml-0.5">Edu</span>
              </span>
              <span className="text-[8px] font-mono tracking-widest text-roast-500 uppercase mt-0.5">Teams</span>
            </div>
          </Link>

          {/* Context divider */}
          {orgName && (
            <>
              <span className="text-roast-700 select-none hidden sm:block">·</span>
              <span className="text-xs text-roast-400 font-mono truncate max-w-[140px] hidden sm:block">{orgName}</span>
            </>
          )}

          {/* Nav links */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-5 ml-2">
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-[11px] font-mono uppercase tracking-wider transition-colors ${
                      active
                        ? 'text-paper-200 font-bold'
                        : 'text-roast-500 hover:text-roast-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Role badge + user */}
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded border border-roast-800 text-roast-600 bg-roast-900">
              {role}
            </span>
            {userName && (
              <span className="text-xs text-roast-400 truncate max-w-[120px]">{userName}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
