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

      setStatusMessage("Tahapan pembelajaran berhasil diselesaikan!");
      setTimeout(() => {
        router.push(`/org/${orgId}/learn`);
      }, 1000);
    } catch {
      setErrorMessage("Koneksi gagal saat menyimpan progres.");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="barista" orgId={orgId} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Breadcrumb */}
        <Link
          href={`/org/${orgId}/learn`}
          className="text-xs font-mono text-roast-600 hover:text-roast-950 transition-colors inline-block"
        >
          ← Kembali ke Kurikulum Barista
        </Link>

        {loading && <p className="text-sm text-roast-500 font-mono">Memuat konten tahapan...</p>}

        {errorMessage && (
          <div className="card bg-cherry-50 border-cherry-200 text-xs text-cherry-900">
            <p className="font-semibold mb-1">Perhatian:</p>
            <p>{errorMessage}</p>
          </div>
        )}

        {statusMessage && (
          <div className="card bg-paper-50 border-paper-300 text-xs text-roast-950 font-medium">
            <p>{statusMessage} Mengalihkan ke halaman kurikulum...</p>
          </div>
        )}

        {stepData && (
          <div className="space-y-6">
            {/* Step Header Card */}
            <div className="card">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider font-mono text-roast-600 bg-paper-100 px-2 py-0.5 rounded border border-paper-200 font-semibold">
                  {stepData.step_type}
                </span>
                <span className="text-xs text-roast-500 font-mono font-medium">Modul #{stepData.sort_order}</span>
              </div>
              <h1 className="font-serif font-black text-2xl text-roast-950 tracking-tight">
                {stepData.title_override}
              </h1>
              <p className="text-xs text-roast-500 mt-1 font-mono">
                Estimasi Waktu: 30 Menit · Standar Sertifikasi Cherry Edu
              </p>
            </div>

            {/* Lesson Body Content Card */}
            <div className="card space-y-4 text-sm leading-relaxed text-roast-800">
              <h2 className="font-serif font-bold text-base text-roast-950">Panduan Kalibrasi &amp; Ekstraksi Espresso</h2>
              <p>
                Kalibrasi espresso merupakan fondasi utama konsistensi rasa kopi specialty di setiap outlet.
                Proses dial-in harus memperhitungkan tiga variabel kunci:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs font-mono text-roast-800">
                <li>
                  <strong className="text-roast-950">Dose (Gramatur Biji):</strong> 18.0g ± 0.2g menggunakan precision basket portafilter 58mm.
                </li>
                <li>
                  <strong className="text-roast-950">Yield (Hasil Ekstraksi):</strong> 36.0g liquid espresso (rasio seduh 1:2.0).
                </li>
                <li>
                  <strong className="text-roast-950">Time (Waktu Ekstraksi):</strong> 26 – 30 detik pada tekanan 9 bar dan suhu boiler 93°C.
                </li>
              </ul>
              <div className="bg-paper-50 p-4 rounded-xl border border-paper-300 space-y-2 text-xs font-mono">
                <p className="text-roast-950 font-bold uppercase tracking-wider text-[11px]">Standard Operating Procedure (SOP):</p>
                <ol className="list-decimal pl-4 space-y-1.5 text-roast-700">
                  <li>Bersihkan dan keringkan basket portafilter sebelum dosing.</li>
                  <li>Lakukan distribusi bubuk secara merata menggunakan WDT tool untuk mencegah channeling.</li>
                  <li>Lakukan tamping tegak lurus dengan tekanan rata 15 kg.</li>
                  <li>Flush shower head selama 2 detik sebelum memasang portafilter.</li>
                  <li>Mulai ekstraksi segera setelah portafilter terpasang dan catat yield serta waktu.</li>
                </ol>
              </div>
            </div>

            {/* Action Bar */}
            <div className="card flex items-center justify-between p-4">
              <Link href={`/org/${orgId}/learn`} className="btn-secondary text-xs">
                Kembali
              </Link>
              {stepData.state !== "completed" ? (
                <button
                  onClick={handleComplete}
                  disabled={completing || !stepData.is_unlocked}
                  className="btn-primary text-xs py-2 px-5"
                >
                  {completing ? "Menyimpan Progres..." : "Tandai Selesai & Lanjut"}
                </button>
              ) : (
                <span className="text-xs font-mono text-olive-800 bg-olive-50 border border-olive-200 px-3 py-1.5 rounded font-bold">
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
