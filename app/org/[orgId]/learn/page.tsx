"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import ShellNav from "@/components/ShellNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import BaristaChecklistGamification from "@/components/BaristaChecklistGamification";
import DailyCalibrationWidget from "@/components/DailyCalibrationWidget";
import HybridExamModal from "@/components/HybridExamModal";
import { DEMO_MENTORSHIP_PROGRAM } from "@/lib/mentorshipService";
import {
  Coffee,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Award,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export default function BaristaLearnPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const program = DEMO_MENTORSHIP_PROGRAM;
  const barista = program.baristas[0]; // Budi Pratama

  const [activeSegment, setActiveSegment] = useState<"checklist" | "dialin">("checklist");
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [examScore, setExamScore] = useState<number | null>(barista.hybridExam.finalScore);

  const handleExamSubmitted = (score: number) => {
    setExamScore(score);
    setIsExamModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav
        role="barista"
        orgId={orgId}
        orgName={program.coffeeShopName}
        userName={barista.name}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        
        {/* BARISTA WELCOME HERO */}
        <div className="card p-5 sm:p-6 bg-white border-paper-300 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                  Portal Barista · {program.coffeeShopName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-900 font-bold">
                  Mentorship 1 Bulan
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-roast-950">
                Halo, {barista.name} 👋
              </h1>
              <p className="text-xs sm:text-sm text-roast-600 font-sans">
                {barista.role} · Selesaikan 6 modul untuk sertifikasi barista terstandar Cherry Edu.
              </p>
            </div>

            {/* Quick Web Catalog Pill */}
            <a
              href="https://edu.cherrycoffeeroastery.com/paths"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              title="Buka katalog kurikulum utama di web"
            >
              <BookOpen className="w-3.5 h-3.5 text-roast-700" />
              <span>Katalog Materi Web</span>
              <ExternalLink className="w-3 h-3 text-roast-400" />
            </a>
          </div>

          {/* Clean 2-Segment Mobile Toggle */}
          <div className="pt-2">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-paper-100 border border-paper-300 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveSegment("checklist")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeSegment === "checklist"
                    ? "bg-roast-950 text-white shadow-2xs"
                    : "text-roast-600 hover:text-roast-950"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ceklis Mentorship</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSegment("dialin")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                  activeSegment === "dialin"
                    ? "bg-roast-950 text-white shadow-2xs"
                    : "text-roast-600 hover:text-roast-950"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Espresso Dial-In</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: GAMIFIED CHECKLIST */}
        {activeSegment === "checklist" && (
          <BaristaChecklistGamification
            onOpenDialIn={() => setActiveSegment("dialin")}
            onOpenExam={() => setIsExamModalOpen(true)}
            examPassed={Boolean(examScore && examScore >= 75)}
            examScore={examScore}
          />
        )}

        {/* SECTION 2: DIAL-IN STUDIO */}
        {activeSegment === "dialin" && (
          <div className="space-y-4">
            <DailyCalibrationWidget />
          </div>
        )}

      </main>

      {/* INTERACTIVE HYBRID EXAM MODAL */}
      <HybridExamModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        baristaName={barista.name}
        onExamSubmitted={handleExamSubmitted}
      />

      {/* STICKY BOTTOM DOCK FOR MOBILE */}
      <MobileBottomNav
        role="barista"
        orgId={orgId}
        onOpenCalibration={() => setActiveSegment("dialin")}
        onOpenTracker={() => setActiveSegment("checklist")}
      />
    </div>
  );
}
