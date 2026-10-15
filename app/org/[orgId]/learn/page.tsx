"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  BookOpen,
  Award,
  Coffee,
  CheckCircle2,
  Lock,
  PlayCircle,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Send,
} from "lucide-react";
import ShellNav from "@/components/ShellNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import CompetencyTrackerWidget from "@/components/CompetencyTrackerWidget";
import DailyCalibrationWidget from "@/components/DailyCalibrationWidget";

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
  const [activeTab, setActiveTab] = useState<"curriculum" | "tracker" | "calibration" | "remediation">("curriculum");
  const [submittingStepId, setSubmittingStepId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<RemediationTask | null>(null);
  const [practiceNotes, setPracticeNotes] = useState("");
  const [practiceTimer, setPracticeTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => setPracticeTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== 'undefined' ? localStorage.getItem('teams_auth_token') || '' : '';
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const curRes = await fetch(`/api/teams/organizations/${orgId}/curriculum`, {
          headers,
          credentials: 'same-origin',
        });
        if (!curRes.ok) {
          if (curRes.status === 401) { router.push("/login"); return; }
          throw new Error("Gagal memuat kurikulum.");
        }

        const cohortRes = await fetch(`/api/teams/organizations/${orgId}/cohorts`, {
          headers,
          credentials: 'same-origin',
        });
        const cohortData = await cohortRes.json();
        const activeCohort = cohortData.cohorts?.[0];
        const targetEnrollmentId = activeCohort?.id
          ? "e0000000-0000-0000-0000-000000000001"
          : "e0000000-0000-0000-0000-000000000001";
        setEnrollmentId(targetEnrollmentId);

        const progRes = await fetch(
          `/api/teams/organizations/${orgId}/enrollments/${targetEnrollmentId}/progress`,
          { headers, credentials: 'same-origin' }
        );
        if (progRes.ok) {
          const progData = await progRes.json();
          setSteps(progData.steps || []);
          setCompetencies(progData.competencies || []);
        }

        const remRes = await fetch(`/api/teams/organizations/${orgId}/remediation`, {
          headers,
          credentials: 'same-origin',
        });
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

  async function handleCompleteStep(step: Step) {
    if (!enrollmentId) return;
    try {
      setSubmittingStepId(step.id);

      const res = await fetch(
        `/api/teams/organizations/${orgId}/enrollments/${enrollmentId}/steps/${step.id}/progress`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state: "completed" }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal memperbarui progres.");
        return;
      }

      // Celebratory Confetti!
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7E1D2A', '#E0C774', '#140E0C', '#4D6644'],
      });

      toast.success("Modul Berhasil Dituntaskan!", {
        description: `Hebat! "${step.title_override || `Tahapan ${step.sort_order}`}" telah ditandai tuntas.`,
      });

      // Update local state smoothly
      setSteps((prev) =>
        prev.map((s) => (s.id === step.id ? { ...s, state: "completed", completed_at: new Date().toISOString() } : s))
      );

      // Refresh background
      const progRes = await fetch(
        `/api/teams/organizations/${orgId}/enrollments/${enrollmentId}/progress`
      );
      if (progRes.ok) {
        const progData = await progRes.json();
        setSteps(progData.steps || []);
        setCompetencies(progData.competencies || []);
      }
    } catch {
      toast.error("Koneksi gagal. Silakan coba kembali.");
    } finally {
      setSubmittingStepId(null);
    }
  }

  async function handleSubmitRemediation(taskId: string) {
    try {
      const res = await fetch(`/api/teams/organizations/${orgId}/remediation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "submit", task_id: taskId, notes: practiceNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Gagal mengirim tugas remedial.");
        return;
      }

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#7E1D2A', '#4D6644', '#E0C774'],
      });

      toast.success("Bukti Latihan Berhasil Diserahkan!", {
        description: "Trainer Dimas akan memverifikasi hasil latihan Anda.",
      });

      setSelectedTask(null);
      setPracticeNotes("");
      setIsTimerRunning(false);
      setPracticeTimer(0);

      const remRes = await fetch(`/api/teams/organizations/${orgId}/remediation`);
      if (remRes.ok) {
        const remData = await remRes.json();
        setRemediationTasks(remData.tasks || []);
      }
    } catch {
      toast.error("Gagal mengirim remedial.");
    }
  }

  const completedCount = steps.filter((s) => s.state === "completed").length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col pb-24 md:pb-12">
      <ShellNav role="barista" orgId={orgId} orgName="Senja Braga Flagship" userName="Budi Pratama (Barista)" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* Hero Banner: Progress & Ecosystem Link */}
        <div className="bg-white rounded-2xl border border-paper-300 p-5 sm:p-7 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cherry-700 font-bold px-2 py-0.5 rounded bg-cherry-50 border border-cherry-200">
                  Outlet: Senja Braga Flagship
                </span>
                <span className="text-[10px] font-mono text-roast-500 uppercase tracking-wider">
                  Batch Kalibrasi Q1
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-roast-950 tracking-tight">
                Standarisasi Kompetensi Barista
              </h1>
              <p className="text-xs sm:text-sm text-roast-600 mt-1 max-w-xl leading-relaxed">
                Kurikulum terpadu kalibrasi mesin espresso, texturing susu, dan etika kerja bar profesional Cherry Edu.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 bg-paper-50 p-4 rounded-xl border border-paper-200 shrink-0 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-3xl font-black font-serif text-cherry-700 leading-none">
                  {progressPercent}%
                </span>
                <p className="text-[10px] text-roast-500 mt-1 font-mono">
                  {completedCount} dari {steps.length} Selesai
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cherry-100 flex items-center justify-center text-cherry-800 shrink-0">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
          </div>

          {/* Progress Bar with Milestones */}
          <div className="mt-6 pt-5 border-t border-paper-200">
            <div className="flex justify-between text-[11px] font-mono text-roast-600 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-crema-600" /> Tahap Pembelajaran Aktif
              </span>
              <span>{completedCount}/{steps.length} Modul Tuntas</span>
            </div>
            <div className="w-full bg-paper-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-cherry-700 h-3 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${Math.max(progressPercent, 5)}%` }}
              />
            </div>
          </div>

          {/* Ecosystem B2C Connection Banner */}
          <div className="mt-5 p-3.5 rounded-xl bg-paper-50 border border-paper-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Coffee className="w-4 h-4 text-cherry-700 shrink-0" />
              <span className="text-roast-700">
                Ingin eksplorasi materi seduh manual &amp; cupping mendalam? Akses Pustaka Komunitas Cherry Edu.
              </span>
            </div>
            <a
              href="https://edu.cherrycoffeeroastery.com/paths"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cherry-800 hover:text-cherry-950 font-bold font-mono text-[11px] shrink-0 hover:underline"
            >
              <span>Katalog Akademi B2C</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex overflow-x-auto pb-1 gap-2 border-b border-paper-300 scrollbar-none">
          {[
            { id: "curriculum", label: "Silabus & Modul", count: steps.length, icon: BookOpen },
            { id: "tracker", label: "Radar Kompetensi", count: 4, icon: Award },
            { id: "calibration", label: "Dial-In Studio", count: null, icon: SlidersHorizontal },
            { id: "remediation", label: "Latihan Terarah", count: remediationTasks.length, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition flex items-center gap-2 shrink-0 ${
                  active
                    ? "bg-roast-950 text-white shadow-2xs"
                    : "bg-white text-roast-600 hover:text-roast-950 hover:bg-paper-50 border border-paper-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-crema-300" : "text-roast-500"}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded ${
                      active ? "bg-roast-800 text-white" : "bg-paper-100 text-roast-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: CURRICULUM ACCORDION */}
        {activeTab === "curriculum" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-black text-xl text-roast-950">Tahapan Kurikulum Barista</h2>
                <p className="text-xs text-roast-500">Klik modul untuk mempelajari materi dan submit bukti praktik</p>
              </div>
              <span className="text-xs font-mono text-roast-500 hidden sm:inline">Standar SCA Indonesia</span>
            </div>

            {loading && (
              <div className="p-8 text-center text-xs font-mono text-roast-500 bg-white rounded-xl border border-paper-200">
                Memuat silabus pelatihan...
              </div>
            )}

            {!loading && steps.map((step) => {
              const isCompleted = step.state === "completed";
              const isLocked = !step.is_unlocked;
              const isSubmitting = submittingStepId === step.id;

              return (
                <div
                  key={step.id}
                  className={`bg-white rounded-xl border p-4 sm:p-5 transition-all shadow-subtle ${
                    isCompleted
                      ? "border-olive-200 bg-paper-50/40"
                      : isLocked
                      ? "border-paper-200 opacity-60 bg-paper-50/80"
                      : "border-paper-300 hover:border-paper-400 hover:shadow-card"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs ${
                          isCompleted
                            ? "bg-olive-100 text-olive-800 border border-olive-300"
                            : isLocked
                            ? "bg-paper-200 text-roast-400"
                            : "bg-roast-950 text-white"
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-olive-700" /> : step.sort_order}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-paper-100 border border-paper-200 text-roast-600 font-bold">
                            {step.step_type}
                          </span>
                          {isCompleted && (
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-olive-100 text-olive-900 font-bold border border-olive-200">
                              ✓ Selesai Terverifikasi
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-paper-200 text-roast-500 font-semibold flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Prasyarat Belum Terpenuhi
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif font-bold text-base text-roast-950">
                          {step.title_override || `Tahapan ${step.sort_order}`}
                        </h3>
                        <p className="text-xs text-roast-600 mt-1 leading-relaxed">
                          {step.step_type === "theory"
                            ? "Pemahaman parameter dial-in, densitas bubuk kopi, dan channeling ekstraksi 9 bar."
                            : step.step_type === "practice"
                            ? "Praktik texturing microfoam glossy, stabilisasi suhu susu 60-65°C, dan pouring pola dasar."
                            : step.step_type === "quiz"
                            ? "Uji pemahaman prosedur SOP pembukaan bar, kalibrasi pagi, dan form checklist outlet."
                            : "Uji observasi kompetensi langsung di depan instruktur bersertifikasi Cherry Edu."}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {!isCompleted && !isLocked && (
                        <button
                          type="button"
                          onClick={() => handleCompleteStep(step)}
                          disabled={isSubmitting}
                          className="py-2 px-4 rounded-xl bg-roast-950 hover:bg-roast-850 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          <PlayCircle className="w-4 h-4 text-crema-300" />
                          <span>{isSubmitting ? "Menyimpan..." : "Tandai Selesai & Lulus"}</span>
                        </button>
                      )}
                      {isCompleted && (
                        <span className="text-xs font-mono text-olive-800 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-olive-600" /> Tuntas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: VISUAL COMPETENCY RADAR */}
        {activeTab === "tracker" && <CompetencyTrackerWidget />}

        {/* TAB 3: DAILY CALIBRATION STUDIO */}
        {activeTab === "calibration" && <DailyCalibrationWidget />}

        {/* TAB 4: DIRECT REMEDIATION WORKSPACE */}
        {activeTab === "remediation" && (
          <div className="space-y-4">
            <div>
              <h2 className="font-serif font-black text-xl text-roast-950">Latihan Terarah &amp; Remedial</h2>
              <p className="text-xs text-roast-600">
                Tugas khusus yang diberikan instruktur setelah evaluasi praktikal untuk mengasah aspek yang perlu ditingkatkan.
              </p>
            </div>

            {remediationTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-paper-300 p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-olive-600 mx-auto" />
                <h3 className="font-serif font-bold text-lg text-roast-950">Tidak Ada Tugas Remedial Aktif</h3>
                <p className="text-xs text-roast-600 max-w-md mx-auto">
                  Semua kriteria observasi praktikal Anda telah lulus standar industri. Terus pertahankan konsistensi ekstraksi harian!
                </p>
              </div>
            ) : (
              remediationTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-2xl border border-paper-300 p-5 sm:p-6 shadow-card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-paper-200">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-cherry-700 font-bold block mb-1">
                        Target Remedial: {task.competency_name}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-roast-950">{task.title}</h3>
                      <p className="text-xs text-roast-600 mt-1 leading-relaxed">{task.instructions}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cherry-50 text-cherry-900 border border-cherry-200 font-bold uppercase shrink-0">
                      Status: {task.status}
                    </span>
                  </div>

                  {/* Interactive Practice Stopwatch & Notes */}
                  <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-roast-700 font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-cherry-700" /> Stopwatch Latihan Seduh:
                      </span>
                      <span className="text-sm font-bold text-roast-950">{practiceTimer} detik</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition ${
                          isTimerRunning ? "bg-cherry-700 text-white" : "bg-roast-950 text-white hover:bg-roast-850"
                        }`}
                      >
                        {isTimerRunning ? "Pause Timer" : "Mulai Latihan Seduh"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsTimerRunning(false);
                          setPracticeTimer(0);
                        }}
                        className="py-1.5 px-3 rounded-lg text-xs font-mono bg-paper-200 text-roast-700 hover:bg-paper-300 transition"
                      >
                        Reset
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={practiceNotes}
                      onChange={(e) => setPracticeNotes(e.target.value)}
                      placeholder="Tuliskan catatan hasil latihan (contoh: Suhu susu dicapai 63°C, 3 pitcher berturut-turut tanpa bubble kasar)..."
                      className="w-full p-3 rounded-xl border border-paper-300 bg-white text-xs text-roast-950 placeholder-roast-400 focus:outline-none focus:border-roast-800 transition"
                    />

                    <button
                      type="button"
                      onClick={() => handleSubmitRemediation(task.id)}
                      className="w-full py-2.5 bg-roast-950 hover:bg-roast-850 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Bukti Latihan ke Trainer</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Dock (Only on Phone Screens) */}
      <MobileBottomNav
        role="barista"
        orgId={orgId}
        onOpenCalibration={() => setActiveTab("calibration")}
        onOpenTracker={() => setActiveTab("tracker")}
      />
    </div>
  );
}
