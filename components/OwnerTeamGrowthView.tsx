'use client';

import React, { useState } from 'react';
import {
  Users,
  Award,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Calendar,
  MessageSquare,
  Download,
  Filter,
  X,
  ArrowUpRight,
  ShieldCheck,
  Coffee,
} from 'lucide-react';
import {
  DEMO_MENTORSHIP_PROGRAM,
  BaristaMentorshipRecord,
  TrainerServiceLog,
} from '@/lib/mentorshipService';

interface OwnerTeamGrowthViewProps {
  onExportReport: () => void;
}

export default function OwnerTeamGrowthView({ onExportReport }: OwnerTeamGrowthViewProps) {
  const program = DEMO_MENTORSHIP_PROGRAM;

  const [activeTab, setActiveTab] = useState<'team' | 'insights' | 'rnd' | 'log'>('team');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'support'>('all');
  const [selectedBarista, setSelectedBarista] = useState<BaristaMentorshipRecord | null>(null);

  // Filter baristas
  const filteredBaristas = program.baristas.filter((b) => {
    if (filterStatus === 'ready') return b.overallStatus === 'ready_exam' || b.overallStatus === 'certified';
    if (filterStatus === 'support') return b.overallStatus === 'needs_practice';
    return true;
  });

  const readyCount = program.baristas.filter(
    (b) => b.overallStatus === 'ready_exam' || b.overallStatus === 'certified'
  ).length;

  const supportCount = program.baristas.filter(
    (b) => b.overallStatus === 'needs_practice'
  ).length;

  return (
    <div className="space-y-6">
      {/* 4-Tab Navigation */}
      <div className="bg-white rounded-xl border border-paper-300 p-1.5 shadow-subtle">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'team'
                ? 'bg-roast-950 text-white shadow-2xs'
                : 'text-roast-600 hover:text-roast-950'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Tim Barista</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'insights'
                ? 'bg-roast-950 text-white shadow-2xs'
                : 'text-roast-600 hover:text-roast-950'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tumbuh Kembang</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rnd')}
            className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'rnd'
                ? 'bg-roast-950 text-white shadow-2xs'
                : 'text-roast-600 hover:text-roast-950'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Standar Resep Bar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'log'
                ? 'bg-roast-950 text-white shadow-2xs'
                : 'text-roast-600 hover:text-roast-950'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Log Mentorship</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TIM BARISTA (PEOPLE-FIRST VIEW)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Quick Health Summary & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-paper-300 rounded-xl p-4 shadow-subtle space-y-1">
              <span className="font-mono text-[10px] text-roast-500 uppercase font-bold block">
                Total Barista Terbina
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-black text-2xl text-roast-950">
                  {program.baristas.length}
                </span>
                <span className="text-xs text-roast-600 font-sans">staf aktif</span>
              </div>
            </div>

            <div className="bg-white border border-paper-300 rounded-xl p-4 shadow-subtle space-y-1">
              <span className="font-mono text-[10px] text-roast-500 uppercase font-bold block">
                Siap Sertifikasi
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-black text-2xl text-roast-950">
                  {readyCount}
                </span>
                <span className="text-xs text-roast-600 font-sans">telah lulus teori &amp; praktik</span>
              </div>
            </div>

            <div className="bg-white border border-paper-300 rounded-xl p-4 shadow-subtle space-y-1">
              <span className="font-mono text-[10px] text-roast-500 uppercase font-bold block">
                Perlu Pendampingan
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif font-black text-2xl text-roast-950">
                  {supportCount}
                </span>
                <span className="text-xs text-roast-600 font-sans">perlu latihan terarah</span>
              </div>
            </div>
          </div>

          {/* Actionable Insights Callout */}
          <div className="bg-white border-2 border-roast-950 rounded-xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-roast-500 tracking-wider">
                Rekomendasi Tindakan Pemilik Kafe
              </span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-roast-900 font-sans">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-roast-500 shrink-0 mt-0.5">1.</span>
                <span>
                  <strong>Budi Pratama</strong> telah menyelesaikan seluruh kurikulum teori dan praktik offline dengan nilai 86/100. Disarankan untuk disahkan sertifikasinya pada kunjungan evaluasi akhir.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-roast-500 shrink-0 mt-0.5">2.</span>
                <span>
                  <strong>Reza Firmansyah</strong> masih memiliki deviasi dial-in espresso (aliran sering di bawah 22 detik). Trainer Dimas telah menjadwalkan 1 sesi remedial tamping &amp; grind size sebelum shift ramai.
                </span>
              </li>
            </ul>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`py-1.5 px-3 rounded-lg border font-semibold transition-all ${
                  filterStatus === 'all'
                    ? 'bg-roast-950 text-white border-roast-950'
                    : 'bg-white text-roast-600 border-paper-300 hover:border-roast-700'
                }`}
              >
                Semua ({program.baristas.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('ready')}
                className={`py-1.5 px-3 rounded-lg border font-semibold transition-all ${
                  filterStatus === 'ready'
                    ? 'bg-roast-950 text-white border-roast-950'
                    : 'bg-white text-roast-600 border-paper-300 hover:border-roast-700'
                }`}
              >
                Siap Ujian ({readyCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('support')}
                className={`py-1.5 px-3 rounded-lg border font-semibold transition-all ${
                  filterStatus === 'support'
                    ? 'bg-roast-950 text-white border-roast-950'
                    : 'bg-white text-roast-600 border-paper-300 hover:border-roast-700'
                }`}
              >
                Perlu Latihan ({supportCount})
              </button>
            </div>

            <button
              type="button"
              onClick={onExportReport}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-roast-700" />
              <span className="hidden sm:inline">Unduh Rekap CSV</span>
            </button>
          </div>

          {/* Barista Cards Grid */}
          <div className="grid grid-cols-1 gap-3">
            {filteredBaristas.map((barista) => {
              const delta = barista.currentScore - barista.initialScore;
              return (
                <div
                  key={barista.id}
                  onClick={() => setSelectedBarista(barista)}
                  className="bg-white border border-paper-300 hover:border-roast-900 rounded-xl p-4 sm:p-5 shadow-subtle cursor-pointer transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-200 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-paper-200 flex items-center justify-center font-serif font-black text-sm text-roast-900 shrink-0">
                        {barista.avatarText}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-base text-roast-950">
                          {barista.name}
                        </h3>
                        <span className="text-xs text-roast-600 font-sans">
                          {barista.role} · Bergabung dalam Mentorship
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-roast-500 uppercase block font-bold">
                          Skor Kemampuan
                        </span>
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="font-serif font-black text-xl text-roast-950">
                            {barista.currentScore}
                          </span>
                          <span className="font-mono text-xs text-roast-600 font-bold">
                            /100
                          </span>
                          <span className="font-mono text-[11px] font-bold text-roast-900 bg-paper-100 px-1.5 py-0.5 rounded border border-paper-300">
                            +{delta} pt
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-roast-400 shrink-0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded bg-paper-50 border border-paper-200">
                      <span className="text-[10px] text-roast-500 uppercase block font-bold">
                        Teori Online
                      </span>
                      <span className="font-medium text-roast-900">
                        {barista.fundamentalHuluHilir.finalExamPassed ? 'Lulus (78)' : 'Dalam Pengerjaan'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-paper-50 border border-paper-200">
                      <span className="text-[10px] text-roast-500 uppercase block font-bold">
                        Praktik Bar
                      </span>
                      <span className="font-medium text-roast-900">
                        {barista.offlineTeknik.score}/100 (Tervalidasi)
                      </span>
                    </div>

                    <div className="p-2.5 rounded bg-paper-50 border border-paper-200">
                      <span className="text-[10px] text-roast-500 uppercase block font-bold">
                        Ujian Hybrid
                      </span>
                      <span className="font-medium text-roast-900">
                        {barista.hybridExam.status === 'graded' ? `${barista.hybridExam.finalScore}/100` : 'Menunggu Sesi'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <MessageSquare className="w-3.5 h-3.5 text-roast-500 shrink-0" />
                    <p className="text-xs text-roast-600 font-sans truncate">
                      Catatan: {barista.trainerRecommendation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TUMBUH KEMBANG (GROWTH & PROGRESSION)                               */}
      {/* ========================================================================= */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white border border-paper-300 rounded-xl p-5 shadow-subtle space-y-4">
            <div className="border-b border-paper-200 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold block">
                Evolusi Kemampuan Barista
              </span>
              <h2 className="font-serif font-bold text-lg text-roast-950 mt-0.5">
                Perbandingan Sebelum vs Sesudah Mentorship Cherry Edu
              </h2>
              <p className="text-xs text-roast-600 font-sans mt-1">
                Data diambil dari audit bar hari pertama dibandingkan dengan sesi observasi mingguan terkini.
              </p>
            </div>

            <div className="space-y-4">
              {program.baristas.map((b) => {
                const growthPct = Math.round(((b.currentScore - b.initialScore) / b.initialScore) * 100);
                return (
                  <div key={b.id} className="p-4 bg-paper-50 rounded-lg border border-paper-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-roast-950">{b.name} ({b.role})</span>
                      <span className="text-roast-700 font-bold">
                        {b.initialScore} pt → {b.currentScore} pt (+{growthPct}%)
                      </span>
                    </div>

                    <div className="h-3 bg-paper-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-paper-400 h-full"
                        style={{ width: `${b.initialScore}%` }}
                        title="Skor Awal"
                      />
                      <div
                        className="bg-roast-950 h-full"
                        style={{ width: `${b.currentScore - b.initialScore}%` }}
                        title="Pertumbuhan"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-roast-500 pt-1">
                      <span>Audit Awal: {b.initialScore}/100</span>
                      <span>Target Kelulusan Industri: ≥75/100</span>
                      <span className="font-bold text-roast-900">Terkini: {b.currentScore}/100</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STANDAR RESEP BAR (R&D AUDIT DELIVERABLES)                         */}
      {/* ========================================================================= */}
      {activeTab === 'rnd' && (
        <div className="space-y-6">
          <div className="bg-white border border-paper-300 rounded-xl p-5 shadow-subtle space-y-4">
            <div className="border-b border-paper-200 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold block">
                Hasil Kalibrasi R&amp;D Cherry Edu
              </span>
              <h2 className="font-serif font-bold text-lg text-roast-950 mt-0.5">
                Resep Standar Kedai &amp; SOP Kalibrasi Mesin
              </h2>
              <p className="text-xs text-roast-600 font-sans mt-1">
                Resep resmi yang disepakati bersama trainer untuk menjamin rasa kopi stabil di seluruh shift.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">Dosis Kopi</span>
                <span className="font-serif font-bold text-xl text-roast-950">18.0 gram</span>
                <span className="text-[10px] text-roast-600 block mt-0.5">Toleransi ±0.2g</span>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">Hasil Cairan (Yield)</span>
                <span className="font-serif font-bold text-xl text-roast-950">36.0 gram</span>
                <span className="text-[10px] text-roast-600 block mt-0.5">Rasio Brew 1:2.0</span>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">Waktu Ekstraksi</span>
                <span className="font-serif font-bold text-xl text-roast-950">27 detik</span>
                <span className="text-[10px] text-roast-600 block mt-0.5">Rentang 26 - 28s</span>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">Kualitas Air &amp; Suhu</span>
                <span className="font-serif font-bold text-xl text-roast-950">93°C / 120 ppm</span>
                <span className="text-[10px] text-roast-600 block mt-0.5">Tekanan 9.0 Bar</span>
              </div>
            </div>

            <div className="p-4 bg-paper-50 rounded-lg border border-paper-200 space-y-2 text-xs font-sans text-roast-800">
              <span className="font-mono text-[10px] uppercase font-bold text-roast-600 block">
                Catatan R&amp;D Trainer:
              </span>
              <p>
                Biji kopi House Blend Cherry Edu (70% Arabika Gayo Anaerob / 30% Robusta Temanggung) membutuhkan waktu kontak minimal 26 detik untuk mengekstraksi sweetness karamel dan menyeimbangkan keasaman malat.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LOG MENTORSHIP (ACTIVITY TRANSPARENCY)                             */}
      {/* ========================================================================= */}
      {activeTab === 'log' && (
        <div className="space-y-4">
          <div className="bg-white border border-paper-300 rounded-xl p-5 shadow-subtle space-y-3">
            <div className="border-b border-paper-200 pb-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-roast-500 font-bold block">
                Transparansi Kegiatan Mentorship
              </span>
              <h2 className="font-serif font-bold text-lg text-roast-950 mt-0.5">
                Riwayat Sesi &amp; Kunjungan Trainer di Bar
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              {program.serviceLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-lg bg-paper-50 border border-paper-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-roast-950">{log.title}</span>
                      <span className="text-roast-500">· {log.trainerName}</span>
                    </div>
                    <span className="text-roast-500">{log.date}</span>
                  </div>
                  <p className="text-xs text-roast-800 font-sans leading-relaxed">
                    {log.summary}
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-roast-600">
                    <span className="font-bold text-roast-900">Temuan Utama: </span>
                    <span>{log.findings.join(' · ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BARISTA DETAIL DRAWER MODAL */}
      {selectedBarista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-roast-950/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-paper-300 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div>
                <span className="font-mono text-[10px] text-roast-500 uppercase font-bold block">
                  Profil Perkembangan Barista
                </span>
                <h3 className="font-serif font-black text-xl text-roast-950 mt-0.5">
                  {selectedBarista.name}
                </h3>
                <span className="text-xs text-roast-600 font-sans">
                  {selectedBarista.role} · {selectedBarista.email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBarista(null)}
                className="w-8 h-8 rounded-lg border border-paper-300 hover:border-roast-700 flex items-center justify-center text-roast-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">Skor Baseline</span>
                <span className="font-serif font-bold text-lg text-roast-950">{selectedBarista.initialScore} / 100</span>
              </div>
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-[10px] text-roast-500 block uppercase font-bold">Skor Hari Ini</span>
                <span className="font-serif font-bold text-lg text-roast-950">{selectedBarista.currentScore} / 100</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans text-roast-800">
              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-roast-600 block">
                  Catatan Sesi Praktik Offline:
                </span>
                <p>{selectedBarista.offlineTeknik.trainerNotes}</p>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 space-y-1">
                <span className="font-mono text-[10px] uppercase font-bold text-roast-600 block">
                  Rekomendasi Trainer Dimas:
                </span>
                <p className="font-semibold text-roast-950">{selectedBarista.trainerRecommendation}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBarista(null)}
              className="w-full btn-primary text-xs py-2.5 font-mono font-bold"
            >
              Tutup Ringkasan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
