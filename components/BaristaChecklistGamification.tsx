'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  SlidersHorizontal,
  Flame,
  Award,
  Sparkles,
  ChevronRight,
  BookOpen,
  Coffee,
  Check,
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
  // Checklist states
  const [step1Done, setStep1Done] = useState(true); // Hulu ke hilir
  const [step2Done, setStep2Done] = useState(true); // Barista path
  const [step3Done, setStep3Done] = useState(true); // Offline teknik (verified by trainer)
  const [step4Done, setStep4Done] = useState(true); // Offline espresso base (verified by trainer)
  const [step5Done, setStep5Done] = useState(true); // 3 Path classes
  const [step6Done, setStep6Done] = useState(examPassed); // Exam

  const completedCount = [step1Done, step2Done, step3Done, step4Done, step5Done, step6Done].filter(Boolean).length;
  const progressPct = Math.round((completedCount / 6) * 100);

  const toggleStep = (stepNo: number, currentVal: boolean, setter: (v: boolean) => void, label: string) => {
    const nextVal = !currentVal;
    setter(nextVal);
    if (nextVal) {
      confetti({
        particleCount: 60,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#6B2737', '#FAF7F2', '#140E0C', '#D4AF37'],
      });
      toast.success(`${label} ditandai selesai!`);
    } else {
      toast.info(`${label} dibatalkan.`);
    }
  };

  // Fun Barista Rank Title
  const getRank = () => {
    if (completedCount <= 2) return { title: 'Barista Trainee 🌱', sub: 'Mulai bangun fondasi kopi dari hulu ke hilir' };
    if (completedCount <= 4) return { title: 'Calibrated Barista ☕', sub: 'Rasa dan teknik ekstraksi bar mulai konsisten' };
    if (completedCount === 5) return { title: 'Senior Craftsman 🎯', sub: 'Tinggal 1 langkah lagi menuju ujian kelulusan!' };
    return { title: 'Barista Terstandar Cherry Edu 👑', sub: 'Kompeten penuh & terverifikasi siap pimpin stasiun bar' };
  };

  const rank = getRank();

  return (
    <div className="space-y-4">
      {/* GAMIFICATION COFFEE CUP & LEVEL CARD */}
      <div className="card p-5 sm:p-6 bg-white border-paper-300 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Cute Coffee Cup Graphic */}
            <div className="relative w-16 h-16 rounded-2xl bg-paper-100 border border-paper-300 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              {/* Cup fill liquid */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-roast-950 transition-all duration-500 rounded-b-xl"
                style={{ height: `${progressPct}%` }}
              />
              {/* Crema top layer */}
              {progressPct > 0 && (
                <div
                  className="absolute left-0 right-0 h-1.5 bg-amber-600 transition-all duration-500 opacity-90"
                  style={{ bottom: `calc(${progressPct}% - 4px)` }}
                />
              )}
              {/* Cup Icon Overlay */}
              <Coffee className={`w-7 h-7 relative z-10 transition-colors ${
                progressPct > 50 ? 'text-paper-100' : 'text-roast-700'
              }`} />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                  Status Mentorship 1 Bulan
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-900 font-bold">
                  {completedCount} dari 6 Selesai
                </span>
              </div>
              <h2 className="font-serif font-black text-xl text-roast-950">
                {rank.title}
              </h2>
              <p className="text-xs text-roast-600 font-sans">
                {rank.sub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <div className="p-2.5 rounded-xl bg-paper-50 border border-paper-200 text-center font-mono">
              <span className="text-[9px] uppercase text-roast-400 block font-bold">Persentase</span>
              <span className="font-serif font-black text-xl text-roast-950">{progressPct}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-crema-100 border border-crema-300 text-center font-mono">
              <span className="text-[9px] uppercase text-roast-600 block font-bold">Streak Seduh</span>
              <span className="font-serif font-black text-xl text-amber-800 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
                5 Hari
              </span>
            </div>
          </div>
        </div>

        {/* Liquid Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-paper-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-roast-950 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-roast-500">
            <span>Minggu 1: R&amp;D &amp; Teori</span>
            <span>Minggu 2-3: Praktik Bar</span>
            <span>Minggu 4: Ujian Akhir</span>
          </div>
        </div>
      </div>

      {/* THE 6 TACTILE CHECKLIST CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif font-bold text-base text-roast-950">
            Ceklis Modul Mentorship Kamu
          </h3>
          <span className="text-xs font-mono text-roast-500">Klik tombol untuk buka materi</span>
        </div>

        {/* STEP 1: HULU KE HILIR */}
        <div className={`card p-4 bg-white border transition-all ${
          step1Done ? 'border-paper-300 shadow-2xs' : 'border-paper-200 opacity-90'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleStep(1, step1Done, setStep1Done, '1. Kopi dari Hulu ke Hilir')}
                className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  step1Done
                    ? 'bg-roast-950 text-white shadow-2xs'
                    : 'border-2 border-paper-400 hover:border-roast-700 text-transparent'
                }`}
                title="Tandai selesai"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                    Modul 1 · Teori Online
                  </span>
                  {step1Done && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-crema-100 text-roast-900 border border-crema-300 font-bold">
                      Ujian Lulus (88) ✓
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-base text-roast-950">
                  Foundation: Kopi dari Hulu ke Hilir
                </h4>
                <p className="text-xs text-roast-600 font-sans">
                  Varietas lokal, metode processing pascapanen, kimia air, dan fondasi sensori cupping.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
              <a
                href="https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <span>Buka Materi</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* STEP 2: BARISTA PATH */}
        <div className={`card p-4 bg-white border transition-all ${
          step2Done ? 'border-paper-300 shadow-2xs' : 'border-paper-200 opacity-90'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleStep(2, step2Done, setStep2Done, '2. Barista Specialization Path')}
                className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  step2Done
                    ? 'bg-roast-950 text-white shadow-2xs'
                    : 'border-2 border-paper-400 hover:border-roast-700 text-transparent'
                }`}
                title="Tandai selesai"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                    Modul 2 · Teori Online
                  </span>
                  {step2Done && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-crema-100 text-roast-900 border border-crema-300 font-bold">
                      Ujian Lulus (92) ✓
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-base text-roast-950">
                  Barista Specialization Path
                </h4>
                <p className="text-xs text-roast-600 font-sans">
                  Sains ekstraksi espresso, kalibrasi burr grinder, teknik frothing microfoam, dan SOP bar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
              <a
                href="https://edu.cherrycoffeeroastery.com/paths/barista-specialization"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <span>Buka Materi</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* STEP 3: OFFLINE TEKNIK BAR */}
        <div className={`card p-4 bg-white border transition-all ${
          step3Done ? 'border-paper-300 shadow-2xs' : 'border-paper-200 opacity-90'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleStep(3, step3Done, setStep3Done, '3. Praktik Teknik Offline')}
                className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  step3Done
                    ? 'bg-roast-950 text-white shadow-2xs'
                    : 'border-2 border-paper-400 hover:border-roast-700 text-transparent'
                }`}
                title="Tandai verifikasi"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                    Modul 3 · Tatap Muka di Bar
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-paper-100 text-roast-900 border border-paper-300 font-bold">
                    Verifikasi Trainer ✓
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-roast-950">
                  Praktik Teknik Bar &amp; Ergonomi Tamping
                </h4>
                <p className="text-xs text-roast-600 font-sans">
                  Sesi tatap muka dengan Instruktur Cherry Edu. Melatih tamping rata, WDT distribution, dan sanitasi bar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
              <span className="text-xs font-mono font-bold text-roast-900 bg-paper-100 px-2.5 py-1 rounded border border-paper-200">
                Nilai Praktik: 88/100
              </span>
            </div>
          </div>
        </div>

        {/* STEP 4: OFFLINE ESPRESSO BASE */}
        <div className={`card p-4 bg-white border transition-all ${
          step4Done ? 'border-paper-300 shadow-2xs' : 'border-paper-200 opacity-90'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleStep(4, step4Done, setStep4Done, '4. Praktik Espresso Base')}
                className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                  step4Done
                    ? 'bg-roast-950 text-white shadow-2xs'
                    : 'border-2 border-paper-400 hover:border-roast-700 text-transparent'
                }`}
                title="Tandai verifikasi"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                    Modul 4 · Tatap Muka di Bar
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-paper-100 text-roast-900 border border-paper-300 font-bold">
                    Terkalibrasi 1:2.0 ✓
                  </span>
                </div>
                <h4 className="font-serif font-bold text-base text-roast-950">
                  Praktik Espresso Base &amp; Kalibrasi Rasa
                </h4>
                <p className="text-xs text-roast-600 font-sans">
                  Kalibrasi resep house blend kafe (18.0g → 36.0g @ 27s) dan identifikasi defect rasa cangkir.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
              <button
                type="button"
                onClick={onOpenDialIn}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Buka Studio Dial-In</span>
              </button>
            </div>
          </div>
        </div>

        {/* STEP 5: 3 PATH KELAS PILIHAN */}
        <div className={`card p-4 bg-white border transition-all ${
          step5Done ? 'border-paper-300 shadow-2xs' : 'border-paper-200 opacity-90'
        }`}>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleStep(5, step5Done, setStep5Done, '5. Kelas Pilihan 3 Path')}
                  className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                    step5Done
                      ? 'bg-roast-950 text-white shadow-2xs'
                      : 'border-2 border-paper-400 hover:border-roast-700 text-transparent'
                  }`}
                  title="Tandai selesai"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                      Modul 5 · Spesialisasi
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-crema-100 text-roast-900 border border-crema-300 font-bold">
                      3 / 3 Path Selesai
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-roast-950">
                    Pengambilan Minimal 3 Kelas Pilihan di Web Cherry Edu
                  </h4>
                  <p className="text-xs text-roast-600 font-sans">
                    Pelajari kelas spesialisasi untuk melengkapi keterampilan barista Anda:
                  </p>
                </div>
              </div>

              <a
                href="https://edu.cherrycoffeeroastery.com/paths"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs py-1 px-2.5 text-cherry-800 hover:text-cherry-950 self-start sm:self-auto font-mono flex items-center gap-1"
              >
                <span>Katalog Seluruh Kelas</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* 3 Real Path Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-9">
              <a
                href="https://edu.cherrycoffeeroastery.com/paths/barista-specialization"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 hover:border-roast-500 text-xs flex items-center justify-between group transition-all"
              >
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-roast-400 uppercase block">Path 1</span>
                  <span className="font-medium text-roast-900 group-hover:text-cherry-800">Barista Specialization</span>
                </div>
                <ExternalLink className="w-3 h-3 text-roast-400 group-hover:text-roast-800 shrink-0" />
              </a>

              <a
                href="https://edu.cherrycoffeeroastery.com/paths/home-brewer-specialization"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 hover:border-roast-500 text-xs flex items-center justify-between group transition-all"
              >
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-roast-400 uppercase block">Path 2</span>
                  <span className="font-medium text-roast-900 group-hover:text-cherry-800">Manual Brew &amp; Water</span>
                </div>
                <ExternalLink className="w-3 h-3 text-roast-400 group-hover:text-roast-800 shrink-0" />
              </a>

              <a
                href="https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 hover:border-roast-500 text-xs flex items-center justify-between group transition-all"
              >
                <div className="space-y-0.5">
                  <span className="text-[9px] font-mono text-roast-400 uppercase block">Path 3</span>
                  <span className="font-medium text-roast-900 group-hover:text-cherry-800">Hulu ke Hilir Foundation</span>
                </div>
                <ExternalLink className="w-3 h-3 text-roast-400 group-hover:text-roast-800 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* STEP 6: UJIAN AKHIR HYBRID */}
        <div className={`card p-4 bg-white border transition-all ${
          step6Done ? 'border-roast-900 shadow-2xs' : 'border-paper-300'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                step6Done ? 'bg-roast-950 text-white' : 'border-2 border-paper-400 text-transparent'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                    Modul 6 · Evaluasi Kelulusan
                  </span>
                  {examScore && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-crema-100 text-roast-900 border border-crema-300 font-bold">
                      Skor {examScore}/100 (Lulus) ✓
                    </span>
                  )}
                </div>
                <h4 className="font-serif font-bold text-base text-roast-950">
                  Ujian Akhir Komprehensif (Hybrid)
                </h4>
                <p className="text-xs text-roast-600 font-sans">
                  5 soal studi kasus (gabungan teori ekstraksi online dan SOP mesin kafe Anda).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pl-9 sm:pl-0">
              <button
                type="button"
                onClick={onOpenExam}
                className="btn-primary text-xs py-2 px-4 shadow-2xs"
              >
                {step6Done ? 'Uji Ulang Ujian' : 'Mulai Ujian Sekarang'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
