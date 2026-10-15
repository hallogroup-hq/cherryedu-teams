"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShellNav from "@/components/ShellNav";

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
    <div className="min-h-screen bg-roast-950 text-roast-100 flex flex-col">
      <ShellNav role="barista" orgId={orgId} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/org/${orgId}/learn`}
          className="text-xs font-mono text-roast-500 hover:text-paper-100 transition-colors inline-block mb-6"
        >
          ← Kembali ke Kurikulum
        </Link>

        {loading && <p className="text-sm text-roast-500 font-mono">Memuat konten tahapan...</p>}

        {errorMessage && (
          <div className="card mb-6 bg-cherry-950 border-cherry-900 text-xs text-cherry-300">
            <p className="font-semibold text-cherry-200 mb-1">Perhatian:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {statusMessage && (
          <div className="card mb-6 text-xs text-paper-200">
            <p>{statusMessage} Mengalihkan ke halaman kurikulum...</p>
          </div>
        )}

        {stepData && (
          <div className="space-y-6">
            {/* Step Header */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-mono text-roast-500 bg-roast-800 px-1.5 py-0.5 rounded border border-roast-700">
                  {stepData.step_type}
                </span>
                <span className="text-xs text-roast-600 font-mono">Tahapan #{stepData.sort_order}</span>
              </div>
              <h1 className="font-serif font-bold text-xl text-paper-100 tracking-tight">
                {stepData.title_override}
              </h1>
              <p className="text-xs text-roast-400 mt-1 font-mono">
                Estimasi 30 menit · Standar Kompetensi Nasional Cherry Edu
              </p>
            </div>

            {/* Lesson Content */}
            <div className="card space-y-4 text-sm leading-relaxed text-roast-300">
              <h2 className="font-serif font-bold text-base text-paper-100">Panduan Teknis &amp; Prosedur</h2>
              <p>
                Kalibrasi espresso merupakan fondasi utama konsistensi rasa kopi specialty di setiap outlet.
                Proses dial-in harus memperhitungkan tiga variabel kunci:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono text-roast-300">
                <li>
                  <strong className="text-paper-100">Dose (Gramatur Biji):</strong> 18.0g ± 0.2g menggunakan portafilter 58mm.
                </li>
                <li>
                  <strong className="text-paper-100">Yield (Hasil Ekstraksi):</strong> 36.0g liquid espresso (rasio seduh 1:2.0).
                </li>
                <li>
                  <strong className="text-paper-100">Time (Waktu Ekstraksi):</strong> 26 – 30 detik pada tekanan 9 bar dan suhu 93°C.
                </li>
              </ul>
              <div className="bg-roast-950 p-4 rounded-lg border border-roast-800 space-y-2 text-xs font-mono">
                <p className="text-paper-200 font-semibold">Standard Operating Procedure (SOP):</p>
                <ol className="list-decimal pl-4 space-y-1 text-roast-400">
                  <li>Bersihkan dan keringkan basket portafilter sebelum dosing.</li>
                  <li>Distribusi bubuk secara merata menggunakan WDT tool untuk mencegah channeling.</li>
                  <li>Tamping tegak lurus dengan tekanan rata 15 kg.</li>
                  <li>Flush shower head 2 detik sebelum memasang portafilter.</li>
                  <li>Mulai ekstraksi segera setelah portafilter terpasang dan catat yield serta waktu.</li>
                </ol>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-roast-800">
              <Link href={`/org/${orgId}/learn`} className="btn-secondary text-xs">
                Kembali
              </Link>
              {stepData.state !== "completed" ? (
                <button
                  onClick={handleComplete}
                  disabled={completing || !stepData.is_unlocked}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {completing ? "Menyimpan Progres..." : "Tandai Selesai & Lanjut"}
                </button>
              ) : (
                <span className="text-xs text-paper-300 font-mono bg-roast-900 border border-roast-700 px-3 py-1.5 rounded">
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
