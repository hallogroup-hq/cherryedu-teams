'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  Check,
  ExternalLink,
  SlidersHorizontal,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';

interface BaristaChecklistGamificationProps {
  onOpenDialIn: () => void;
  onOpenExam: () => void;
  examPassed?: boolean;
  examScore?: number | null;
}

export default function BaristaChecklistGamification({
  onOpenDialIn,
  onOpenExam,
  examPassed = true,
  examScore = 87.5,
}: BaristaChecklistGamificationProps) {
  const [step1Done, setStep1Done] = useState(true);
  const [step2Done, setStep2Done] = useState(true);
  const [step3Done, setStep3Done] = useState(true);
  const [step4Done, setStep4Done] = useState(true);
  const [step5Done, setStep5Done] = useState(true);
  const [step6Done, setStep6Done] = useState(examPassed);

  const completedCount = [step1Done, step2Done, step3Done, step4Done, step5Done, step6Done].filter(Boolean).length;
  const progressPct = Math.round((completedCount / 6) * 100);

  const toggleCheck = (currentVal: boolean, setter: (v: boolean) => void, title: string) => {
    const nextVal = !currentVal;
    setter(nextVal);
    if (nextVal) {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#140E0C', '#6B2737', '#FAF7F2'],
      });
      toast.success(`${title} ditandai selesai.`);
    } else {
      toast.info(`${title} diperbarui.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Editorial Progress Card */}
      <div className="bg-white border border-paper-300 rounded-xl p-5 sm:p-6 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-paper-200">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-roast-500 font-bold block mb-1">
              Program Mentorship 1 Bulan
            </span>
            <h2 className="font-serif font-black text-2xl text-roast-950">
              {completedCount === 6 ? 'Kompetensi Terstandar Penuh' : 'Calibrated Barista in Progress'}
            </h2>
            <p className="text-xs text-roast-600 font-sans mt-0.5">
              {completedCount} dari 6 modul selesai · Minggu ke-3 pendampingan bar
            </p>
          </div>

          <div className="flex items-baseline gap-1.5 self-start sm:self-auto font-mono">
            <span className="text-3xl font-serif font-black text-roast-950 tabular-nums">{progressPct}%</span>
            <span className="text-xs text-roast-500 uppercase tracking-wider font-semibold">Selesai</span>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-paper-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-roast-950 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-roast-500">
            <span>01 Fondasi Online</span>
            <span>03 Praktik Bar</span>
            <span>06 Ujian Akhir</span>
          </div>
        </div>
      </div>

      {/* The 6 Clear Milestones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-roast-500 font-bold">
            Daftar Modul Pelatihan
          </span>
          <span className="font-mono text-xs text-roast-500">{completedCount} dari 6 Terverifikasi</span>
        </div>

        {/* 01. Hulu ke Hilir */}
        <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleCheck(step1Done, setStep1Done, 'Kopi dari Hulu ke Hilir')}
                className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  step1Done
                    ? 'bg-roast-950 text-white'
                    : 'border border-paper-400 hover:border-roast-800 text-transparent'
                }`}
                aria-label="Tandai modul 1 selesai"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                    01 · Teori Online
                  </span>
                  {step1Done && (
                    <span className="font-mono text-[10px] text-roast-700 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                      Ujian Lulus (Skor 88)
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-base text-roast-950">
                  Kopi dari Hulu ke Hilir
                </h3>
                <p className="text-xs text-roast-600 font-sans leading-relaxed">
                  Pemahaman varietas kopi, proses pascapanen, sains roasting, dan kimia air seduh.
                </p>
              </div>
            </div>

            <a
              href="https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <span>Buka Materi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 02. Barista Path */}
        <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleCheck(step2Done, setStep2Done, 'Barista Specialization')}
                className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  step2Done
                    ? 'bg-roast-950 text-white'
                    : 'border border-paper-400 hover:border-roast-800 text-transparent'
                }`}
                aria-label="Tandai modul 2 selesai"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                    02 · Teori Online
                  </span>
                  {step2Done && (
                    <span className="font-mono text-[10px] text-roast-700 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                      Ujian Lulus (Skor 92)
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-base text-roast-950">
                  Barista Specialization
                </h3>
                <p className="text-xs text-roast-600 font-sans leading-relaxed">
                  Prinsip ekstraksi espresso, kalibrasi burr grinder, teknik frothing microfoam, dan SOP stasiun bar.
                </p>
              </div>
            </div>

            <a
              href="https://edu.cherrycoffeeroastery.com/paths/barista-specialization"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              <span>Buka Materi</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 03. Offline Teknik */}
        <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleCheck(step3Done, setStep3Done, 'Praktik Teknik Bar')}
                className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  step3Done
                    ? 'bg-roast-950 text-white'
                    : 'border border-paper-400 hover:border-roast-800 text-transparent'
                }`}
                aria-label="Tandai modul 3 selesai"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                    03 · Praktik Offline di Bar
                  </span>
                  <span className="font-mono text-[10px] text-roast-700 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                    Nilai Trainer: 88/100
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-roast-950">
                  Praktik Teknik Bar &amp; Ergonomi Tamping
                </h3>
                <p className="text-xs text-roast-600 font-sans leading-relaxed">
                  Sesi tatap muka di bar kafe bersama instruktur Dimas: tamping 90 derajat rata, distribusi jarum WDT, dan alur kerja stasiun.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 04. Offline Espresso Base */}
        <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleCheck(step4Done, setStep4Done, 'Praktik Espresso Base')}
                className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  step4Done
                    ? 'bg-roast-950 text-white'
                    : 'border border-paper-400 hover:border-roast-800 text-transparent'
                }`}
                aria-label="Tandai modul 4 selesai"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                    04 · Praktik Offline di Bar
                  </span>
                  <span className="font-mono text-[10px] text-roast-700 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                    Rasio 1:2.0 Terkalibrasi
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-roast-950">
                  Praktik Espresso Base &amp; Kalibrasi Rasa
                </h3>
                <p className="text-xs text-roast-600 font-sans leading-relaxed">
                  Resep SOP house blend kafe: 18.0g bubuk → 36.0g ekstraksi dalam 27 detik. Uji sensori asam, manis, dan body cangkir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenDialIn}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tool Dial-In</span>
            </button>
          </div>
        </div>

        {/* 05. Tiga Kelas Spesialisasi */}
        <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => toggleCheck(step5Done, setStep5Done, 'Kelas Spesialisasi')}
              className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                step5Done
                  ? 'bg-roast-950 text-white'
                  : 'border border-paper-400 hover:border-roast-800 text-transparent'
              }`}
              aria-label="Tandai modul 5 selesai"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                  05 · Kelas Pilihan
                </span>
                <span className="font-mono text-[10px] text-roast-700 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                  3 dari 3 Jalur Selesai
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-roast-950">
                Penyelesaian 3 Kelas Spesialisasi
              </h3>
              <p className="text-xs text-roast-600 font-sans leading-relaxed">
                Tautan langsung ke modul resmi yang telah diselesaikan:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <a
                  href="https://edu.cherrycoffeeroastery.com/paths/barista-specialization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 hover:border-roast-800 text-xs flex items-center justify-between group transition-colors"
                >
                  <span className="font-medium text-roast-900 group-hover:underline">1. Barista Path</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-roast-400 group-hover:text-roast-900" />
                </a>

                <a
                  href="https://edu.cherrycoffeeroastery.com/paths/home-brewer-specialization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 hover:border-roast-800 text-xs flex items-center justify-between group transition-colors"
                >
                  <span className="font-medium text-roast-900 group-hover:underline">2. Manual Brewing</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-roast-400 group-hover:text-roast-900" />
                </a>

                <a
                  href="https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 hover:border-roast-800 text-xs flex items-center justify-between group transition-colors"
                >
                  <span className="font-medium text-roast-900 group-hover:underline">3. Hulu ke Hilir</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-roast-400 group-hover:text-roast-900" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 06. Ujian Akhir */}
        <div className="bg-white border-2 border-roast-950 rounded-xl p-4 sm:p-5 shadow-subtle space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleCheck(step6Done, setStep6Done, 'Ujian Akhir')}
                className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                  step6Done
                    ? 'bg-roast-950 text-white'
                    : 'border border-paper-400 hover:border-roast-800 text-transparent'
                }`}
                aria-label="Tandai modul 6 selesai"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                    06 · Evaluasi Kelulusan
                  </span>
                  {examScore && (
                    <span className="font-mono text-[10px] font-bold text-roast-950 bg-paper-100 px-2 py-0.2 rounded border border-paper-300">
                      Skor {examScore}/100 (Lulus)
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-base text-roast-950">
                  Ujian Evaluasi Akhir (Hybrid)
                </h3>
                <p className="text-xs text-roast-600 font-sans leading-relaxed">
                  Soal kurikulum online digabungkan dengan studi kasus mesin dan SOP kafe Anda.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenExam}
              className="btn-primary text-xs py-2 px-4 shadow-2xs self-start sm:self-auto shrink-0"
            >
              {step6Done ? 'Uji Ulang' : 'Mulai Ujian'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
