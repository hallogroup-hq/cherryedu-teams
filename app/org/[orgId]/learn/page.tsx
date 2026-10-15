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
  FileCheck2,
  Layers,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react";
import ShellNav from "@/components/ShellNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import CompetencyTrackerWidget from "@/components/CompetencyTrackerWidget";
import DailyCalibrationWidget from "@/components/DailyCalibrationWidget";
import HybridExamModal from "@/components/HybridExamModal";
import { DEMO_MENTORSHIP_PROGRAM, BaristaMentorshipRecord } from "@/lib/mentorshipService";

export default function BaristaLearnPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();

  const program = DEMO_MENTORSHIP_PROGRAM;
  const barista = program.baristas[0]; // Budi Pratama

  const [activeTab, setActiveTab] = useState<"roadmap" | "tracker" | "calibration" | "remediation">("roadmap");
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(barista.hybridExam.finalScore);

  // Fundamental Checklist Local State (for instant demo responsiveness)
  const [huluCompleted, setHuluCompleted] = useState(barista.fundamentalHuluHilir.completed);
  const [baristaPathCompleted, setBaristaPathCompleted] = useState(barista.fundamentalBaristaPath.completed);

  // Stopwatch for practice
  const [practiceTimer, setPracticeTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [practiceNotes, setPracticeNotes] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => setPracticeTimer((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleSyncCherryEduB2C = (type: "hulu" | "baristaPath") => {
    if (type === "hulu") {
      setHuluCompleted(true);
      toast.success("Progress Fundamental Hulu ke Hilir berhasil disinkronisasi dari Cherry Edu Web!");
    } else {
      setBaristaPathCompleted(true);
      toast.success("Progress Barista Path berhasil disinkronisasi dari Cherry Edu Web!");
    }
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#6B2737', '#FAF7F2', '#140E0C'],
    });
  };

  const handleExamSubmitted = (score: number) => {
    setExamScore(score);
    setIsExamModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="barista" orgId={orgId} orgName={program.coffeeShopName} userName={barista.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        
        {/* BARISTA HEADER CARD */}
        <div className="card p-5 sm:p-6 bg-white border-paper-300 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                  Portal Barista · {program.coffeeShopName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-900 font-bold">
                  Mentorship 1 Bulan (Hybrid)
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-roast-950">
                Halo, {barista.name}
              </h1>
              <p className="text-xs sm:text-sm text-roast-600 font-sans">
                {barista.role} · Minggu ke-{program.currentWeek} Mentorship Cherry Edu.
              </p>
            </div>

            {/* Quick Calibration Badge */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="p-2.5 rounded-xl bg-paper-50 border border-paper-200 text-center">
                <span className="text-[9px] font-mono uppercase text-roast-500 block">Skor Kompetensi</span>
                <span className="font-serif font-bold text-xl text-roast-950">{barista.currentScore}/100</span>
              </div>
              <div className="p-2.5 rounded-xl bg-crema-100 border border-crema-300 text-center">
                <span className="text-[9px] font-mono uppercase text-roast-600 block">Kenaikan Skill</span>
                <span className="font-serif font-bold text-xl text-roast-950">
                  +{barista.currentScore - barista.initialScore}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice to B2C Web */}
          <div className="p-3 rounded-xl bg-paper-50 border border-paper-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-cherry-700 shrink-0" />
              <span className="text-roast-700 font-sans">
                Materi teori online diambil langsung dari portal utama <strong>edu.cherrycoffeeroastery.com</strong>.
              </span>
            </div>
            <a
              href="https://edu.cherrycoffeeroastery.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cherry-800 hover:text-cherry-950 shrink-0"
            >
              <span>Buka Web Cherry Edu (B2C)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="flex border-b border-paper-300 gap-2 sm:gap-6 text-sm overflow-x-auto scrollbar-none">
          {[
            { key: "roadmap", label: "Roadmap 6 Modul Mentorship" },
            { key: "tracker", label: "Skill Radar & Pertumbuhan" },
            { key: "calibration", label: "Espresso Dial-In Studio" },
            { key: "remediation", label: "Latihan Terarah (Remedial)" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-1 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-roast-950 text-roast-950 font-bold"
                  : "border-transparent text-roast-500 hover:text-roast-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ROADMAP 6 MODUL MENTORSHIP */}
        {activeTab === "roadmap" && (
          <div className="space-y-4">
            
            {/* MODUL 2.1: FUNDAMENTAL HULU KE HILIR & BARISTA PATH */}
            <div className="card p-5 bg-white border-paper-300 space-y-4 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-paper-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-crema-100 border border-crema-300 font-bold text-roast-900">
                      Modul 2.1 · Online Sync
                    </span>
                    <span className="text-xs font-mono text-roast-500">Materi Teori Mandiri</span>
                  </div>
                  <h2 className="font-serif font-bold text-lg text-roast-950 mt-1">
                    Fundamental Hulu ke Hilir &amp; Barista Path
                  </h2>
                  <p className="text-xs text-roast-600 font-sans mt-0.5">
                    Materi dipelajari di web <strong>edu.cherrycoffeeroastery.com</strong>. Anda dapat menyelesaikannya secara bertahap sepanjang program.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-roast-800 bg-paper-100 px-2.5 py-1 rounded border border-paper-200 shrink-0 self-start sm:self-auto">
                  {huluCompleted && baristaPathCompleted ? "Lulus Penuh ✓" : "Sedang Dikerjakan"}
                </span>
              </div>

              {/* 2 Trackers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Hulu ke Hilir */}
                <div className="p-3.5 rounded-xl bg-paper-50 border border-paper-200 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif font-bold text-sm text-roast-950">
                        1. Fundamental Hulu ke Hilir
                      </h3>
                      <p className="text-[11px] text-roast-500 font-sans">
                        Varietas kopi, pascapanen &amp; roasting basics
                      </p>
                    </div>
                    {huluCompleted ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-paper-300 text-roast-900">
                        Skor 88 ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-roast-500">In Progress</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href="https://edu.cherrycoffeeroastery.com/courses/fundamental"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-[11px] py-1.5 px-3 flex-1 flex items-center justify-center gap-1"
                    >
                      <span>Buka Materi</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {!huluCompleted && (
                      <button
                        type="button"
                        onClick={() => handleSyncCherryEduB2C("hulu")}
                        className="btn-primary text-[11px] py-1.5 px-3"
                      >
                        Sinkronisasi Ujian
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Barista Path */}
                <div className="p-3.5 rounded-xl bg-paper-50 border border-paper-200 space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif font-bold text-sm text-roast-950">
                        2. Barista Learning Path
                      </h3>
                      <p className="text-[11px] text-roast-500 font-sans">
                        Teori ekstraksi, grinder calibration &amp; workflow
                      </p>
                    </div>
                    {baristaPathCompleted ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-paper-300 text-roast-900">
                        Skor 92 ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-roast-500">In Progress</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href="https://edu.cherrycoffeeroastery.com/courses/barista-path"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-[11px] py-1.5 px-3 flex-1 flex items-center justify-center gap-1"
                    >
                      <span>Buka Materi</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {!baristaPathCompleted && (
                      <button
                        type="button"
                        onClick={() => handleSyncCherryEduB2C("baristaPath")}
                        className="btn-primary text-[11px] py-1.5 px-3"
                      >
                        Sinkronisasi Ujian
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* MODUL 2.2: TEKNIK (OFFLINE MENTORSHIP) */}
            <div className="card p-5 bg-white border-paper-300 space-y-3.5 shadow-subtle">
              <div className="flex items-start justify-between border-b border-paper-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-paper-100 border border-paper-300 font-bold text-roast-900">
                      Modul 2.2 · Tatap Muka Offline
                    </span>
                    <span className="text-xs font-mono text-roast-500">Sesi Barista di Bar Kafe</span>
                  </div>
                  <h2 className="font-serif font-bold text-lg text-roast-950 mt-1">
                    Praktik Teknik: Ergonomi Bar &amp; Konsistensi Tamping
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-roast-900 bg-crema-100 border border-crema-300 px-2.5 py-1 rounded">
                  Skor: {barista.offlineTeknik.score}/100 ✓
                </span>
              </div>

              <p className="text-xs text-roast-600 leading-relaxed font-sans">
                {barista.offlineTeknik.trainerNotes}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                {[
                  { label: "Ergonomi Bar", pass: barista.offlineTeknik.criteria.barErgonomics },
                  { label: "Distribusi WDT", pass: barista.offlineTeknik.criteria.dosingDistribution },
                  { label: "Tamping Konsisten", pass: barista.offlineTeknik.criteria.tampingConsistency },
                  { label: "Sanitasi Stasiun", pass: barista.offlineTeknik.criteria.stationCleanliness },
                ].map((c) => (
                  <div key={c.label} className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 flex items-center justify-between">
                    <span className="text-roast-700 text-[11px]">{c.label}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-roast-950 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* MODUL 2.3: ESPRESSO BASE (OFFLINE MENTORSHIP) */}
            <div className="card p-5 bg-white border-paper-300 space-y-3.5 shadow-subtle">
              <div className="flex items-start justify-between border-b border-paper-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-paper-100 border border-paper-300 font-bold text-roast-900">
                      Modul 2.3 · Tatap Muka Offline
                    </span>
                    <span className="text-xs font-mono text-roast-500">Dial-In &amp; Sensori</span>
                  </div>
                  <h2 className="font-serif font-bold text-lg text-roast-950 mt-1">
                    Praktik Espresso Base &amp; Kalibrasi Rasa
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold text-roast-900 bg-crema-100 border border-crema-300 px-2.5 py-1 rounded">
                  Skor: {barista.offlineEspressoBase.score}/100 ✓
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-paper-50 border border-paper-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-roast-500 font-bold">Rasio Terverifikasi:</span>
                  <p className="font-mono font-bold text-sm text-roast-950 mt-0.5">{barista.offlineEspressoBase.dialInRatio}</p>
                  <p className="text-roast-600 font-sans mt-0.5 text-[11px]">{barista.offlineEspressoBase.trainerNotes}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("calibration")}
                  className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Buka Dial-In Studio</span>
                </button>
              </div>
            </div>

            {/* MODUL 2.4: CLASS MINIMAL 3 PATH DARI CHERRY EDU */}
            <div className="card p-5 bg-white border-paper-300 space-y-4 shadow-subtle">
              <div className="flex items-start justify-between border-b border-paper-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-crema-100 border border-crema-300 font-bold text-roast-900">
                      Modul 2.4 · Spesialisasi
                    </span>
                    <span className="text-xs font-mono text-roast-500">Website Cherry Edu</span>
                  </div>
                  <h2 className="font-serif font-bold text-lg text-roast-950 mt-1">
                    Class Spesialisasi (Wajib Minimal 3 Path)
                  </h2>
                  <p className="text-xs text-roast-600 font-sans mt-0.5">
                    Pilih dan selesaikan minimal 3 learning path spesialisasi dari kurikulum B2C.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-roast-900 bg-paper-100 px-2.5 py-1 rounded border border-paper-200 shrink-0">
                  {barista.classesTaken.filter((c) => c.completed).length} / 3 Selesai
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {barista.classesTaken.map((cl) => (
                  <div key={cl.pathId} className="p-3.5 rounded-xl bg-paper-50 border border-paper-200 space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white text-roast-600 border border-paper-200">
                          {cl.category}
                        </span>
                        {cl.completed && (
                          <span className="text-[10px] font-mono font-bold text-roast-900">
                            Skor {cl.score}% ✓
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif font-bold text-sm text-roast-950">{cl.title}</h3>
                    </div>

                    <a
                      href={cl.cherryEduUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-[11px] py-1.5 px-2.5 flex items-center justify-center gap-1 w-full"
                    >
                      <span>{cl.completed ? "Pelajari Ulang" : "Buka Kelas"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* MODUL 2.5: UJIAN KOMPREHENSIF HYBRID */}
            <div className="card p-5 bg-white border-paper-300 space-y-4 shadow-subtle">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-paper-200 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-roast-950 text-white font-bold">
                      Modul 2.5 · Evaluasi
                    </span>
                    <span className="text-xs font-mono text-roast-500">Ujian Gabungan</span>
                  </div>
                  <h2 className="font-serif font-bold text-lg text-roast-950 mt-1">
                    Ujian Komprehensif Barista (Hybrid)
                  </h2>
                  <p className="text-xs text-roast-600 font-sans mt-0.5">
                    Kombinasi soal teori dari <strong>edu.cherrycoffeeroastery.com</strong> + soal khusus trainer mengenai SOP kafe ini.
                  </p>
                </div>

                <div className="shrink-0 self-start sm:self-auto">
                  {examScore ? (
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-crema-100 border border-crema-300 text-roast-900 inline-block">
                      Lulus · Skor {examScore}/100 ✓
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-roast-500">Belum Mengikuti Ujian</span>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-semibold text-roast-950 font-serif text-sm">
                    {examScore
                      ? "Ujian Telah Diselesaikan & Tercatat di Laporan Owner"
                      : "Siap Uji Kompetensi Akhir?"}
                  </p>
                  <p className="text-roast-600 text-[11px] font-sans mt-0.5">
                    Format 5 soal studi kasus (Teori Ekstraksi, Pascapanen, Milk Science, dan SOP Kafe).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(true)}
                  className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5 shrink-0 shadow-2xs"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{examScore ? "Uji Ulang Ujian Hybrid" : "Mulai Ujian Sekarang"}</span>
                </button>
              </div>
            </div>

            {/* MODUL 2.6: RAPOR OWNER & CATATAN TRAINER */}
            <div className="card p-5 bg-paper-50 border-paper-300 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold block">
                Modul 2.6 · Rapor Perkembangan Pribadi
              </span>
              <p className="text-roast-950 font-serif text-sm italic leading-relaxed">
                &ldquo;{barista.trainerRecommendation}&rdquo;
              </p>
              <div className="flex items-center justify-between text-xs font-mono text-roast-600 pt-2 border-t border-paper-200">
                <span>Instruktur: Dimas Trainer (Cherry Edu)</span>
                <span className="font-bold text-roast-900">Status: {barista.overallStatus.replace(/_/g, " ").toUpperCase()}</span>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: SKILL TRACKER & METRICS */}
        {activeTab === "tracker" && (
          <div className="space-y-4">
            <CompetencyTrackerWidget />
          </div>
        )}

        {/* TAB 3: ESPRESSO DIAL-IN STUDIO */}
        {activeTab === "calibration" && (
          <div className="space-y-4">
            <DailyCalibrationWidget />
          </div>
        )}

        {/* TAB 4: REMEDIATION / LATIHAN TERARAH */}
        {activeTab === "remediation" && (
          <div className="card p-5 bg-white border-paper-300 space-y-4 shadow-subtle">
            <div>
              <h2 className="font-serif font-bold text-lg text-roast-950">Latihan Terarah (Remedial &amp; Mandiri)</h2>
              <p className="text-xs text-roast-500">Gunakan stopwatch untuk melatih kecepatan dan akurasi ekstraksi di stasiun bar</p>
            </div>

            <div className="p-5 rounded-xl bg-paper-50 border border-paper-200 text-center space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                Stopwatch Latihan Barista
              </span>
              <div className="font-mono font-black text-4xl sm:text-5xl text-roast-950 tabular-nums">
                {Math.floor(practiceTimer / 60).toString().padStart(2, '0')}:
                {(practiceTimer % 60).toString().padStart(2, '0')}
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`btn-primary text-xs py-2 px-5 ${isTimerRunning ? 'bg-roast-700' : ''}`}
                >
                  {isTimerRunning ? "Jeda Stopwatch" : "Mulai Stopwatch"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setPracticeTimer(0);
                  }}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label text-xs">Catatan Latihan Mandiri</label>
              <textarea
                rows={3}
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
                placeholder="Catat hasil rasa espresso, suhu susu, atau kendala grinder pagi ini..."
                className="input text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!practiceNotes.trim()) return;
                  toast.success("Catatan latihan berhasil disimpan ke log harian.");
                  setPracticeNotes("");
                }}
                className="btn-primary text-xs py-2 px-4"
              >
                Simpan Catatan Latihan
              </button>
            </div>
          </div>
        )}

      </main>

      {/* HYBRID EXAM MODAL */}
      <HybridExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        baristaName={barista.name}
        onExamSubmitted={handleExamSubmitted}
      />

      {/* Sticky Mobile Bottom Navigation for Barista */}
      <MobileBottomNav
        role="barista"
        orgId={orgId}
        onOpenCalibration={() => setActiveTab("calibration")}
        onOpenTracker={() => setActiveTab("tracker")}
      />
    </div>
  );
}
