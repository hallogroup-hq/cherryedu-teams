"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import ShellNav from "@/components/ShellNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import { toast } from "sonner";
import {
  DEMO_MENTORSHIP_PROGRAM,
  BaristaMentorshipRecord,
  TrainerServiceLog,
} from "@/lib/mentorshipService";
import {
  FileText,
  Users,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  X,
  Coffee,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
} from "lucide-react";

export default function OwnerOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const program = DEMO_MENTORSHIP_PROGRAM;

  const [activeTab, setActiveTab] = useState<"baristas" | "activity" | "rnd" | "exams">("baristas");
  const [selectedBarista, setSelectedBarista] = useState<BaristaMentorshipRecord | null>(null);

  // Export Executive Report
  const handleExportReport = () => {
    const headers = "Nama Barista,Peran,Skor Awal,Skor Sekarang,Pertumbuhan,Fundamental Online,Praktik Teknik,Praktik Espresso,Class Path Selesai,Ujian Hybrid,Rekomendasi Trainer\n";
    const rows = program.baristas.map((b) => {
      const growth = `+${b.currentScore - b.initialScore} poin`;
      const fundamental = b.fundamentalHuluHilir.finalExamPassed && b.fundamentalBaristaPath.finalExamPassed ? "Lulus Penuh" : "Sebagian";
      const teknik = `${b.offlineTeknik.score}/100`;
      const espresso = `${b.offlineEspressoBase.score}/100`;
      const classes = `${b.classesTaken.filter((c) => c.completed).length}/3 Path`;
      const exam = b.hybridExam.status === "graded" ? `${b.hybridExam.finalScore}/100` : "Belum Ujian";
      return `"${b.name}","${b.role}","${b.initialScore}","${b.currentScore}","${growth}","${fundamental}","${teknik}","${espresso}","${classes}","${exam}","${b.trainerRecommendation}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-eksekutif-cherryedu-${orgId}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan Eksekutif Perkembangan Barista berhasil diunduh.");
  };

  const avgInitial = Math.round(
    program.baristas.reduce((acc, b) => acc + b.initialScore, 0) / program.baristas.length
  );
  const avgCurrent = Math.round(
    program.baristas.reduce((acc, b) => acc + b.currentScore, 0) / program.baristas.length
  );

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="owner" orgId={orgId} orgName={program.coffeeShopName} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        
        {/* EXECUTIVE REPORT HERO CARD */}
        <div className="card p-5 sm:p-7 bg-white border-paper-300 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                  Executive Owner Report · Transparansi Layanan
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-900 font-bold">
                  Program Mentorship 1 Bulan (Hybrid)
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-roast-950">
                {program.coffeeShopName}
              </h1>
              <p className="text-xs sm:text-sm text-roast-600 font-sans max-w-2xl leading-relaxed">
                Laporan resmi pendampingan SDM oleh tim Cherry Edu. Menampilkan seluruh aktivitas offline trainer, penguasaan materi online, dan matriks perkembangan nyata tiap barista.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleExportReport}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Laporan (.CSV)</span>
              </button>
              <Link
                href={`/org/${orgId}/learn`}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lihat Portal Barista</span>
              </Link>
            </div>
          </div>

          {/* ROADMAP TIMELINE 1 BULAN (STEPPER) */}
          <div className="p-4 sm:p-5 rounded-xl bg-paper-50 border border-paper-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-roast-700" />
                <span className="font-serif font-bold text-sm text-roast-950">
                  Tahap Layanan: Minggu ke-{program.currentWeek} dari 4 Minggu
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-roast-800">
                Progress Keseluruhan: {program.overallServiceProgressPct}%
              </span>
            </div>

            {/* Visual Stepper */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {[
                { step: "1. R&D Audit", sub: "Audit Bar & SOP", status: "done" },
                { step: "2.1 Fundamental", sub: "Web Cherry Edu", status: "done" },
                { step: "2.2 Praktik Teknik", sub: "Sesi Offline Bar", status: "done" },
                { step: "2.3 Espresso Base", sub: "Dial-In & Sensori", status: "active" },
                { step: "2.4 Class 3 Path", sub: "Min. 3 Modul Pilihan", status: "active" },
                { step: "2.5 Ujian & Rapor", sub: "Evaluasi Akhir", status: "pending" },
              ].map((m) => (
                <div
                  key={m.step}
                  className={`p-2.5 rounded-lg border text-xs space-y-0.5 ${
                    m.status === "done"
                      ? "bg-white border-paper-300 text-roast-950"
                      : m.status === "active"
                      ? "bg-crema-100 border-crema-300 text-roast-950 shadow-2xs font-semibold"
                      : "bg-paper-100/60 border-paper-200 text-roast-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold">{m.step}</span>
                    {m.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-roast-950 shrink-0" />}
                    {m.status === "active" && <span className="w-2 h-2 rounded-full bg-cherry-700 animate-pulse" />}
                  </div>
                  <p className="text-[10px] text-roast-500 font-sans">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KEY METRICS SUMMARY */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold block mb-1">
                Barista Didampingi
              </span>
              <p className="text-2xl font-bold font-serif text-roast-950">{program.baristas.length} Orang</p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">SDM aktif coffee shop</p>
            </div>

            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold block mb-1">
                Kenaikan Skill Tim
              </span>
              <p className="text-2xl font-bold font-serif text-roast-950">
                +{avgCurrent - avgInitial} <span className="text-sm font-sans font-normal text-roast-500">Poin</span>
              </p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">Rata-rata {avgInitial} → {avgCurrent}</p>
            </div>

            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold block mb-1">
                Sesi Offline Trainer
              </span>
              <p className="text-2xl font-bold font-serif text-roast-950">{program.serviceLogs.length} Kali</p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">Tatap muka langsung di bar</p>
            </div>

            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold block mb-1">
                Status R&amp;D Resep
              </span>
              <p className="text-2xl font-bold font-serif text-roast-950">Selesai</p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">Rasio 1:2.0 terstandarisasi</p>
            </div>
          </div>
        </div>

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="flex border-b border-paper-300 gap-2 sm:gap-6 text-sm overflow-x-auto scrollbar-none">
          {[
            { key: "baristas", label: `Rapor & Perkembangan Barista (${program.baristas.length})` },
            { key: "activity", label: `Aktivitas Trainer Cherry Edu (${program.serviceLogs.length})` },
            { key: "rnd", label: "Hasil Audit R&D & Resep Bar" },
            { key: "exams", label: "Evaluasi Ujian Hybrid" },
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

        {/* TAB 1: RAPOR & PERKEMBANGAN BARISTA */}
        {activeTab === "baristas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-roast-950">Matriks Pertumbuhan Barista</h2>
                <p className="text-xs text-roast-500">Klik barista untuk melihat audit penguasaan 6 modul mentorship</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {program.baristas.map((barista) => {
                const growth = barista.currentScore - barista.initialScore;
                return (
                  <div
                    key={barista.id}
                    onClick={() => setSelectedBarista(barista)}
                    className="card p-5 bg-white border-paper-300 hover:border-roast-500 hover:shadow-subtle transition-all cursor-pointer space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-crema-200 border border-crema-300 text-roast-900 font-serif font-black flex items-center justify-center text-sm shrink-0">
                          {barista.avatarText}
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-base text-roast-950 leading-tight">
                            {barista.name}
                          </h3>
                          <p className="text-xs text-roast-500 font-mono mt-0.5">{barista.role}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-roast-950 block">
                          {barista.currentScore}/100
                        </span>
                        <span className="text-[10px] font-mono text-amber-800 font-bold">
                          +{growth} poin
                        </span>
                      </div>
                    </div>

                    {/* Before vs After Visual Bar */}
                    <div className="p-3 rounded-xl bg-paper-50 border border-paper-200/80 space-y-2 text-xs">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-roast-500">Awal: {barista.initialScore}</span>
                        <span className="text-roast-950 font-bold">Saat Ini: {barista.currentScore}</span>
                      </div>
                      <div className="w-full bg-paper-200 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className="bg-paper-400 h-full"
                          style={{ width: `${barista.initialScore}%` }}
                          title={`Skor Awal: ${barista.initialScore}`}
                        />
                        <div
                          className="bg-roast-950 h-full"
                          style={{ width: `${growth}%` }}
                          title={`Kenaikan: +${growth}`}
                        />
                      </div>
                    </div>

                    {/* 6-Pill Checkpoints Snapshot */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      <div className="p-2 rounded bg-paper-50 border border-paper-200">
                        <span className="text-roast-500 block text-[9px]">2.1 FUNDAMENTAL</span>
                        <span className="font-semibold text-roast-900">
                          {barista.fundamentalHuluHilir.finalExamPassed ? "Teori Lulus" : "In Progress"}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-paper-50 border border-paper-200">
                        <span className="text-roast-500 block text-[9px]">2.2 TEKNIK OFFLINE</span>
                        <span className="font-semibold text-roast-900">
                          {barista.offlineTeknik.score}/100
                        </span>
                      </div>

                      <div className="p-2 rounded bg-paper-50 border border-paper-200">
                        <span className="text-roast-500 block text-[9px]">2.3 ESPRESSO BASE</span>
                        <span className="font-semibold text-roast-900">
                          {barista.offlineEspressoBase.score}/100
                        </span>
                      </div>

                      <div className="p-2 rounded bg-paper-50 border border-paper-200">
                        <span className="text-roast-500 block text-[9px]">2.4 CLASS PATH</span>
                        <span className="font-semibold text-roast-900">
                          {barista.classesTaken.filter((c) => c.completed).length}/3 Path
                        </span>
                      </div>
                    </div>

                    {/* Trainer Note Snippet */}
                    <div className="pt-2 border-t border-paper-200 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-roast-600 line-clamp-1 italic font-sans">
                        &ldquo;{barista.trainerRecommendation}&rdquo;
                      </span>
                      <ChevronRight className="w-4 h-4 text-roast-400 shrink-0 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: AKTIVITAS & TRANSPARANSI LAYANAN */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="card p-5 sm:p-6 bg-white border-paper-300 space-y-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-roast-950">
                  Transparansi Layanan: Apa Saja yang Dikerjakan Tim Cherry Edu?
                </h2>
                <p className="text-xs text-roast-500">
                  Rekam jejak kunjungan tatap muka, pendampingan bar offline, dan tindakan yang telah dieksekusi.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {program.serviceLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 sm:p-5 rounded-xl bg-paper-50 border border-paper-200 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-paper-200/80 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-paper-300 font-bold text-roast-800">
                            {log.sessionType === "rnd"
                              ? "Fase 1: R&D & Audit"
                              : log.sessionType === "offline_teknik"
                              ? "Fase 2.2: Praktik Teknik"
                              : "Fase 2.3: Espresso Base"}
                          </span>
                          <span className="text-xs font-mono text-roast-500">{log.date}</span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-roast-950 mt-1">
                          {log.title}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-roast-600 bg-white px-2.5 py-1 rounded border border-paper-200 self-start sm:self-auto font-medium">
                        Instruktur: {log.trainerName}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-roast-700 font-sans leading-relaxed">
                      {log.summary}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 bg-white rounded-lg border border-paper-200/80 space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                          Temuan di Bar:
                        </span>
                        <ul className="list-disc list-inside text-roast-700 space-y-0.5 text-[11px]">
                          {log.findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-paper-200/80 space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                          Rekomendasi Tindak Lanjut:
                        </span>
                        <ul className="list-disc list-inside text-roast-700 space-y-0.5 text-[11px]">
                          {log.actionItems.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HASIL AUDIT R&D & RESEP KOPI */}
        {activeTab === "rnd" && (
          <div className="space-y-4">
            <div className="card p-5 sm:p-6 bg-white border-paper-300 space-y-5">
              <div>
                <h2 className="font-serif font-bold text-lg text-roast-950">
                  Laporan Audit R&amp;D dan Spesifikasi Seduh Kafe
                </h2>
                <p className="text-xs text-roast-500">
                  Audit fondasi mesin, air, gilingan, dan standarisasi resep SOP resmi.
                </p>
              </div>

              {/* R&D Recipe Highlight Card */}
              <div className="p-5 rounded-xl bg-paper-50 border border-paper-300 space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold block">
                  Standarisasi Resep House Blend Kafe (Hasil Kalibrasi Cherry Edu)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-paper-200">
                    <span className="text-[10px] font-mono text-roast-400 uppercase">Dosis Bubuk</span>
                    <p className="font-serif font-black text-2xl text-roast-950 mt-0.5">
                      {program.rndAudit.houseBlendRecipe.doseGrams}g
                    </p>
                    <span className="text-[10px] text-roast-500 font-mono">± 0.2g tolerance</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-paper-200">
                    <span className="text-[10px] font-mono text-roast-400 uppercase">Yield Liquid</span>
                    <p className="font-serif font-black text-2xl text-roast-950 mt-0.5">
                      {program.rndAudit.houseBlendRecipe.yieldGrams}g
                    </p>
                    <span className="text-[10px] text-roast-500 font-mono">Hasil cangkir</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-paper-200">
                    <span className="text-[10px] font-mono text-roast-400 uppercase">Waktu Ekstraksi</span>
                    <p className="font-serif font-black text-2xl text-roast-950 mt-0.5">
                      {program.rndAudit.houseBlendRecipe.targetTimeSec}s
                    </p>
                    <span className="text-[10px] text-roast-500 font-mono">Rentang 26–28s</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-paper-200">
                    <span className="text-[10px] font-mono text-roast-400 uppercase">Rasio Seduh</span>
                    <p className="font-serif font-black text-2xl text-roast-950 mt-0.5">
                      {program.rndAudit.houseBlendRecipe.brewRatio}
                    </p>
                    <span className="text-[10px] text-roast-500 font-mono">Ideal espresso</span>
                  </div>
                </div>
              </div>

              {/* Hardware & Water Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                    Mesin Espresso &amp; Tekanan:
                  </span>
                  <p className="text-roast-900 font-medium font-sans">{program.rndAudit.machineStatus}</p>
                </div>

                <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                    TDS &amp; Kualitas Air Bar:
                  </span>
                  <p className="text-roast-900 font-medium font-sans">
                    {program.rndAudit.waterTdsPpm} PPM (Optimal untuk ekstraksi Specialty Coffee)
                  </p>
                </div>
              </div>

              {/* Key Findings List */}
              <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                  Catatan Audit R&amp;D Trainer:
                </span>
                <ul className="list-disc list-inside text-roast-700 space-y-1 text-xs">
                  {program.rndAudit.keyFindings.map((kf, i) => (
                    <li key={i}>{kf}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UJIAN HYBRID & HASIL EVALUASI */}
        {activeTab === "exams" && (
          <div className="space-y-4">
            <div className="card p-5 sm:p-6 bg-white border-paper-300 space-y-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-roast-950">
                  Hasil Ujian Komprehensif Barista (Modul 2.5)
                </h2>
                <p className="text-xs text-roast-500">
                  Ujian terintegrasi menggabungkan kurikulum teori Cherry Edu dengan studi kasus operasional kafe ini.
                </p>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Nama Barista</th>
                      <th>Status Ujian</th>
                      <th className="text-center">Skor Teori Online</th>
                      <th className="text-center">Skor Kasus Trainer</th>
                      <th className="text-center">Nilai Akhir</th>
                      <th>Keputusan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {program.baristas.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div className="font-semibold text-roast-950">{b.name}</div>
                          <div className="text-xs text-roast-500 font-mono">{b.role}</div>
                        </td>
                        <td>
                          <span className="status-pill font-mono">
                            {b.hybridExam.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-center font-mono font-bold text-roast-950">
                          {b.hybridExam.status === "graded" ? `${b.hybridExam.theoryScore}%` : "—"}
                        </td>
                        <td className="text-center font-mono font-bold text-roast-950">
                          {b.hybridExam.status === "graded" ? `${b.hybridExam.practicalCustomScore}%` : "—"}
                        </td>
                        <td className="text-center font-mono font-black text-roast-950 text-sm">
                          {b.hybridExam.status === "graded" ? `${b.hybridExam.finalScore}` : "—"}
                        </td>
                        <td>
                          <span className={`text-xs font-mono font-bold ${
                            b.hybridExam.passed ? "text-roast-950" : "text-roast-500"
                          }`}>
                            {b.hybridExam.passed ? "LULUS (STANDAR INDUSTRI)" : "PERLU REMEDIAL"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: DETAIL BARISTA AUDIT INSPECTOR */}
      {selectedBarista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-roast-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="card max-w-xl w-full bg-white p-5 sm:p-6 rounded-2xl shadow-elevated border border-paper-300 max-h-[92vh] overflow-y-auto space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-paper-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-crema-200 border border-crema-300 text-roast-900 font-serif font-black flex items-center justify-center text-lg shrink-0">
                  {selectedBarista.avatarText}
                </div>
                <div>
                  <h3 className="font-serif font-black text-xl text-roast-950">{selectedBarista.name}</h3>
                  <p className="text-xs text-roast-500 font-mono">{selectedBarista.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBarista(null)}
                className="text-roast-400 hover:text-roast-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Growth Summary Card */}
            <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-roast-500 font-bold">Evaluasi Kenaikan</span>
                <p className="font-serif font-bold text-base text-roast-950 mt-0.5">
                  Skor {selectedBarista.initialScore} → {selectedBarista.currentScore} (+{selectedBarista.currentScore - selectedBarista.initialScore} poin)
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-white border border-paper-300 text-roast-900">
                {selectedBarista.overallStatus.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>

            {/* 6 Pillars Breakdown */}
            <div className="space-y-3 text-xs">
              <h4 className="font-serif font-bold text-sm text-roast-950">
                Rincian 6 Pilar Mentorship 1 Bulan:
              </h4>

              {/* 2.1 Fundamental */}
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-roast-900">2.1 Fundamental Hulu ke Hilir &amp; Barista Path (Online)</span>
                  <span className="text-roast-700">
                    {selectedBarista.fundamentalHuluHilir.finalExamPassed ? "LULUS" : "BELUM LENGKAP"}
                  </span>
                </div>
                <p className="text-[11px] text-roast-500">
                  Ujian Teori: {selectedBarista.fundamentalHuluHilir.examScore ?? "—"}/100 · Barista Path: {selectedBarista.fundamentalBaristaPath.examScore ?? "—"}/100
                </p>
              </div>

              {/* 2.2 Teknik */}
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-roast-900">2.2 Praktik Teknik Offline (Bar Ergonomics &amp; Tamping)</span>
                  <span className="text-roast-700">{selectedBarista.offlineTeknik.score}/100</span>
                </div>
                <p className="text-[11px] text-roast-600 font-sans">
                  Catatan: {selectedBarista.offlineTeknik.trainerNotes}
                </p>
              </div>

              {/* 2.3 Espresso Base */}
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-roast-900">2.3 Espresso Base &amp; Kalibrasi (Offline)</span>
                  <span className="text-roast-700">{selectedBarista.offlineEspressoBase.score}/100</span>
                </div>
                <p className="text-[11px] text-roast-600 font-sans">
                  Rasio: {selectedBarista.offlineEspressoBase.dialInRatio} · Evaluasi: {selectedBarista.offlineEspressoBase.sensoryEvaluation}
                </p>
              </div>

              {/* 2.4 Class 3 Path */}
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 space-y-2">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-roast-900">2.4 Class Pilihan (Min. 3 Path Cherry Edu Web)</span>
                  <span className="text-roast-700">
                    {selectedBarista.classesTaken.filter((c) => c.completed).length}/3 Path
                  </span>
                </div>
                <div className="space-y-1">
                  {selectedBarista.classesTaken.map((cl) => (
                    <div key={cl.pathId} className="flex items-center justify-between text-[11px]">
                      <span className="text-roast-700 font-medium">• {cl.title}</span>
                      <span className="font-mono text-roast-500">
                        {cl.completed ? `Selesai (${cl.score}%)` : "Sedang Berjalan"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2.5 Ujian Hybrid */}
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-roast-900">2.5 Ujian Komprehensif Hybrid</span>
                  <span className="text-roast-700">
                    {selectedBarista.hybridExam.status === "graded"
                      ? `${selectedBarista.hybridExam.finalScore}/100 (LULUS)`
                      : "BELUM UJIAN"}
                  </span>
                </div>
                <p className="text-[11px] text-roast-500">
                  Teori Online: {selectedBarista.hybridExam.theoryScore}% · Kasus Trainer: {selectedBarista.hybridExam.practicalCustomScore}%
                </p>
              </div>

              {/* 2.6 Trainer Recommendation */}
              <div className="p-3.5 bg-paper-100 rounded-lg border border-paper-300 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-roast-700 font-bold block">
                  Rekomendasi Resmi Trainer Cherry Edu untuk Owner:
                </span>
                <p className="text-roast-950 font-serif text-xs leading-relaxed italic">
                  &ldquo;{selectedBarista.trainerRecommendation}&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBarista(null)}
              className="btn-primary w-full text-xs py-2.5"
            >
              Tutup Rincian Barista
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role="owner" orgId={orgId} />
    </div>
  );
}
