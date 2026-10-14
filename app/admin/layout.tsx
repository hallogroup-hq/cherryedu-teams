import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Platform Admin — Cherry Edu Teams' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Topbar */}
      <header className="border-b border-slate-800 px-6 py-3 flex items-center gap-6">
        <span className="text-sm font-semibold tracking-wide text-white">Cherry Edu</span>
        <span className="text-slate-600 select-none">·</span>
        <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Platform Admin</span>
        <nav className="ml-auto flex items-center gap-5">
          {[
            { label: 'Dashboard', href: '/admin' },
            { label: 'Organisations', href: '/admin/organizations' },
            { label: 'Programs', href: '/admin/programs' },
            { label: 'Trainers', href: '/admin/trainers' },
            { label: 'Audit Log', href: '/admin/audit' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs text-slate-400 hover:text-slate-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
