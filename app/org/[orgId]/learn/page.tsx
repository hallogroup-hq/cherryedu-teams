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
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="barista" orgId={orgId} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Progress Hero Card */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="section-label mb-1">Kurikulum Spesialisasi · Cherry Edu Teams</p>
              <h1 className="font-serif font-black text-2xl text-roast-950">
                Jalur Pelatihan &amp; Validasi Kompetensi Barista
              </h1>
              <p className="text-xs text-roast-600 mt-1">
                Selesaikan modul teori online, kuis pemahaman, dan observasi praktik bersama trainer resmi.
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-paper-300 sm:pl-6 shrink-0">
              <span className="text-3xl font-bold font-serif text-roast-950">{progressPercent}%</span>
              <p className="text-xs text-roast-500 mt-0.5 font-mono">
                {completedCount} dari {steps.length} Modul Tuntas
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-paper-200 rounded-full h-2 mt-5 overflow-hidden">
            <div
              className="bg-cherry-700 h-2 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className="p-4 rounded-xl bg-paper-50 border border-paper-300 text-xs text-roast-900 flex items-center justify-between shadow-subtle">
            <span className="font-medium">{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-roast-500 hover:text-roast-900 ml-4 font-mono">
              Tutup
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-cherry-50 border border-cherry-200 text-xs text-cherry-900">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-paper-300 gap-6 text-sm">
          {(["curriculum", "competencies", "remediation"] as const).map((tab) => {
            const labels: Record<string, string> = {
              curriculum: `Kurikulum & Modul (${steps.length})`,
              competencies: `Status Kompetensi (${competencies.length})`,
              remediation: `Latihan Terarah (${remediationTasks.length})`,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3.5 font-medium transition-colors border-b-2 -mb-px text-xs font-mono uppercase tracking-wider ${
                  activeTab === tab
                    ? "border-roast-950 text-roast-950 font-bold"
                    : "border-transparent text-roast-500 hover:text-roast-800"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* TAB 1: CURRICULUM */}
        {activeTab === "curriculum" && (
          <div className="space-y-3.5">
            {loading && <p className="text-sm text-roast-500 font-mono">Memuat kurikulum...</p>}
            {!loading && steps.length === 0 && (
              <div className="card p-8 text-center text-roast-500 text-xs font-mono">
                Belum ada tahapan pembelajaran aktif.
              </div>
            )}

            {steps.map((step) => {
              const isCompleted = step.state === "completed";
              const isLocked = !step.is_unlocked;

              return (
                <div
                  key={step.id}
                  className={`card transition-all ${isLocked ? "opacity-60 bg-paper-50" : "bg-white hover:border-paper-400"}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg border border-paper-300 bg-paper-50 flex items-center justify-center text-xs font-mono font-bold text-roast-800">
                        {step.sort_order}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] uppercase tracking-wider font-mono text-roast-600 bg-paper-100 px-2 py-0.5 rounded border border-paper-200 font-semibold">
                            {step.step_type}
                          </span>
                          {isCompleted && (
                            <span className="text-[10px] font-mono text-olive-800 bg-olive-50 px-2 py-0.5 rounded border border-olive-200 uppercase tracking-wider font-bold">
                              Selesai
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[10px] font-mono text-roast-500 uppercase tracking-wider">
                              Terkunci
                            </span>
                          )}
                        </div>
                        <h2 className="text-sm font-semibold text-roast-950">
                          {step.title_override || `Tahapan ${step.sort_order}`}
                        </h2>
                        {isLocked && step.missing_prerequisites.length > 0 && (
                          <p className="text-xs text-roast-500 mt-1 font-sans">
                            Selesaikan modul prasyarat terlebih dahulu untuk membuka materi ini.
                          </p>
                        )}
                        {isCompleted && step.completed_at && (
                          <p className="text-xs text-roast-500 mt-0.5 font-mono">
                            Diselesaikan: {new Date(step.completed_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
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
                          className="btn-primary text-xs py-1.5 px-3"
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

        {/* TAB 2: COMPETENCIES */}
        {activeTab === "competencies" && (
          <div className="space-y-3.5">
            {competencies.length === 0 && (
              <div className="card p-8 text-center text-roast-500 text-xs font-mono">
                Belum ada data kompetensi untuk pendaftaran ini.
              </div>
            )}

            {competencies.map((comp) => {
              const stateLabels: Record<string, string> = {
                learning: "Materi Teori Sedang Berlangsung",
                awaiting_assessment: "Menunggu Observasi Praktik Trainer",
                needs_practice: "Perlu Latihan Tambahan (Remedial)",
                competent: "Kompeten & Terverifikasi Industri",
              };

              return (
                <div key={comp.competency_id} className="card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-roast-500 uppercase tracking-widest font-bold">
                        {comp.code}
                      </span>
                      <h2 className="text-base font-serif font-bold text-roast-950 mt-0.5">{comp.name}</h2>
                      <p className="text-xs text-roast-600 mt-1">
                        Status: <span className="font-semibold text-roast-950">{stateLabels[comp.state] || comp.state}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {comp.state === "competent" ? (
                        <span className="status-active font-bold">Kompeten Resmi</span>
                      ) : (
                        <span className="status-pending font-medium">Dalam Proses</span>
                      )}
                      {comp.verified_at && (
                        <p className="text-[10px] text-roast-500 font-mono mt-1">
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

        {/* TAB 3: REMEDIATION */}
        {activeTab === "remediation" && (
          <div className="space-y-3.5">
            {remediationTasks.length === 0 && (
              <div className="card p-8 text-center text-roast-600 text-sm font-sans">
                Tidak ada tugas remedial aktif. Seluruh kriteria memenuhi standar!
              </div>
            )}

            {remediationTasks.map((task) => (
              <div key={task.id} className="card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="status-pill">{task.status}</span>
                      <span className="text-xs text-roast-600 font-mono font-medium">{task.competency_name}</span>
                    </div>
                    <h2 className="text-base font-serif font-bold text-roast-950 mt-1">{task.title}</h2>
                    <div className="text-xs text-roast-800 mt-2 bg-paper-50 p-3.5 rounded-lg border border-paper-300 font-mono leading-relaxed">
                      {task.instructions}
                    </div>
                  </div>

                  <div className="self-end sm:self-start shrink-0">
                    {task.status === "assigned" && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Serahkan Hasil
                      </button>
                    )}
                    {task.status === "submitted" && (
                      <span className="text-xs text-roast-600 font-mono bg-paper-100 px-2.5 py-1 rounded border border-paper-200">
                        Menunggu Review Trainer
                      </span>
                    )}
                    {task.status === "verified" && (
                      <span className="status-active font-bold">Tuntas Terverifikasi</span>
                    )}
                  </div>
                </div>

                {/* Submission Form Modal / Drawer */}
                {selectedTask?.id === task.id && (
                  <div className="mt-4 pt-4 border-t border-paper-200 space-y-3">
                    <label className="label">Catatan &amp; Bukti Praktik Mandiri Barista:</label>
                    <textarea
                      value={practiceNotes}
                      onChange={(e) => setPracticeNotes(e.target.value)}
                      placeholder="Jelaskan parameter dial-in (dose, yield, extraction time) dan hasil kalibrasi..."
                      className="input text-xs h-24"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setSelectedTask(null)} className="btn-ghost text-xs">
                        Batal
                      </button>
                      <button
                        onClick={() => handleSubmitRemediation(task.id)}
                        className="btn-primary text-xs py-1.5 px-4"
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
