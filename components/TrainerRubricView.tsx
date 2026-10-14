'use client';

import React, { useState } from 'react';
import { Card, Button, SyncBanner } from '../design-system/components';
import { RubricVersion } from '@/lib/types';

export interface TrainerRubricProps {
  baristaName: string;
  competencyTitle: string;
  rubric: RubricVersion;
  initialScores?: Record<string, 1 | 2 | 3 | 4>;
  isOnline: boolean;
  onSaveDraft: (scores: Record<string, 1 | 2 | 3 | 4>, notes: string, hasCriticalFail: boolean) => void;
  onFinalSignoff: (scores: Record<string, 1 | 2 | 3 | 4>, notes: string, hasCriticalFail: boolean) => void;
  onBack: () => void;
}

export const TrainerRubricView: React.FC<TrainerRubricProps> = ({
  baristaName,
  competencyTitle,
  rubric,
  initialScores = {},
  isOnline,
  onSaveDraft,
  onFinalSignoff,
  onBack,
}) => {
  const [scores, setScores] = useState<Record<string, 1 | 2 | 3 | 4>>(initialScores);
  const [criticalFails, setCriticalFails] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<string>('');
  const [currentCritIndex, setCurrentCritIndex] = useState<number>(0);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const criteria = rubric.criteria || [];
  const currentCriterion = criteria[currentCritIndex];

  const handleSelectLevel = (critId: string, level: 1 | 2 | 3 | 4) => {
    setScores((prev) => ({ ...prev, [critId]: level }));
  };

  const handleToggleCritical = (critId: string) => {
    setCriticalFails((prev) => ({ ...prev, [critId]: !prev[critId] }));
  };

  const allCompleted = criteria.every((c) => scores[c.id] !== undefined);
  const anyCriticalFail = Object.values(criticalFails).some((v) => v);

  const handleSave = () => {
    onSaveDraft(scores, notes, anyCriticalFail);
    setSaveSuccessMsg('Draf penilaian tersimpan di perangkat.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleSignoff = () => {
    if (!allCompleted) return;
    onFinalSignoff(scores, notes, anyCriticalFail);
  };

  if (!currentCriterion) {
    return <div className="p-4 text-center">Rubrik tidak ditemukan.</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-paper-50 min-h-screen text-roast-950 flex flex-col pb-20">
      {/* Top Offline/Sync Banner */}
      <SyncBanner isOnline={isOnline} />

      {/* Header */}
      <header className="px-5 pt-4 pb-3 bg-white border-b border-paper-200 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs text-roast-600 hover:text-roast-900 font-medium py-1"
        >
          ← Kembali
        </button>
        <span className="text-xs font-mono text-roast-500 font-bold">
          {baristaName}
        </span>
      </header>

      {/* Competency Title */}
      <div className="px-5 py-3 bg-white border-b border-paper-100">
        <span className="text-[10px] font-mono uppercase text-roast-500 font-semibold block">
          Penilaian Praktik Lapangan
        </span>
        <h2 className="font-serif font-bold text-base text-roast-950">
          {competencyTitle}
        </h2>
      </div>

      {/* Main Rubric Criterion Evaluation */}
      <main className="px-4 py-4 space-y-4 flex-1">
        {saveSuccessMsg && (
          <div className="bg-olive-50 border border-olive-200 text-olive-800 text-xs px-3 py-2 rounded-lg">
            {saveSuccessMsg}
          </div>
        )}

        <Card className="bg-white border-paper-300">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-roast-500 font-bold">
              Kriteria {currentCritIndex + 1} dari {criteria.length}
            </span>
            {currentCriterion.is_critical && (
              <span className="text-[10px] font-mono text-cherry-700 bg-cherry-50 px-2 py-0.5 rounded-md font-semibold">
                Kriteria Kritis
              </span>
            )}
          </div>

          <h3 className="font-sans font-semibold text-sm text-roast-950 mb-4">
            {currentCriterion.description}
          </h3>

          {/* Observable Anchors Radio Buttons */}
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((lvl) => {
              const level = lvl as 1 | 2 | 3 | 4;
              const isSelected = scores[currentCriterion.id] === level;
              const anchorText = currentCriterion.anchors[level];

              return (
                <div
                  key={level}
                  onClick={() => handleSelectLevel(currentCriterion.id, level)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors min-h-[44px] flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-roast-900 bg-paper-100 text-roast-950 font-medium'
                      : 'border-paper-200 bg-white text-roast-700 hover:bg-paper-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                      isSelected
                        ? 'border-roast-900 bg-roast-900'
                        : 'border-paper-400 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <div>
                    <span className="font-bold mr-1.5">Level {level}:</span>
                    <span>{anchorText}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical Failure Checkbox */}
          {currentCriterion.is_critical && (
            <div className="mt-4 pt-3 border-t border-paper-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-roast-900">
                <input
                  type="checkbox"
                  checked={Boolean(criticalFails[currentCriterion.id])}
                  onChange={() => handleToggleCritical(currentCriterion.id)}
                  className="rounded-sm border-paper-400 text-cherry-700 focus:ring-0"
                />
                <span className="font-medium text-cherry-800">
                  Teramati kesalahan kritis pada kriteria ini
                </span>
              </label>
            </div>
          )}
        </Card>

        {/* Observation Notes */}
        <Card className="bg-white">
          <label className="font-mono text-[11px] uppercase tracking-wider text-roast-500 font-bold block mb-1.5">
            Catatan Temuan & Umpan Balik
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tuliskan temuan spesifik, kendala, atau area perbaikan..."
            rows={3}
            className="w-full text-xs p-2.5 border border-paper-300 rounded-lg bg-paper-50 focus:outline-hidden focus:bg-white text-roast-900"
          />
        </Card>

        {/* Criterion Stepper Navigation */}
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentCritIndex === 0}
            onClick={() => setCurrentCritIndex((prev) => prev - 1)}
          >
            ← Sebelumnya
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentCritIndex === criteria.length - 1}
            onClick={() => setCurrentCritIndex((prev) => prev + 1)}
          >
            Berikutnya →
          </Button>
        </div>
      </main>

      {/* Bottom Sticky Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-paper-200 p-4 flex gap-3 shadow-elevated">
        <Button
          variant="outline"
          size="md"
          className="flex-1"
          onClick={handleSave}
        >
          Simpan Draf
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={!allCompleted}
          onClick={handleSignoff}
        >
          Tanda Tangani
        </Button>
      </footer>
    </div>
  );
};
