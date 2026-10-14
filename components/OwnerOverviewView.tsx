'use client';

import React, { useState } from 'react';
import { Card, Button, StatusTag } from '../design-system/components';
import { Outlet } from '@/lib/types';

export interface OwnerOverviewProps {
  coffeeShopName: string;
  outlets: Outlet[];
  teamSummary: {
    totalActive: number;
    competentCount: number;
    awaitingAssessmentCount: number;
    remedialCount: number;
  };
  teamMembers: Array<{
    id: string;
    name: string;
    outletName: string;
    role: string;
    statusState: string;
    statusLabel: string;
    needsAction: boolean;
  }>;
  onSelectMember: (memberId: string) => void;
}

export const OwnerOverviewView: React.FC<OwnerOverviewProps> = ({
  coffeeShopName,
  outlets,
  teamSummary,
  teamMembers,
  onSelectMember,
}) => {
  const [selectedOutletId, setSelectedOutletId] = useState<string>('all');

  const filteredMembers =
    selectedOutletId === 'all'
      ? teamMembers
      : teamMembers.filter((m) =>
          outlets.find((o) => o.id === selectedOutletId)?.name === m.outletName
        );

  return (
    <div className="w-full max-w-md mx-auto bg-paper-50 min-h-screen text-roast-950 flex flex-col pb-20">
      {/* Top Header */}
      <header className="px-5 pt-6 pb-4 bg-white border-b border-paper-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-roast-500 font-semibold">
            Cherry Edu Teams • Owner
          </span>
          <select
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
            className="text-xs bg-paper-100 border border-paper-300 rounded-md px-2.5 py-1 text-roast-800 focus:outline-hidden focus:ring-1 focus:ring-roast-400"
          >
            <option value="all">Semua Outlet</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <h1 className="font-serif font-bold text-2xl text-roast-950">
          {coffeeShopName}
        </h1>
        <p className="text-xs text-roast-600 mt-0.5">
          Kondisi Kesiapan & Kompetensi Tim Barista
        </p>
      </header>

      {/* Main Content */}
      <main className="px-4 py-5 space-y-4 flex-1">
        {/* Core Readiness Summary */}
        <Card className="bg-white border-paper-300">
          <span className="font-mono text-[11px] uppercase tracking-wider text-roast-500 font-bold block mb-1">
            Kesiapan Standar Kerja
          </span>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-serif font-bold text-3xl text-roast-950">
              {teamSummary.competentCount}
            </span>
            <span className="text-xs text-roast-600">
              dari {teamSummary.totalActive} barista memenuhi seluruh kompetensi wajib pada tahapnya
            </span>
          </div>

          <div className="w-full bg-paper-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-olive-700 h-full transition-all"
              style={{
                width: `${
                  teamSummary.totalActive > 0
                    ? Math.round(
                        (teamSummary.competentCount / teamSummary.totalActive) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </Card>

        {/* Actionable Priorities */}
        {(teamSummary.remedialCount > 0 || teamSummary.awaitingAssessmentCount > 0) && (
          <Card className="bg-paper-100 border-paper-300">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-roast-700 font-bold mb-2.5">
              Perlu Ditindaklanjuti
            </h3>
            <ul className="space-y-2 text-xs text-roast-800">
              {teamSummary.remedialCount > 0 && (
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-roast-500 mt-1 shrink-0" />
                  <span>
                    <strong>{teamSummary.remedialCount} peserta</strong> memerlukan remedial latihan ekstraksi sebelum evaluasi ulang.
                  </span>
                </li>
              )}
              {teamSummary.awaitingAssessmentCount > 0 && (
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-crema-600 mt-1 shrink-0" />
                  <span>
                    <strong>{teamSummary.awaitingAssessmentCount} peserta</strong> telah menyelesaikan teori dan menunggu observasi trainer.
                  </span>
                </li>
              )}
            </ul>
          </Card>
        )}

        {/* Team Members List */}
        <Card className="bg-white">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-roast-500 font-bold">
              Daftar Barista ({filteredMembers.length})
            </h3>
          </div>

          <div className="divide-y divide-paper-100">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-paper-50 transition-colors px-1"
              >
                <div>
                  <h4 className="text-sm font-semibold text-roast-900 leading-tight">
                    {member.name}
                  </h4>
                  <span className="text-[11px] text-roast-500 font-sans">
                    {member.outletName} • {member.role}
                  </span>
                </div>
                <div className="text-right">
                  <StatusTag
                    label={member.statusLabel}
                    variant={
                      member.statusState === 'competent'
                        ? 'success'
                        : member.statusState === 'needs_practice'
                        ? 'attention'
                        : 'pending'
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>

      {/* Owner Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-paper-200 py-2.5 px-6 flex justify-around items-center text-xs text-roast-600 shadow-xs">
        <button className="flex flex-col items-center text-cherry-700 font-semibold">
          <span>Ringkasan</span>
        </button>
        <button className="flex flex-col items-center hover:text-roast-900">
          <span>Tim</span>
        </button>
        <button className="flex flex-col items-center hover:text-roast-900">
          <span>Program</span>
        </button>
        <button className="flex flex-col items-center hover:text-roast-900">
          <span>Laporan</span>
        </button>
      </nav>
    </div>
  );
};
