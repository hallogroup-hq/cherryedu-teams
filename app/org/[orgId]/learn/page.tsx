import type { Metadata } from "next";

export const metadata: Metadata = { title: "Materi Belajar" };

export default async function LearnPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <h1 className="text-xl font-semibold text-white mb-1">Materi Belajar</h1>
      <p className="text-sm text-slate-500 mb-8">Program pelatihan yang ditugaskan ke kamu</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: "Jalur Pembelajaran", href: `/org/${orgId}/learn/paths` },
          { label: "Progres Saya", href: `/org/${orgId}/learn/progress` },
          { label: "Kompetensi Saya", href: `/org/${orgId}/learn/competencies` },
          { label: "Kuis & Latihan", href: `/org/${orgId}/learn/quizzes` },
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
