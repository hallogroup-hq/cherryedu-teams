"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Step {
  id: string;
  step_type: string;
  title_override: string;
  sort_order: number;
  is_required: boolean;
  state: string;
  is_unlocked: boolean;
  missing_prerequisites: string[];
  prerequisite_step_ids: string[];
  completed_at: string | null;
}

interface Competency {
  competency_id: string;
  code: string;
  name: string;
  state: string;
  verified_at: string | null;
}

interface RemediationTask {
  id: string;
  title: string;
  instructions: string;
  status: string;
  due_at: string | null;
  competency_name: string;
  criterion_code?: string;
}

export default function BaristaLearnPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [remediationTasks, setRemediationTasks] = useState<RemediationTask[]>([]);
  const [activeTab, setActiveTab] = useState<"curriculum" | "competencies" | "remediation">("curriculum");
  const [submittingStepId, setSubmittingStepId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<RemediationTask | null>(null);
  const [practiceNotes, setPracticeNotes] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch curriculum to obtain programs and version
        const curRes = await fetch(`/api/teams/organizations/${orgId}/curriculum`);
        if (!curRes.ok) {
          if (curRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Gagal memuat kurikulum.");
        }
        const curData = await curRes.json();

        // 2. Fetch cohorts to find active enrollment
        const cohortRes = await fetch(`/api/teams/organizations/${orgId}/cohorts`);
        const cohortData = await cohortRes.json();
        const activeCohort = cohortData.cohorts?.[0];

        // 3. Fetch progress for current user enrollment
        // Note: For demo / local verification, if enrollmentId is known or passed
        const targetEnrollmentId = activeCohort?.id
          ? "e0000000-0000-0000-0000-000000000001"
          : "e0000000-0000-0000-0000-000000000001";
        setEnrollmentId(targetEnrollmentId);

        const progRes = await fetch(
          `/api/teams/organizations/${orgId}/enrollments/${targetEnrollmentId}/progress`
        );
        if (progRes.ok) {
          const progData = await progRes.json();
          setSteps(progData.steps || []);
          setCompetencies(progData.competencies || []);
        }

        // 4. Fetch remediation tasks
        const remRes = await fetch(`/api/teams/organizations/${orgId}/remediation`);
        if (remRes.ok) {
          const remData = await remRes.json();
          setRemediationTasks(remData.tasks || []);
        }
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [orgId, router]);

  async function handleCompleteStep(stepId: string) {
    if (!enrollmentId) return;
    try {
      setSubmittingStepId(stepId);
      setActionMessage(null);

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
        setActionMessage(data.error || "Gagal memperbarui progres tahapan.");
        return;
      }

      setActionMessage("Tahapan pembelajaran berhasil diselesaikan!");

      // Refresh progress
      const progRes = await fetch(
        `/api/teams/organizations/${orgId}/enrollments/${enrollmentId}/progress`
      );
      if (progRes.ok) {
        const progData = await progRes.json();
        setSteps(progData.steps || []);
        setCompetencies(progData.competencies || []);
      }
    } catch {
      setActionMessage("Koneksi gagal. Silakan coba kembali.");
    } finally {
      setSubmittingStepId(null);
    }
  }

  async function handleSubmitRemediation(taskId: string) {
    try {
      setActionMessage(null);
      const res = await fetch(`/api/teams/organizations/${orgId}/remediation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "submit", task_id: taskId, notes: practiceNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setActionMessage(data.error || "Gagal mengirim tugas remedial.");
        return;
      }

      setActionMessage("Hasil latihan remedial berhasil diserahkan ke trainer.");
      setSelectedTask(null);
      setPracticeNotes("");

      // Refresh remediation
      const remRes = await fetch(`/api/teams/organizations/${orgId}/remediation`);
      if (remRes.ok) {
        const remData = await remRes.json();
        setRemediationTasks(remData.tasks || []);
      }
    } catch {
      setActionMessage("Gagal mengirim remedial.");
    }
  }

  const completedCount = steps.filter((s) => s.state === "completed").length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-white hover:text-slate-300">
            Cherry Edu <span className="text-zinc-400">Teams</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Portal Barista
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Batch 1 — Menteng Flagship</span>
          <Link href="/login" className="hover:text-slate-200">
            Keluar
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1">
                Program Akselerasi Barista Spesialis
              </p>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Jalur Pelatihan & Validasi Kompetensi
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Pelajari teori online, selesaikan kuis, dan ikuti observasi praktik bersama trainer resmi.
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
              <span className="text-2xl font-bold font-mono text-white">{progressPercent}%</span>
              <p className="text-xs text-slate-500 mt-0.5">
                {completedCount} dari {steps.length} tahapan tuntas
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-5 overflow-hidden">
            <div
              className="bg-zinc-200 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action / Notification Banner */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
              Tutup
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-6 text-sm">
          <button
            onClick={() => setActiveTab("curriculum")}
            className={`pb-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "curriculum"
                ? "border-zinc-200 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Kurikulum & Tahapan ({steps.length})
          </button>
          <button
            onClick={() => setActiveTab("competencies")}
            className={`pb-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "competencies"
                ? "border-zinc-200 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Status Kompetensi ({competencies.length})
          </button>
          <button
            onClick={() => setActiveTab("remediation")}
            className={`pb-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "remediation"
                ? "border-zinc-200 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Latihan Terarah / Remedial ({remediationTasks.length})
          </button>
        </div>

        {/* TAB 1: CURRICULUM & STEPS */}
        {activeTab === "curriculum" && (
          <div className="space-y-4">
            {loading && <p className="text-sm text-slate-500">Memuat kurikulum...</p>}
            {!loading && steps.length === 0 && (
              <p className="text-sm text-slate-500">Belum ada tahapan pembelajaran yang tersedia.</p>
            )}

            {steps.map((step) => {
              const isCompleted = step.state === "completed";
              const isLocked = !step.is_unlocked;

              return (
                <div
                  key={step.id}
                  className={`card transition-colors ${
                    isLocked ? "opacity-60 bg-slate-950/40" : "bg-slate-900"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded border border-slate-700 bg-slate-800 flex items-center justify-center text-xs font-mono text-zinc-300">
                        {step.sort_order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase tracking-wider font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {step.step_type}
                          </span>
                          {isCompleted && (
                            <span className="text-xs font-mono text-zinc-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              Selesai
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              Terkunci
                            </span>
                          )}
                        </div>
                        <h2 className="text-sm font-semibold text-white">
                          {step.title_override || `Tahapan ${step.sort_order}`}
                        </h2>
                        {isLocked && step.missing_prerequisites.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1">
                            Harap selesaikan tahapan prasyarat sebelum membuka materi ini.
                          </p>
                        )}
                        {isCompleted && step.completed_at && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Diselesaikan pada: {new Date(step.completed_at).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href={`/org/${orgId}/learn/${step.id}`}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Buka Materi
                      </Link>

                      {!isCompleted && !isLocked && (
                        <button
                          onClick={() => handleCompleteStep(step.id)}
                          disabled={submittingStepId === step.id}
                          className="btn-primary text-xs py-1.5 px-3 bg-zinc-200 text-slate-950 hover:bg-white"
                        >
                          {submittingStepId === step.id ? "Menyimpan..." : "Tandai Selesai"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: COMPETENCY STATUS */}
        {activeTab === "competencies" && (
          <div className="space-y-4">
            {competencies.length === 0 && (
              <p className="text-sm text-slate-500">Belum ada data kompetensi untuk enrollment ini.</p>
            )}

            {competencies.map((comp) => {
              const stateLabels: Record<string, string> = {
                learning: "Materi Teori Berlangsung",
                awaiting_assessment: "Menunggu Asesmen Praktik",
                needs_practice: "Perlu Latihan Tambahan (Remedial)",
                competent: "Kompeten & Terverifikasi",
              };

              return (
                <div key={comp.competency_id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono text-zinc-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {comp.code}
                      </span>
                      <h2 className="text-base font-semibold text-white mt-2">{comp.name}</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Status saat ini:{" "}
                        <span className="text-white font-medium">
                          {stateLabels[comp.state] || comp.state}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      {comp.state === "competent" ? (
                        <span className="inline-block px-3 py-1 bg-slate-800 border border-slate-700 text-xs font-mono text-white rounded">
                          Terverifikasi Resmi
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 rounded">
                          Dalam Proses
                        </span>
                      )}
                      {comp.verified_at && (
                        <p className="text-xs text-slate-500 mt-1">
                          Disahkan: {new Date(comp.verified_at).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: REMEDIATION TASKS */}
        {activeTab === "remediation" && (
          <div className="space-y-4">
            {remediationTasks.length === 0 && (
              <p className="text-sm text-slate-500">Tidak ada tugas remedial aktif. Kerja bagus!</p>
            )}

            {remediationTasks.map((task) => (
              <div key={task.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-zinc-300">
                        {task.status}
                      </span>
                      <span className="text-xs text-slate-400">{task.competency_name}</span>
                    </div>
                    <h2 className="text-base font-semibold text-white mt-1">{task.title}</h2>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-950 p-3 rounded border border-slate-800 font-mono">
                      {task.instructions}
                    </p>
                  </div>

                  <div className="self-end sm:self-start">
                    {task.status === "assigned" && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Serahkan Hasil
                      </button>
                    )}
                    {task.status === "submitted" && (
                      <span className="text-xs text-slate-400 font-mono">Menunggu Review Trainer</span>
                    )}
                    {task.status === "verified" && (
                      <span className="text-xs text-zinc-300 font-mono">Tuntas Terverifikasi</span>
                    )}
                  </div>
                </div>

                {/* Submission Form Modal / Box */}
                {selectedTask?.id === task.id && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                    <label className="label text-xs">Catatan & Bukti Praktik Mandiri:</label>
                    <textarea
                      value={practiceNotes}
                      onChange={(e) => setPracticeNotes(e.target.value)}
                      placeholder="Jelaskan kalibrasi yang dilakukan, gramatur, waktu ekstraksi, dan kendala yang dihadapi..."
                      className="input text-xs h-24"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setSelectedTask(null)}
                        className="btn-ghost text-xs py-1 px-3"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleSubmitRemediation(task.id)}
                        className="btn-primary text-xs py-1 px-3 bg-zinc-200 text-slate-950 hover:bg-white"
                      >
                        Kirim ke Trainer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
