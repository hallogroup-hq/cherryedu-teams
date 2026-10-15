import type { Metadata } from 'next';
import ShellNav from '@/components/ShellNav';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata: Metadata = {
  title: 'Platform Admin — Cherry Edu Teams',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="admin" />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-12">
        {children}
      </main>
      <MobileBottomNav role="admin" />
    </div>
  );
}
