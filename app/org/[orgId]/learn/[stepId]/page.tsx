"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StepReaderPage({
  params,
}: {
  params: Promise<{ orgId: string; stepId: string }>;
}) {
  const { orgId, stepId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stepData, setStepData] = useState<any>(null);
  const [completing, setCompleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const enrollmentId = "e0000000-0000-0000-0000-000000000001";

  useEffect(() => {
    async function fetchStep() {
      try {
        setLoading(true);
        const res = await fetch(`/api/teams/organizations/${orgId}/enrollments/${enrollmentId}/progress`);
        if (!res.ok) throw new Error("Gagal mengambil data progres.");
        const data = await res.json();
        const found = (data.steps || []).find((s: any) => s.id === stepId);
        setStepData(found || null);
      } catch (err: any) {
        setErrorMessage(err.message || "Gagal memuat materi.");
      } finally {
        setLoading(false);
      }
    }
    fetchStep();
  }, [orgId, stepId]);

  async function handleComplete() {
    try {
      setCompleting(true);
      setErrorMessage(null);

      const res = await fetch(
        `/api/teams/organizations/${orgId}/enrollments/${enrollmentId}/steps/${stepId}/progress`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: "completed" }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Gagal menyelesaikan tahapan.");
        return;
      }

      setStatusMessage("Tahapan berhasil diselesaikan!");
      setTimeout(() => {
        router.push(`/org/${orgId}/learn`);
      }, 1200);
    } catch {
      setErrorMessage("Koneksi gagal saat menyimpan progres.");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/org/${orgId}/learn`} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono">
            &larr; Kembali ke Kurikulum
          </Link>
        </div>
        <span className="text-xs font-mono uppercase text-zinc-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          Modul Pembelajaran
        </span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {loading && <p className="text-sm text-slate-500 font-mono">Memuat konten tahapan...</p>}

        {errorMessage && (
          <div className="card mb-6 border-slate-700 bg-slate-900 text-xs text-slate-300">
            <p className="font-semibold text-white mb-1">Perhatian:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {statusMessage && (
          <div className="card mb-6 border-slate-700 bg-slate-900 text-xs text-white">
            <p>{statusMessage} Mengalihkan ke halaman kurikulum...</p>
          </div>
        )}

        {stepData && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-zinc-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 uppercase">
                  {stepData.step_type}
                </span>
                <span className="text-xs text-slate-500 font-mono">Tahapan #{stepData.sort_order}</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">{stepData.title_override}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Estimasi waktu belajar: 30 menit &middot; Standar Kompetensi Nasional Cherry Edu
              </p>
            </div>

            {/* Lesson Body Content */}
            <div className="card space-y-4 text-sm leading-relaxed text-slate-300">
              <h2 className="text-base font-semibold text-white">Panduan Teknis & Prosedur</h2>
              <p>
                Kalibrasi espresso merupakan fondasi utama konsistensi rasa kopi specialty di setiap outlet.
                Proses dial-in harus memperhitungkan tiga variabel kunci:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono text-slate-300">
                <li>
                  <strong className="text-white">Dose (Gramatur Biji):</strong> 18.0g &plusmn; 0.2g menggunakan portafilter 58mm.
                </li>
                <li>
                  <strong className="text-white">Yield (Hasil Ekstraksi):</strong> 36.0g liquid espresso (rasio seduh 1:2.0).
                </li>
                <li>
                  <strong className="text-white">Time (Waktu Ekstraksi):</strong> 26 &ndash; 30 detik pada tekanan 9 bar dan suhu 93&deg;C.
                </li>
              </ul>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <p className="text-zinc-300 font-semibold">Standard Operating Procedure (SOP):</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Bersihkan dan keringkan basket portafilter sebelum dosing.</li>
                  <li>Lakukan distribusi bubuk secara merata menggunakan WDT tool untuk mencegah channeling.</li>
                  <li>Lakukan tamping tegak lurus dengan tekanan rata 15 kg.</li>
                  <li>Flush shower head 2 detik sebelum memasang portafilter.</li>
                  <li>Mulai ekstraksi segera setelah portafilter terpasang dan catat yield serta waktu.</li>
                </ol>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <Link href={`/org/${orgId}/learn`} className="btn-secondary text-xs">
                Kembali
              </Link>
              {stepData.state !== "completed" ? (
                <button
                  onClick={handleComplete}
                  disabled={completing || !stepData.is_unlocked}
                  className="btn-primary text-xs bg-zinc-200 text-slate-950 hover:bg-white"
                >
                  {completing ? "Menyimpan Progres..." : "Tandai Selesai & Lanjut"}
                </button>
              ) : (
                <span className="text-xs text-zinc-300 font-mono bg-slate-900 border border-slate-700 px-3 py-1.5 rounded">
                  Tahapan Ini Sudah Diselesaikan
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
