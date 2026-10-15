"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShellNav from "@/components/ShellNav";

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

        const curRes = await fetch(`/api/teams/organizations/${orgId}/curriculum`);
        if (!curRes.ok) {
          if (curRes.status === 401) { router.push("/login"); return; }
          throw new Error("Gagal memuat kurikulum.");
        }

        const cohortRes = await fetch(`/api/teams/organizations/${orgId}/cohorts`);
        const cohortData = await cohortRes.json();
        const activeCohort = cohortData.cohorts?.[0];
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
      if (!res.ok) { setActionMessage(data.error || "Gagal memperbarui progres."); return; }

      setActionMessage("Tahapan pembelajaran berhasil diselesaikan!");

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
    <div className="min-h-screen bg-roast-950 text-roast-100 flex flex-col">
      <ShellNav role="barista" orgId={orgId} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Progress Hero */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="section-label mb-1">Program Akselerasi Barista Spesialis</p>
              <h1 className="font-serif font-bold text-xl text-paper-100">
                Jalur Pelatihan &amp; Validasi Kompetensi
              </h1>
              <p className="text-xs text-roast-400 mt-1">
                Pelajari teori online, selesaikan kuis, dan ikuti observasi praktik bersama trainer.
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-roast-800 sm:pl-6 shrink-0">
              <span className="text-2xl font-bold font-mono text-paper-100">{progressPercent}%</span>
              <p className="text-xs text-roast-500 mt-0.5">
                {completedCount} dari {steps.length} tahapan
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-roast-800 rounded-full h-1.5 mt-5 overflow-hidden">
            <div
              className="bg-cherry-700 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Banner */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-lg bg-roast-900 border border-roast-700 text-xs text-roast-200 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-roast-500 hover:text-paper-100 ml-4">Tutup</button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-cherry-950 border border-cherry-900 text-xs text-cherry-300">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-roast-800 mb-6 gap-6 text-sm">
          {(["curriculum", "competencies", "remediation"] as const).map((tab) => {
            const labels: Record<string, string> = {
              curriculum: `Kurikulum (${steps.length})`,
              competencies: `Kompetensi (${competencies.length})`,
              remediation: `Remedial (${remediationTasks.length})`,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 font-medium transition-colors border-b-2 -mb-px text-sm ${
                  activeTab === tab
                    ? "border-cherry-700 text-paper-100"
                    : "border-transparent text-roast-500 hover:text-roast-300"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* TAB 1: CURRICULUM */}
        {activeTab === "curriculum" && (
          <div className="space-y-3">
            {loading && <p className="text-sm text-roast-500 font-mono">Memuat kurikulum...</p>}
            {!loading && steps.length === 0 && (
              <p className="text-sm text-roast-500">Belum ada tahapan pembelajaran.</p>
            )}

            {steps.map((step) => {
              const isCompleted = step.state === "completed";
              const isLocked = !step.is_unlocked;

              return (
                <div
                  key={step.id}
                  className={`card transition-colors ${isLocked ? "opacity-50" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded border border-roast-700 bg-roast-800 flex items-center justify-center text-xs font-mono text-paper-300">
                        {step.sort_order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] uppercase tracking-widest font-mono text-roast-500 bg-roast-800 px-1.5 py-0.5 rounded border border-roast-700">
                            {step.step_type}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] font-mono text-paper-300 bg-roast-800 px-2 py-0.5 rounded border border-roast-700 uppercase tracking-wider">
                              Selesai
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[10px] font-mono text-roast-600 uppercase tracking-wider">
                              Terkunci
                            </span>
                          )}
                        </div>
                        <h2 className="text-sm font-semibold text-paper-100">
                          {step.title_override || `Tahapan ${step.sort_order}`}
                        </h2>
                        {isLocked && step.missing_prerequisites.length > 0 && (
                          <p className="text-xs text-roast-500 mt-1">
                            Selesaikan tahapan prasyarat terlebih dahulu.
                          </p>
                        )}
                        {isCompleted && step.completed_at && (
                          <p className="text-xs text-roast-600 mt-0.5 font-mono">
                            {new Date(step.completed_at).toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
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
                          className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
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
          <div className="space-y-3">
            {competencies.length === 0 && (
              <p className="text-sm text-roast-500">Belum ada data kompetensi.</p>
            )}

            {competencies.map((comp) => {
              const stateLabels: Record<string, string> = {
                learning: "Materi Teori Berlangsung",
                awaiting_assessment: "Menunggu Asesmen Praktik",
                needs_practice: "Perlu Latihan Tambahan",
                competent: "Kompeten & Terverifikasi",
              };

              return (
                <div key={comp.competency_id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-roast-500 uppercase tracking-widest">
                        {comp.code}
                      </span>
                      <h2 className="text-sm font-semibold text-paper-100 mt-1">{comp.name}</h2>
                      <p className="text-xs text-roast-400 mt-1">
                        {stateLabels[comp.state] || comp.state}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {comp.state === "competent" ? (
                        <span className="status-active">Terverifikasi</span>
                      ) : (
                        <span className="status-pending">Dalam Proses</span>
                      )}
                      {comp.verified_at && (
                        <p className="text-[10px] text-roast-600 font-mono mt-1">
                          {new Date(comp.verified_at).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: REMEDIATION */}
        {activeTab === "remediation" && (
          <div className="space-y-3">
            {remediationTasks.length === 0 && (
              <p className="text-sm text-roast-500">Tidak ada tugas remedial aktif. Kerja bagus!</p>
            )}

            {remediationTasks.map((task) => (
              <div key={task.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="status-pill">{task.status}</span>
                      <span className="text-xs text-roast-400 font-mono">{task.competency_name}</span>
                    </div>
                    <h2 className="text-sm font-semibold text-paper-100 mt-1">{task.title}</h2>
                    <p className="text-xs text-roast-300 mt-2 bg-roast-950 p-3 rounded border border-roast-800 font-mono leading-relaxed">
                      {task.instructions}
                    </p>
                  </div>

                  <div className="self-end sm:self-start shrink-0">
                    {task.status === "assigned" && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        Serahkan Hasil
                      </button>
                    )}
                    {task.status === "submitted" && (
                      <span className="text-xs text-roast-400 font-mono">Menunggu Review Trainer</span>
                    )}
                    {task.status === "verified" && (
                      <span className="text-xs text-paper-300 font-mono">Tuntas Terverifikasi</span>
                    )}
                  </div>
                </div>

                {/* Submission Form */}
                {selectedTask?.id === task.id && (
                  <div className="mt-4 pt-4 border-t border-roast-800 space-y-3">
                    <label className="label">Catatan &amp; Bukti Praktik Mandiri:</label>
                    <textarea
                      value={practiceNotes}
                      onChange={(e) => setPracticeNotes(e.target.value)}
                      placeholder="Jelaskan kalibrasi, gramatur, waktu ekstraksi, dan kendala yang dihadapi..."
                      className="input text-xs h-24"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setSelectedTask(null)} className="btn-ghost text-xs py-1 px-3">
                        Batal
                      </button>
                      <button
                        onClick={() => handleSubmitRemediation(task.id)}
                        className="btn-primary text-xs py-1 px-3"
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
