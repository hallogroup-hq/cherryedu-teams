'use client';

import React from 'react';
import { Button, Card, StatusTag } from '../design-system/components';
import { getCompetencyStatusPresentation } from '../design-system/tokens';

export interface BaristaHomeProps {
  baristaName: string;
  coffeeShopName: string;
  currentLesson: {
    id: string;
    title: string;
    estimatedMinutes: number;
    moduleTitle: string;
  };
  pendingActions: {
    quizzesCount: number;
    practicalStatusText: string;
  };
  competencies: Array<{
    id: string;
    name: string;
    code: string;
    state: string;
  }>;
  onContinueLearning: (lessonId: string) => void;
  onViewRoadmap: () => void;
}

export const BaristaHomeView: React.FC<BaristaHomeProps> = ({
  baristaName,
  coffeeShopName,
  currentLesson,
  pendingActions,
  competencies,
  onContinueLearning,
  onViewRoadmap,
}) => {
  return (
    <div className="w-full max-w-md mx-auto bg-paper-50 min-h-screen text-roast-950 flex flex-col pb-20">
      {/* Top Bar */}
      <header className="px-5 pt-6 pb-4 bg-white border-b border-paper-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-roast-500 font-semibold">
            Cherry Edu Teams
          </span>
          <span className="text-xs text-roast-600 font-medium">{coffeeShopName}</span>
        </div>
        <h1 className="font-serif font-bold text-2xl text-roast-950">
          Halo, {baristaName}
        </h1>
      </header>

      {/* Main Content */}
      <main className="px-4 py-5 space-y-4 flex-1">
        {/* Next Learning Action Card */}
        <Card className="border border-paper-300 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-roast-500 font-bold">
              Lanjutkan Belajar
            </span>
            <span className="text-xs text-roast-600 font-mono">
              {currentLesson.estimatedMinutes} menit
            </span>
          </div>

          <h2 className="font-serif font-bold text-lg text-roast-950 mb-1">
            {currentLesson.title}
          </h2>
          <p className="text-xs text-roast-600 mb-4">
            Modul: {currentLesson.moduleTitle}
          </p>

          <Button
            variant="primary"
            size="md"
            className="w-full font-semibold"
            onClick={() => onContinueLearning(currentLesson.id)}
          >
            Lanjutkan Belajar →
          </Button>
        </Card>

        {/* Pending Actions */}
        <Card className="bg-white">
          <h3 className="font-mono text-[11px] uppercase tracking-wider text-roast-500 font-bold mb-3">
            Hal yang Perlu Kamu Lakukan
          </h3>
          <ul className="space-y-2.5 text-xs text-roast-800">
            <li className="flex items-start gap-2.5 py-1 border-b border-paper-100 last:border-none">
              <span className="w-1.5 h-1.5 rounded-full bg-roast-400 mt-1.5 shrink-0" />
              <div>
                <span className="font-medium text-roast-900">
                  {pendingActions.quizzesCount} kuis checkpoint
                </span>{' '}
                perlu diselesaikan sebelum sesi observasi praktik.
              </div>
            </li>
            <li className="flex items-start gap-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-roast-400 mt-1.5 shrink-0" />
              <div>
                <span className="font-medium text-roast-900">Praktik Lapangan:</span>{' '}
                {pendingActions.practicalStatusText}
              </div>
            </li>
          </ul>
        </Card>

        {/* Competencies Progress Summary */}
        <Card className="bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-roast-500 font-bold">
              Penguasaan Kompetensi
            </h3>
            <button
              onClick={onViewRoadmap}
              className="text-xs text-cherry-700 hover:text-cherry-800 font-medium"
            >
              Lihat Roadmap
            </button>
          </div>

          <div className="space-y-3">
            {competencies.map((comp) => {
              const status = getCompetencyStatusPresentation(comp.state);
              return (
                <div
                  key={comp.id}
                  className="p-3 bg-paper-50 rounded-lg border border-paper-200 flex items-center justify-between"
                >
                  <div className="pr-2">
                    <span className="text-[10px] font-mono text-roast-500 block">
                      {comp.code}
                    </span>
                    <h4 className="text-xs font-semibold text-roast-900 leading-snug">
                      {comp.name}
                    </h4>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusTag label={status.label} variant={comp.state === 'competent' ? 'success' : comp.state === 'needs_practice' ? 'attention' : 'pending'} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>

      {/* Bottom Navigation (Fixed 3 items for Barista) */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-paper-200 py-2.5 px-6 flex justify-around items-center text-xs text-roast-600 shadow-xs">
        <button className="flex flex-col items-center text-cherry-700 font-semibold">
          <span>Beranda</span>
        </button>
        <button
          onClick={onViewRoadmap}
          className="flex flex-col items-center hover:text-roast-900"
        >
          <span>Belajar</span>
        </button>
        <button className="flex flex-col items-center hover:text-roast-900">
          <span>Progres</span>
        </button>
      </nav>
    </div>
  );
};
