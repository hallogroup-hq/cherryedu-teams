import type { Metadata } from "next";

export const metadata: Metadata = { title: "Overview Organisasi" };

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Overview Organisasi</h1>
      <p className="text-sm text-slate-500 mb-8 font-mono">{orgId}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Outlet & Tim", href: `/org/${orgId}/outlets` },
          { label: "Undang Karyawan", href: `/org/${orgId}/invite` },
          { label: "Program Pelatihan", href: `/org/${orgId}/programs` },
          { label: "Progres Tim", href: `/org/${orgId}/progress` },
          { label: "Kompetensi", href: `/org/${orgId}/competencies` },
          { label: "Laporan", href: `/org/${orgId}/reports` },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="card hover:border-slate-700 transition-colors"
          >
            <span className="text-sm font-medium text-slate-200">{item.label}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
