'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Coffee, Sliders, CheckCircle2, RotateCcw, Sparkles, Scale, Timer, Droplet } from 'lucide-react';

export default function DailyCalibrationWidget() {
  const [dose, setDose] = useState<number>(18.0);
  const [yieldWeight, setYieldWeight] = useState<number>(36.0);
  const [time, setTime] = useState<number>(28);
  const [notes, setNotes] = useState<string>('Senja House Blend — manis karamel, acidity jeruk mandarin bersih');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const ratio = (yieldWeight / dose).toFixed(1);

  // Status diagnosis
  let diagnosis = {
    title: 'Ekstraksi Ideal (Sweet Spot)',
    color: 'text-olive-900 bg-olive-50 border-olive-300',
    advice: 'Rasio dan laju alir seimbang. Acidity cerah berpadu dengan sweetness karamel panjang.',
    isBalanced: true,
  };

  if (time < 24) {
    diagnosis = {
      title: 'Under-Extracted (Aliran Terlalu Cepat)',
      color: 'text-amber-900 bg-amber-50 border-amber-300',
      advice: 'Waktu terlalu singkat. Haluskan ukuran gilingan (grind finer) atau cek apakah ada channeling.',
      isBalanced: false,
    };
  } else if (time > 32) {
    diagnosis = {
      title: 'Over-Extracted (Aliran Terlalu Lambat)',
      color: 'text-rose-900 bg-rose-50 border-rose-300',
      advice: 'Waktu terlalu panjang. Kasarkan ukuran gilingan (grind coarser) agar aftertaste tidak kering/pahit.',
      isBalanced: false,
    };
  }

  const handleSaveCalibration = () => {
    setIsSaved(true);

    // Pop festive celebratory confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#7E1D2A', '#E0C774', '#140E0C', '#4D6644'],
    });

    toast.success('Kalibrasi Seduh Berhasil Disimpan!', {
      description: `Rasio 1:${ratio} (${dose}g in / ${yieldWeight}g out / ${time}s) dicatat ke log outlet Senja Braga.`,
    });
  };

  return (
    <div id="daily-calibration-section" className="bg-white rounded-2xl border border-paper-300 p-5 sm:p-7 shadow-card space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-paper-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cherry-700 font-bold flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" /> Barista Dial-In Studio
            </span>
          </div>
          <h2 className="font-serif font-black text-xl sm:text-2xl text-roast-950">
            Kalibrasi Seduh Harian Outlet
          </h2>
          <p className="text-xs text-roast-600 mt-1">
            Uji resep espresso pagi sebelum outlet buka agar rasa konsisten di setiap cangkir pelanggan.
          </p>
        </div>

        {/* Live Ratio Pill */}
        <div className="flex items-center gap-2 bg-paper-100 px-3.5 py-2 rounded-xl border border-paper-300 self-start sm:self-auto shrink-0 font-mono">
          <span className="text-xs text-roast-500 uppercase">Brew Ratio:</span>
          <span className="text-sm font-bold text-cherry-800">1:{ratio}</span>
        </div>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Slider 1: Dose */}
        <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-roast-600 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-roast-500" /> Dosing (Kopi)
            </span>
            <span className="font-bold text-roast-950">{dose.toFixed(1)} g</span>
          </div>
          <input
            type="range"
            min="15.0"
            max="22.0"
            step="0.1"
            value={dose}
            onChange={(e) => {
              setDose(parseFloat(e.target.value));
              setIsSaved(false);
            }}
            className="w-full accent-cherry-700 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-roast-400">
            <span>15g</span>
            <span className="font-bold text-roast-600">Standard 18g</span>
            <span>22g</span>
          </div>
        </div>

        {/* Slider 2: Yield */}
        <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-roast-600 flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-roast-500" /> Yield (Liquid)
            </span>
            <span className="font-bold text-roast-950">{yieldWeight.toFixed(1)} g</span>
          </div>
          <input
            type="range"
            min="30.0"
            max="45.0"
            step="0.5"
            value={yieldWeight}
            onChange={(e) => {
              setYieldWeight(parseFloat(e.target.value));
              setIsSaved(false);
            }}
            className="w-full accent-cherry-700 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-roast-400">
            <span>30g (Ristretto)</span>
            <span className="font-bold text-roast-600">36g (Normale)</span>
            <span>45g (Lungo)</span>
          </div>
        </div>

        {/* Slider 3: Time */}
        <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-roast-600 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-roast-500" /> Waktu Alir
            </span>
            <span className="font-bold text-roast-950">{time} detik</span>
          </div>
          <input
            type="range"
            min="18"
            max="38"
            step="1"
            value={time}
            onChange={(e) => {
              setTime(parseInt(e.target.value, 10));
              setIsSaved(false);
            }}
            className="w-full accent-cherry-700 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-roast-400">
            <span>18s (Cepat)</span>
            <span className="font-bold text-roast-600">26-30s Ideal</span>
            <span>38s (Lambat)</span>
          </div>
        </div>
      </div>

      {/* Realtime Diagnosis Banner */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${diagnosis.color}`}>
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold font-serif text-sm block">{diagnosis.title}</span>
          <p className="mt-0.5 leading-relaxed">{diagnosis.advice}</p>
        </div>
      </div>

      {/* Sensory Tasting Notes & Submission */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan profil rasa (misal: manis karamel, body medium-high)..."
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-paper-300 bg-paper-50 text-xs text-roast-950 placeholder-roast-400 focus:outline-none focus:border-roast-800 focus:bg-white transition"
        />
        <button
          type="button"
          onClick={handleSaveCalibration}
          className="py-2.5 px-5 bg-roast-950 hover:bg-roast-850 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 shrink-0"
        >
          {isSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-olive-400" />
              <span>Tersimpan di Log Barista</span>
            </>
          ) : (
            <>
              <Coffee className="w-4 h-4 text-crema-300" />
              <span>Simpan Kalibrasi Hari Ini</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
