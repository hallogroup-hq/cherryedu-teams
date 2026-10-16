"use client";

import React, { use } from "react";
import Link from "next/link";
import ShellNav from "@/components/ShellNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import OwnerTeamGrowthView from "@/components/OwnerTeamGrowthView";
import { toast } from "sonner";
import { DEMO_MENTORSHIP_PROGRAM } from "@/lib/mentorshipService";
import {
  Download,
  Coffee,
  Clock,
} from "lucide-react";

export default function OwnerOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const program = DEMO_MENTORSHIP_PROGRAM;

  // Export Executive Report
  const handleExportReport = () => {
    const headers =
      "Nama Barista,Peran,Skor Awal,Skor Sekarang,Pertumbuhan,Fundamental Online,Praktik Teknik,Praktik Espresso,Class Path Selesai,Ujian Hybrid,Rekomendasi Trainer\n";
    const rows = program.baristas
      .map((b) => {
        const growth = `+${b.currentScore - b.initialScore} poin`;
        const fundamental =
          b.fundamentalHuluHilir.finalExamPassed && b.fundamentalBaristaPath.finalExamPassed
            ? "Lulus Penuh"
            : "Sebagian";
        const teknik = `${b.offlineTeknik.score}/100`;
        const espresso = `${b.offlineEspressoBase.score}/100`;
        const classes = `${b.classesTaken.filter((c) => c.completed).length}/3 Path`;
        const exam =
          b.hybridExam.status === "graded" ? `${b.hybridExam.finalScore}/100` : "Belum Ujian";
        return `"${b.name}","${b.role}","${b.initialScore}","${b.currentScore}","${growth}","${fundamental}","${teknik}","${espresso}","${classes}","${exam}","${b.trainerRecommendation}"`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-eksekutif-cherryedu-${orgId}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan Eksekutif Perkembangan Barista berhasil diunduh.");
  };

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="owner" orgId={orgId} orgName={program.coffeeShopName} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* EXECUTIVE REPORT HERO CARD */}
        <div className="card p-5 sm:p-7 bg-white border-paper-300 shadow-subtle space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                  Executive Owner Report · Transparansi Layanan
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-100 border border-paper-300 text-roast-900 font-bold">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-[11px] font-mono">
              {[
                { step: "01. R&D Audit", sub: "Audit Bar & SOP", status: "done" },
                { step: "02. Fundamental", sub: "Web Cherry Edu", status: "done" },
                { step: "03. Praktik Teknik", sub: "Sesi Offline Bar", status: "done" },
                { step: "04. Espresso Base", sub: "Dial-in & Sensori", status: "active" },
                { step: "05. Spesialisasi", sub: "Min. 3 Path Web", status: "pending" },
                { step: "06. Ujian Hybrid", sub: "Teori + Kasus Bar", status: "pending" },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-left space-y-0.5 ${
                    s.status === "done"
                      ? "bg-white border-roast-900 text-roast-950"
                      : s.status === "active"
                      ? "bg-white border-2 border-roast-950 shadow-2xs text-roast-950"
                      : "bg-paper-100/50 border-paper-200 text-roast-400"
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold block">{s.step}</span>
                  <span className="text-[11px] font-medium block truncate text-roast-800">{s.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HUMAN-CENTRIC OWNER VIEW */}
        <OwnerTeamGrowthView onExportReport={handleExportReport} />
      </main>

      <MobileBottomNav role="owner" orgId={orgId} />
    </div>
  );
}
