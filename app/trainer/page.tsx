import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trainer Dashboard" };

export default function TrainerPage() {
  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Trainer Dashboard</h1>
      <p className="text-sm text-slate-500 mb-8">Assigned cohorts &amp; assessments</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Cohort Saya", href: "/trainer/cohorts" },
          { label: "Peserta Aktif", href: "/trainer/participants" },
          { label: "Jadwal Asesmen", href: "/trainer/assessments" },
          { label: "Rubrik & Sign-off", href: "/trainer/rubrics" },
          { label: "Riwayat Asesmen", href: "/trainer/history" },
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
