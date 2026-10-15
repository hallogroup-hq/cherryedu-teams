import type { Metadata } from 'next';
import ShellNav from '@/components/ShellNav';

export const metadata: Metadata = {
  title: 'Platform Admin — Cherry Edu Teams',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="admin" />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
