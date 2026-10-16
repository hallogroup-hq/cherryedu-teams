"use client";

import React, { useState, use } from "react";
import ShellNav from "@/components/ShellNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import BaristaDailyExperience from "@/components/BaristaDailyExperience";
import HybridExamModal from "@/components/HybridExamModal";
import { DEMO_MENTORSHIP_PROGRAM } from "@/lib/mentorshipService";
import { ExternalLink, BookOpen } from "lucide-react";

export default function BaristaLearnPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const program = DEMO_MENTORSHIP_PROGRAM;
  const barista = program.baristas[0]; // Budi Pratama

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
        {/* BARISTA HERO */}
        <div className="card p-5 sm:p-6 bg-white border-paper-300 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                  Ruang Belajar Barista · {program.coffeeShopName}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-100 border border-paper-300 text-roast-900 font-bold">
                  Mentorship 1 Bulan
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-roast-950">
                {barista.name}
              </h1>
              <p className="text-xs sm:text-sm text-roast-600 font-sans">
                {barista.role} · Selesaikan 5 tahapan kecakapan untuk sertifikasi barista resmi Cherry Edu.
              </p>
            </div>

            {/* Quick Web Catalog Link */}
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
        </div>

        {/* PRIMARY BARISTA EXPERIENCE WORKSPACE */}
        <BaristaDailyExperience
          onOpenExam={() => setIsExamModalOpen(true)}
          examPassed={Boolean(examScore && examScore >= 75)}
          examScore={examScore}
        />
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
      />
    </div>
  );
}
