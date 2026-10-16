'use client';

import React from 'react';
import { Award, CheckCircle2, Clock, Flame, Shield, Sparkles, ChevronRight } from 'lucide-react';

interface CompetencyItem {
  id: string;
  code: string;
  name: string;
  category: string;
  level: string;
  isVerified: boolean;
  score: number;
  description: string;
}

const COMPETENCIES: CompetencyItem[] = [
  {
    id: 'c1',
    code: 'ESPRESSO_DIALIN',
    name: 'Ekstraksi & Rasio Espresso',
    category: 'Kalibrasi Mesin',
    level: 'Level 3 · Standar Industri',
    isVerified: true,
    score: 92,
    description: 'Akurasi dosing 18g ±0.2g, tamping rata, ekstraksi 36g dalam 28 detik tanpa channeling.',
  },
  {
    id: 'c2',
    code: 'MICROFOAM_TEXTURE',
    name: 'Tekstur Microfoam & Suhu Susu',
    category: 'Sains Susu',
    level: 'Level 3 · Standar Industri',
    isVerified: true,
    score: 88,
    description: 'Stabilisasi temperatur susu 60-65°C, emulsi glossy mikro tanpa bubble kasar, pouring tulip simetris.',
  },
  {
    id: 'c3',
    code: 'SENSORY_EVALUATION',
    name: 'Sensorik & Kalibrasi Rasa',
    category: 'Sensori Kopi',
    level: 'Level 2 · Dalam Bimbingan',
    isVerified: false,
    score: 65,
    description: 'Identifikasi rasa manis alami kopi, deteksi over-extraction/pahit astringent, dan catatan cupping.',
  },
  {
    id: 'c4',
    code: 'BAR_HYGIENE',
    name: 'Sanitasi & Alur Kerja Bar',
    category: 'Operasional',
    level: 'Level 4 · Excellent',
    isVerified: true,
    score: 96,
    description: 'Purging steam wand konsisten, pembersihan portafilter antar cup, dan alur kerja higienis HACCP.',
  },
];

export default function CompetencyTrackerWidget() {
  const verifiedCount = COMPETENCIES.filter((c) => c.isVerified).length;
  const totalCount = COMPETENCIES.length;
  const percentage = Math.round((verifiedCount / totalCount) * 100);

  return (
    <div id="competency-tracker-section" className="bg-white rounded-2xl border border-paper-300 p-5 sm:p-7 shadow-card space-y-6">
      {/* Header with Circular Radial Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-paper-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-olive-600" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
              Authoritative Competency Radar
            </span>
          </div>
          <h2 className="font-serif font-black text-xl sm:text-2xl text-roast-950">
            Matriks Standar Barista Terkalibrasi
          </h2>
          <p className="text-xs text-roast-600 mt-1 max-w-lg leading-relaxed">
            Validasi riil dari observasi seduh di bar bersama instruktur resmi Cherry Edu. Tanpa inflasi nilai artifisial.
          </p>
        </div>

        {/* Circular Progress Meter */}
        <div className="flex items-center gap-4 bg-paper-50 p-4 rounded-xl border border-paper-200 shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* SVG Radial Meter */}
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-paper-300"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-cherry-700 transition-all duration-1000 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-sm font-bold font-serif text-roast-950 leading-none">{percentage}%</span>
              <span className="text-[8px] font-mono text-roast-500 uppercase mt-0.5">Lulus</span>
            </div>
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-roast-950 font-serif block">
              {verifiedCount} dari {totalCount} Terverifikasi
            </span>
            <span className="text-[10px] text-olive-800 font-mono font-medium block mt-0.5">
              Siap Uji Final Kompetensi
            </span>
            <div className="flex items-center gap-1 text-[10px] text-roast-500 font-mono mt-1">
              <Flame className="w-3.5 h-3.5 text-cherry-700" />
              <span>4 Hari Streak Kalibrasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Career Milestone Stepper */}
      <div className="bg-paper-50 rounded-xl p-4 border border-paper-200">
        <div className="flex items-center justify-between text-[11px] font-mono mb-2">
          <span className="text-roast-500 font-bold uppercase tracking-wider">Jalur Sertifikasi Tim:</span>
          <span className="text-cherry-800 font-bold">Fase 2: Calibrated Barista</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-white border border-paper-300 text-left">
            <span className="text-[9px] font-mono text-roast-700 font-bold uppercase block">Fase 1 (Selesai)</span>
            <span className="text-xs font-bold text-roast-950 block mt-0.5">Barista Junior</span>
            <span className="text-[10px] text-roast-500 block">SOP & Teori Kopi</span>
          </div>
          <div className="p-2.5 rounded-lg bg-cherry-50 border border-cherry-300 text-left shadow-2xs">
            <span className="text-[9px] font-mono text-cherry-700 font-bold uppercase block">Fase 2 (Aktif)</span>
            <span className="text-xs font-bold text-cherry-950 block mt-0.5">Barista Terkalibrasi</span>
            <span className="text-[10px] text-cherry-800/80 block">Ekstraksi & Susu</span>
          </div>
          <div className="p-2.5 rounded-lg bg-paper-100/60 border border-paper-200 text-left opacity-70">
            <span className="text-[9px] font-mono text-roast-400 font-bold uppercase block">Fase 3</span>
            <span className="text-xs font-bold text-roast-700 block mt-0.5">Head Bar &amp; Spv</span>
            <span className="text-[10px] text-roast-400 block">Quality &amp; Leadership</span>
          </div>
        </div>
      </div>

      {/* Grid of Detailed Competencies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {COMPETENCIES.map((c) => (
          <div
            key={c.id}
            className={`p-4 rounded-xl border transition-all ${
              c.isVerified
                ? 'bg-white border-paper-300 hover:border-paper-400 hover:shadow-2xs'
                : 'bg-paper-50/80 border-dashed border-paper-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-roast-500 font-semibold block">
                  {c.category}
                </span>
                <h3 className="font-serif font-bold text-sm text-roast-950 mt-0.5">{c.name}</h3>
              </div>
              {c.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-olive-900 bg-olive-100 border border-olive-300 px-2 py-0.5 rounded font-bold shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-olive-700" /> LULUS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-crema-800 bg-crema-100 border border-crema-300 px-2 py-0.5 rounded font-bold shrink-0">
                  <Clock className="w-3 h-3 text-crema-700" /> Bimbingan
                </span>
              )}
            </div>

            <p className="text-xs text-roast-600 leading-relaxed mb-3">{c.description}</p>

            <div className="flex items-center justify-between pt-2.5 border-t border-paper-200/80 text-[10px] font-mono text-roast-500">
              <span>{c.level}</span>
              <span className="font-bold text-roast-800">Skor: {c.score}/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
