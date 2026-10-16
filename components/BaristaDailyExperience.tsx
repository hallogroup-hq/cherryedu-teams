'use client';

import React, { useState } from 'react';
import {
  Coffee,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BookOpen,
  HelpCircle,
  RotateCcw,
  FlaskConical,
  MessageSquare,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  DEMO_MENTORSHIP_PROGRAM,
  DEMO_SCENARIOS,
  DEMO_EXPERIMENTS,
  ScenarioChallenge,
  CoffeeExperiment,
} from '@/lib/mentorshipService';
import DailyCalibrationWidget from './DailyCalibrationWidget';

interface BaristaDailyExperienceProps {
  onOpenExam: () => void;
  examPassed: boolean;
  examScore: number | null;
}

export default function BaristaDailyExperience({
  onOpenExam,
  examPassed,
  examScore,
}: BaristaDailyExperienceProps) {
  const program = DEMO_MENTORSHIP_PROGRAM;
  const barista = program.baristas[0]; // Budi Pratama

  const [activeTab, setActiveTab] = useState<'today' | 'journey' | 'dialin'>('today');

  // Scenario Challenge State
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);

  const scenario = DEMO_SCENARIOS[currentScenarioIdx];

  const handleSelectOption = (optionId: string) => {
    if (hasSubmittedAnswer) return;
    setSelectedOptionId(optionId);
    setHasSubmittedAnswer(true);
  };

  const handleNextScenario = () => {
    setSelectedOptionId(null);
    setHasSubmittedAnswer(false);
    setCurrentScenarioIdx((prev) => (prev + 1) % DEMO_SCENARIOS.length);
  };

  // Experiment State
  const [activeExperimentIdx, setActiveExperimentIdx] = useState(0);
  const [experimentRecorded, setExperimentRecorded] = useState(false);
  const experiment = DEMO_EXPERIMENTS[activeExperimentIdx];

  // Journey Milestone Checklist States
  const [completedSteps, setCompletedSteps] = useState<{ [key: string]: boolean }>({
    'step-01': true,
    'step-02': true,
    'step-03': false,
    'step-04': false,
    'step-05': examPassed,
  });

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const totalMilestones = 5;
  const progressPercent = Math.round((completedCount / totalMilestones) * 100);

  return (
    <div className="space-y-6">
      {/* 3-Tab Tactile Navigation */}
      <div className="bg-white rounded-xl border border-paper-300 p-1.5 shadow-subtle">
        <div className="grid grid-cols-3 gap-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`py-2.5 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'today'
                ? 'bg-roast-950 text-white shadow-2xs'
                : 'text-roast-600 hover:text-roast-950'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Hari Ini</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journey')}
            className={`py-2.5 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'journey'
                ? 'bg-roast-950 text-white shadow-2xs'
                : 'text-roast-600 hover:text-roast-950'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Jalur Kecakapan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dialin')}
            className={`py-2.5 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'dialin'
                ? 'bg-roast-950 text-white shadow-2xs'
                : 'text-roast-600 hover:text-roast-950'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Kalibrasi Bar</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HARI INI (TODAY'S FOCUSED LEARNING & SIMULATION)                  */}
      {/* ========================================================================= */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Daily Shift Focus */}
          <div className="bg-white border border-paper-300 rounded-xl p-5 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-200 pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold block">
                  Fokus Pembelajaran Shift Hari Ini
                </span>
                <h2 className="font-serif font-bold text-lg text-roast-950 mt-0.5">
                  Konsistensi Ekstraksi &amp; Pencegahan Channeling
                </h2>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-paper-100 text-roast-800 border border-paper-300 font-semibold">
                  Resep Standar: 18.0g : 36.0g @ 27s
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-roast-700 font-sans leading-relaxed">
              Target shift: Lakukan WDT melingkar dari dasar basket sebelum tamping untuk memastikan waktu alir antar-shot berada di deviasi maksimal ±1 detik.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-paper-200 flex items-center justify-center text-roast-900 shrink-0 mt-0.5">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-roast-500 uppercase font-bold block">Aksi Praktik</span>
                  <span className="text-xs font-bold text-roast-950 block">Uji Kalibrasi Pagi</span>
                  <p className="text-[11px] text-roast-600 mt-0.5">Catat 2 shot berturut-turut di tab Kalibrasi Bar.</p>
                </div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-paper-200 flex items-center justify-center text-roast-900 shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-roast-500 uppercase font-bold block">Simulasi Kasus</span>
                  <span className="text-xs font-bold text-roast-950 block">Selesaikan 1 Skenario</span>
                  <p className="text-[11px] text-roast-600 mt-0.5">Uji nalar barista pada kasus ekstraksi di bawah.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Scenario Challenge */}
          <div className="bg-white border-2 border-roast-950 rounded-xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                    Tantangan Nalar Barista · Kasus #{currentScenarioIdx + 1}
                  </span>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-paper-100 text-roast-800 border border-paper-300 font-bold uppercase">
                    {scenario.categoryLabel}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base text-roast-950">
                  {scenario.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleNextScenario}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
              >
                <span>Kasus Lain</span>
                <RotateCcw className="w-3 h-3 text-roast-600" />
              </button>
            </div>

            {/* Scenario Narrative */}
            <div className="p-4 bg-paper-50 rounded-lg border border-paper-200 space-y-2">
              <p className="text-xs sm:text-sm text-roast-900 font-sans leading-relaxed">
                {scenario.scenario}
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-roast-600">
                <span className="font-bold text-roast-900">Gejala Utama:</span>
                <span>{scenario.symptom}</span>
              </div>
            </div>

            {/* Decision Options */}
            <div className="space-y-2 pt-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold block">
                Pilih Keputusan Tindakan Kamu:
              </span>

              {scenario.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                let optionStyle = 'border-paper-300 bg-white hover:border-roast-800 text-roast-900';

                if (hasSubmittedAnswer) {
                  if (opt.isCorrect) {
                    optionStyle = 'border-roast-950 bg-paper-100 font-semibold text-roast-950';
                  } else if (isSelected && !opt.isCorrect) {
                    optionStyle = 'border-paper-400 bg-paper-50 text-roast-600 line-through opacity-80';
                  } else {
                    optionStyle = 'border-paper-200 bg-white opacity-60 text-roast-500';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={hasSubmittedAnswer}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-3.5 rounded-lg border text-xs sm:text-sm transition-all flex items-start gap-3 ${optionStyle}`}
                  >
                    <span className="font-mono text-xs font-bold text-roast-500 shrink-0 mt-0.5">
                      {opt.id.toUpperCase().replace('OPT-', '')}.
                    </span>
                    <span className="flex-1 leading-relaxed">{opt.text}</span>
                    {hasSubmittedAnswer && opt.isCorrect && (
                      <Check className="w-4 h-4 text-roast-950 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Explanation Box */}
            {hasSubmittedAnswer && (
              <div className="p-4 rounded-lg bg-paper-100 border border-paper-300 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-roast-950 uppercase tracking-wider">
                    {selectedOptionId && scenario.options.find((o) => o.id === selectedOptionId)?.isCorrect
                      ? 'Keputusan Tepat'
                      : 'Evaluasi Nalar'}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextScenario}
                    className="text-xs font-mono font-bold text-roast-900 underline hover:text-roast-700"
                  >
                    Lanjut ke Kasus Berikutnya →
                  </button>
                </div>
                <p className="text-xs text-roast-800 font-sans leading-relaxed">
                  {selectedOptionId && scenario.options.find((o) => o.id === selectedOptionId)?.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Practical Coffee Experiment Card */}
          <div className="bg-white border border-paper-300 rounded-xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold block">
                  Eksperimen Rasa di Bar
                </span>
                <h3 className="font-serif font-bold text-base text-roast-950">
                  {experiment.title}
                </h3>
              </div>
              <span className="font-mono text-[10px] text-roast-500 bg-paper-100 px-2 py-1 rounded border border-paper-200">
                Hands-on Bar
              </span>
            </div>

            <p className="text-xs sm:text-sm text-roast-700 font-sans leading-relaxed">
              {experiment.objective}
            </p>

            {/* Steps list */}
            <div className="space-y-1.5 p-3.5 bg-paper-50 rounded-lg border border-paper-200 text-xs text-roast-800 font-sans">
              <span className="font-mono text-[10px] uppercase font-bold text-roast-500 block mb-1">
                Langkah Eksekusi di Bar:
              </span>
              {experiment.steps.map((st, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-mono text-roast-500 shrink-0">{idx + 1}.</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>

            {/* Comparison Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-white border border-paper-300">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">{experiment.parameterA.label}</span>
                <span className="text-roast-900 font-medium text-[11px]">{experiment.parameterA.value}</span>
              </div>
              <div className="p-2.5 rounded bg-white border border-paper-300">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">{experiment.parameterB.label}</span>
                <span className="text-roast-900 font-medium text-[11px]">{experiment.parameterB.value}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-roast-600 font-sans">
                {experimentRecorded ? 'Hasil observasi telah disimpan ke log tim.' : 'Lakukan perbandingan langsung di mesin kedai Anda.'}
              </span>
              <button
                type="button"
                onClick={() => setExperimentRecorded(!experimentRecorded)}
                className={`text-xs py-2 px-3.5 rounded-lg font-mono font-bold transition-all ${
                  experimentRecorded
                    ? 'bg-paper-200 text-roast-900 border border-paper-300'
                    : 'btn-primary'
                }`}
              >
                {experimentRecorded ? 'Tercatat Selesai' : 'Tandai Selesai Diuji'}
              </button>
            </div>
          </div>

          {/* Trainer Feedback Banner */}
          <div className="p-4 bg-paper-50 rounded-xl border border-paper-300 space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-roast-700" />
              <span className="font-mono text-[10px] uppercase font-bold text-roast-600 tracking-wider">
                Catatan Terkini dari Trainer Dimas
              </span>
            </div>
            <p className="text-xs sm:text-sm text-roast-900 font-sans italic leading-relaxed">
              &ldquo;{barista.offlineTeknik.trainerNotes} Tetap pertahankan konsistensi tamping 90 derajat.&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: JALUR KECAKAPAN (SKILL MILESTONE JOURNEY MAP)                      */}
      {/* ========================================================================= */}
      {activeTab === 'journey' && (
        <div className="space-y-6">
          {/* Journey Header Card */}
          <div className="bg-white border border-paper-300 rounded-xl p-5 shadow-subtle space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold block">
                  Jalur Sertifikasi Barista Profesional · 1 Bulan
                </span>
                <h2 className="font-serif font-black text-xl text-roast-950 mt-0.5">
                  Peta Tahapan Menuju Kompetensi Penuh
                </h2>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-roast-600 font-bold">
                  {completedCount} dari {totalMilestones} Tahap Diselesaikan ({progressPercent}%)
                </span>
                <div className="w-full sm:w-40 h-2 bg-paper-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-roast-950 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-roast-600 font-sans leading-relaxed">
              Setiap tahapan menggabungkan teori online dari kurikulum Cherry Edu dan observasi praktik langsung di bar bersama trainer resmi.
            </p>
          </div>

          {/* Milestones Flow */}
          <div className="space-y-3">
            {/* Milestone 01 */}
            <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStep('step-01')}
                    className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      completedSteps['step-01']
                        ? 'bg-roast-950 text-white'
                        : 'border border-paper-400 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                        Tahap 01 · Teori Online
                      </span>
                      <span className="font-mono text-[10px] font-bold text-roast-800 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                        Skor Ujian: 78/100
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-roast-950">
                      Fundamental: Kopi dari Hulu ke Hilir
                    </h3>
                    <p className="text-xs text-roast-600 font-sans leading-relaxed">
                      Memahami proses pasca panen (washed, natural, honey), anatomi buah kopi, dan dasar-dasar profil sangrai.
                    </p>
                  </div>
                </div>

                <a
                  href="https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Akses Modul Web</span>
                  <ExternalLink className="w-3 h-3 text-roast-500" />
                </a>
              </div>
            </div>

            {/* Milestone 02 */}
            <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStep('step-02')}
                    className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      completedSteps['step-02']
                        ? 'bg-roast-950 text-white'
                        : 'border border-paper-400 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                        Tahap 02 · Praktik Offline
                      </span>
                      <span className="font-mono text-[10px] font-bold text-roast-800 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                        Skor Trainer: 86/100
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-roast-950">
                      Ergonomi Bar &amp; Konsistensi Tamping
                    </h3>
                    <p className="text-xs text-roast-600 font-sans leading-relaxed">
                      Sesi tatap muka: postur tubuh, alur kerja stasiun mesin, distribusi WDT, dan kalibrasi tamping rata 90 derajat.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('dialin')}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Uji Bar</span>
                </button>
              </div>
            </div>

            {/* Milestone 03 */}
            <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStep('step-03')}
                    className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      completedSteps['step-03']
                        ? 'bg-roast-950 text-white'
                        : 'border border-paper-400 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                        Tahap 03 · Praktik Offline
                      </span>
                      <span className="font-mono text-[10px] text-roast-500 bg-paper-100 px-2 py-0.2 rounded border border-paper-200">
                        Target Sesi Mendatang
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-roast-950">
                      Espresso Base &amp; Texturing Susu
                    </h3>
                    <p className="text-xs text-roast-600 font-sans leading-relaxed">
                      Sensori dial-in (identifikasi under vs balanced vs over-extraction) dan teknik microfoam mengkilap pada 60–65°C.
                    </p>
                  </div>
                </div>

                <a
                  href="https://edu.cherrycoffeeroastery.com/paths/barista-specialization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kurikulum Terkait</span>
                  <ExternalLink className="w-3 h-3 text-roast-500" />
                </a>
              </div>
            </div>

            {/* Milestone 04 */}
            <div className="bg-white border border-paper-300 rounded-xl p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStep('step-04')}
                    className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      completedSteps['step-04']
                        ? 'bg-roast-950 text-white'
                        : 'border border-paper-400 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                        Tahap 04 · Standar Operasional Kedai
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-base text-roast-950">
                      Perawatan Mesin, Grinder, &amp; Sanitasi Bar
                    </h3>
                    <p className="text-xs text-roast-600 font-sans leading-relaxed">
                      Prosedur backflush chemical harian, pembersihan burr grinder, pengurasan steam wand, dan kontrol kualitas air.
                    </p>
                  </div>
                </div>

                <a
                  href="https://edu.cherrycoffeeroastery.com/paths/home-brewer-specialization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pelajari Materi</span>
                  <ExternalLink className="w-3 h-3 text-roast-500" />
                </a>
              </div>
            </div>

            {/* Milestone 05 */}
            <div className="bg-white border-2 border-roast-950 rounded-xl p-4 sm:p-5 shadow-subtle space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleStep('step-05')}
                    className={`w-6 h-6 rounded-md flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                      completedSteps['step-05']
                        ? 'bg-roast-950 text-white'
                        : 'border border-paper-400 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold">
                        Tahap 05 · Evaluasi Kelulusan
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
                      Ujian studi kasus menggabungkan teori ekstraksi online dengan SOP mesin dan standar rasa kafe Anda.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenExam}
                  className="btn-primary text-xs py-2 px-4 shadow-2xs shrink-0"
                >
                  {examPassed ? 'Uji Ulang' : 'Mulai Ujian'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KALIBRASI BAR (DAILY DIAL-IN STUDIO)                              */}
      {/* ========================================================================= */}
      {activeTab === 'dialin' && (
        <div className="space-y-4">
          <DailyCalibrationWidget />
        </div>
      )}
    </div>
  );
}
