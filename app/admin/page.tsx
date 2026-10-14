import type { Metadata } from "next";

export const metadata: Metadata = { title: "Platform Admin" };

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Cherry Edu Admin</h1>
      <p className="text-sm text-slate-500 mb-8">Platform Administration</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Organisations", href: "/admin/organisations" },
          { label: "Trainers & Staff", href: "/admin/staff" },
          { label: "Programs", href: "/admin/programs" },
          { label: "Cohorts", href: "/admin/cohorts" },
          { label: "Audit Log", href: "/admin/audit" },
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
