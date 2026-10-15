'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

interface HybridExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  baristaName?: string;
  onExamSubmitted?: (score: number) => void;
}

interface Question {
  id: string;
  source: 'edu_cherry_b2c' | 'trainer_custom';
  sourceLabel: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const EXAM_QUESTIONS: Question[] = [
  {
    id: 'q1',
    source: 'edu_cherry_b2c',
    sourceLabel: 'Materi Fundamental Hulu ke Hilir (Akademi Cherry Edu)',
    question: 'Pada proses pascapanen kopi, proses manakah yang mempertahankan lendir (mucilage) buah kopi saat penjemuran untuk menghasilkan body lebih tebal dan manis tinggi?',
    options: [
      'Fully Washed (Basah Penuh)',
      'Honey / Pulped Natural Process',
      'Wet Hulled (Giling Basah)',
      'Decaffeination Swiss Water',
    ],
    correctIndex: 1,
    explanation: 'Honey process mempertahankan lapisan mucilage saat penjemuran sehingga gula alami menyerap dan meningkatkan sweetness serta body.',
  },
  {
    id: 'q2',
    source: 'edu_cherry_b2c',
    sourceLabel: 'Materi Barista Path: Teori Ekstraksi (Akademi Cherry Edu)',
    question: 'Jika espresso terekstraksi terlalu cepat (18g yield 42g dalam 18 detik) dan rasanya sangat asam menyengat (sour/sharp), tindakan kalibrasi apa yang harus dilakukan?',
    options: [
      'Membuat gilingan lebih kasar (coarser)',
      'Membuat gilingan lebih halus (finer) untuk memperlambat laju air',
      'Mengurangi dosis kopi menjadi 15g',
      'Menaikkan suhu air boiler di atas 98°C',
    ],
    correctIndex: 1,
    explanation: 'Shot tersebut underextracted (terlalu cepat). Menghaluskan grind size (finer) meningkatkan resistensi bubuk terhadap air sehingga waktu ekstraksi masuk ke rentang ideal 25-30 detik.',
  },
  {
    id: 'q3',
    source: 'edu_cherry_b2c',
    sourceLabel: 'Materi Sains Susu & Microfoam (Akademi Cherry Edu)',
    question: 'Berapa rentang suhu ideal untuk steaming susu pada minuman cappuccino/latte agar protein dan laktosa tidak rusak (scalding)?',
    options: [
      '40°C – 48°C',
      '60°C – 65°C',
      '78°C – 85°C',
      'Di atas 90°C',
    ],
    correctIndex: 1,
    explanation: 'Rentang 60–65°C adalah sweet spot di mana laktosa terasa paling manis alami dan protein whey belum mengalami denaturasi berlebih.',
  },
  {
    id: 'q4',
    source: 'trainer_custom',
    sourceLabel: 'Studi Kasus Offline Trainer (SOP Kafe Ini)',
    question: 'Berdasarkan hasil R&D Trainer di kafe ini, resep standar house blend espresso yang telah disepakati adalah:',
    options: [
      'Dosis 15g, Yield 45g, Waktu 20 detik (1:3)',
      'Dosis 18.0g, Yield 36.0g, Waktu 26–28 detik (1:2.0)',
      'Dosis 22g, Yield 22g, Waktu 35 detik (1:1 Ristretto)',
      'Dosis bebas asal gelas espresso penuh',
    ],
    correctIndex: 1,
    explanation: 'SOP resep house blend kafe ini hasil R&D Cherry Edu adalah rasio 1:2.0 (18g bubuk : 36g liquid espresso) dalam 26-28 detik.',
  },
  {
    id: 'q5',
    source: 'trainer_custom',
    sourceLabel: 'Studi Kasus Offline Trainer (Ergonomi & Kebersihan Bar)',
    question: 'Kapan steam wand wajib di-purge dan dilap dengan kain microfiber lembap?',
    options: [
      'Hanya di akhir shift malam saat closing',
      'Sebelum stretching dan langsung sesudah selesai steaming susu',
      'Hanya jika susu terlihat berkerak tebal',
      'Cukup seminggu sekali dengan detergen',
    ],
    correctIndex: 1,
    explanation: 'Purging sebelum membuang kondensasi air, dan purging serta lap langsung sesudah steaming mencegah susu tersedot masuk ke dalam boiler pipa steam wand (vacuum effect).',
  },
];

export default function HybridExamModal({
  isOpen,
  onClose,
  baristaName = 'Budi Pratama',
  onExamSubmitted,
}: HybridExamModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [examResult, setExamResult] = useState<{
    score: number;
    b2cScore: number;
    trainerScore: number;
    passed: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const q = EXAM_QUESTIONS[currentIdx];
  const isAnswered = answers[q.id] !== undefined;
  const isLastQuestion = currentIdx === EXAM_QUESTIONS.length - 1;

  const handleSelectOption = (index: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: index }));
  };

  const handleNext = () => {
    if (currentIdx < EXAM_QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishExam();
    }
  };

  const finishExam = () => {
    let b2cCorrect = 0;
    let b2cTotal = 0;
    let trainerCorrect = 0;
    let trainerTotal = 0;

    EXAM_QUESTIONS.forEach((quest) => {
      const isCorrect = answers[quest.id] === quest.correctIndex;
      if (quest.source === 'edu_cherry_b2c') {
        b2cTotal++;
        if (isCorrect) b2cCorrect++;
      } else {
        trainerTotal++;
        if (isCorrect) trainerCorrect++;
      }
    });

    const b2cScore = Math.round((b2cCorrect / b2cTotal) * 100);
    const trainerScore = Math.round((trainerCorrect / trainerTotal) * 100);
    const totalScore = Math.round(((b2cCorrect + trainerCorrect) / EXAM_QUESTIONS.length) * 100);
    const passed = totalScore >= 75;

    setExamResult({
      score: totalScore,
      b2cScore,
      trainerScore,
      passed,
    });
    setIsCompleted(true);

    if (passed) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6B2737', '#93384D', '#140E0C', '#FAF7F2'],
      });
      toast.success(`Ujian Hybrid Berhasil Diselesaikan! Skor: ${totalScore}`);
    } else {
      toast.info(`Ujian Selesai. Skor: ${totalScore}. Perlu pengulangan materi.`);
    }

    if (onExamSubmitted) {
      onExamSubmitted(totalScore);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-roast-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="card max-w-xl w-full bg-white p-5 sm:p-6 rounded-2xl shadow-elevated border border-paper-300 max-h-[92vh] flex flex-col animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-paper-200 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                Modul 2.5 Mentorship
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-900 font-bold">
                Ujian Hybrid Teori &amp; Praktik
              </span>
            </div>
            <h3 className="font-serif font-black text-lg sm:text-xl text-roast-950 mt-1">
              Ujian Evaluasi Barista: {baristaName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-roast-400 hover:text-roast-900 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!isCompleted ? (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-roast-500">Soal {currentIdx + 1} dari {EXAM_QUESTIONS.length}</span>
                <span className="text-roast-800 font-bold">
                  {Math.round(((currentIdx + 1) / EXAM_QUESTIONS.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-paper-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-roast-950 h-full rounded-full transition-all"
                  style={{ width: `${((currentIdx + 1) / EXAM_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Source Tag */}
            <div className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cherry-700 shrink-0" />
              <span className="font-mono text-roast-700 font-semibold text-[11px] leading-tight">
                Sumber Soal: {q.sourceLabel}
              </span>
            </div>

            {/* Question Text */}
            <p className="font-serif font-bold text-base sm:text-lg text-roast-950 leading-relaxed">
              {q.question}
            </p>

            {/* Options List */}
            <div className="space-y-2 pt-2">
              {q.options.map((opt, oIdx) => {
                const isSelected = answers[q.id] === oIdx;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all text-xs sm:text-sm flex items-start gap-3 ${
                      isSelected
                        ? 'bg-roast-950 text-white border-roast-950 shadow-2xs font-medium'
                        : 'bg-white border-paper-300 text-roast-800 hover:border-roast-400 hover:bg-paper-50'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border text-xs flex items-center justify-center font-mono font-bold shrink-0 mt-0.5 ${
                      isSelected ? 'border-white text-white' : 'border-paper-400 text-roast-600'
                    }`}>
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Result View */
          <div className="flex-1 overflow-y-auto py-5 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-paper-100 border border-paper-300 mx-auto flex items-center justify-center text-roast-950">
              <CheckCircle2 className="w-8 h-8 text-roast-950" />
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                Hasil Evaluasi Ujian Hybrid
              </p>
              <h4 className="font-serif font-black text-3xl text-roast-950 mt-1">
                {examResult?.score} / 100
              </h4>
              <p className="text-xs text-roast-600 font-mono mt-1">
                {examResult?.passed ? '✓ Lulus Standar Kompetensi Industri Cherry Edu (≥ 75)' : 'Perlu Pengulangan Modul'}
              </p>
            </div>

            {/* Breakdown Score Cards */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-paper-50 rounded-xl border border-paper-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-roast-500 font-bold block">
                  Teori Online Cherry Edu
                </span>
                <span className="font-serif font-bold text-xl text-roast-950">
                  {examResult?.b2cScore}%
                </span>
                <p className="text-[10px] text-roast-500 font-mono">Fundamental &amp; Barista Path</p>
              </div>

              <div className="p-3 bg-paper-50 rounded-xl border border-paper-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-roast-500 font-bold block">
                  Materi Offline Trainer
                </span>
                <span className="font-serif font-bold text-xl text-roast-950">
                  {examResult?.trainerScore}%
                </span>
                <p className="text-[10px] text-roast-500 font-mono">SOP &amp; Kalibrasi Kafe Ini</p>
              </div>
            </div>

            <p className="text-xs text-roast-600 bg-paper-50 p-3 rounded-xl border border-paper-200 leading-relaxed font-sans text-left">
              Hasil ujian ini telah dicatat dan terintegrasi langsung ke <strong>Executive Report</strong> pemilik kafe sebagai bukti perkembangan kompetensi Anda.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="border-t border-paper-200 pt-3 flex items-center justify-between gap-3 shrink-0">
          {!isCompleted ? (
            <>
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                className="btn-ghost text-xs py-2 px-3 disabled:opacity-30 font-mono"
              >
                ← Sebelumnya
              </button>

              <button
                type="button"
                disabled={!isAnswered}
                onClick={handleNext}
                className="btn-primary text-xs py-2.5 px-5 disabled:opacity-40 flex items-center gap-1.5 shadow-2xs"
              >
                <span>{isLastQuestion ? 'Kumpulkan Ujian' : 'Soal Berikutnya'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full text-xs py-2.5"
            >
              Tutup &amp; Lihat Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
