'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ShellNav from '@/components/ShellNav';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  Layers,
  Users,
  Award,
  ChevronRight,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface CohortSummary {
  assignment_id: string;
  organization_id: string;
  cohort_id: string;
  organization_name: string;
  organization_slug: string;
  cohort_name: string;
  cohort_status: string;
  start_at: string;
  end_at: string | null;
  program_title: string;
  program_version_no: number;
  participant_count: string;
}

export default function TrainerDashboardPage() {
  const [cohorts, setCohorts] = useState<CohortSummary[]>([]);
  const [trainerName, setTrainerName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem('teams_auth_token') || '';
        const res = await fetch('/api/teams/trainer/cohorts', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setCohorts(data.cohorts || []);
          if (data.trainer?.name) {
            setTrainerName(data.trainer.name);
          }
        } else {
          setError(data.error || 'Gagal memuat data cohort trainer.');
        }
      } catch (err: any) {
        setError(err.message || 'Koneksi jaringan bermasalah.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalParticipants = cohorts.reduce(
    (acc, c) => acc + parseInt(c.participant_count || '0', 10),
    0
  );

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="trainer" userName={trainerName} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        {/* Page Header */}
        <div className="card p-5 sm:p-6 bg-white border-paper-300 shadow-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                Portal Trainer · Dasbor Asesmen
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-800 font-bold">
                Instruktur Resmi
              </span>
            </div>
            <h1 className="font-serif font-black text-2xl sm:text-3xl text-roast-950">
              Kelompok Pelatihan &amp; Asesmen
            </h1>
            <p className="text-xs sm:text-sm text-roast-600 mt-1 font-sans">
              Pengelolaan kelompok barista, verifikasi rubrik praktikal, dan pengesahan kompetensi industri.
            </p>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-paper-50 border border-paper-300 text-roast-700 font-semibold self-start sm:self-auto shrink-0">
            {trainerName || 'Dimas Trainer'}
          </div>
        </div>

        {error && (
          <div className="bg-cherry-50 border border-cherry-200 text-cherry-900 rounded-xl px-4 py-3 text-xs">
            {error}
          </div>
        )}

        {/* KPIs Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="card p-5 bg-white border-paper-300 shadow-2xs">
            <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold block mb-1">
              Cohort Ditugaskan
            </span>
            <div className="font-serif font-bold text-3xl text-roast-950 tabular-nums">{cohorts.length}</div>
            <p className="text-xs text-roast-500 font-mono mt-0.5">Kelompok aktif binaan Anda</p>
          </div>
          <div className="card p-5 bg-white border-paper-300 shadow-2xs">
            <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold block mb-1">
              Total Barista Binaan
            </span>
            <div className="font-serif font-bold text-3xl text-roast-950 tabular-nums">{totalParticipants}</div>
            <p className="text-xs text-roast-500 font-mono mt-0.5">Peserta aktif lintas outlet</p>
          </div>
          <div className="card p-5 bg-white border-paper-300 shadow-2xs">
            <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold block mb-1">
              Standar Kelulusan
            </span>
            <div className="font-serif font-bold text-3xl text-roast-950 tabular-nums">Level 3</div>
            <p className="text-xs text-roast-500 font-mono mt-0.5">Ambang batas kompetensi industri</p>
          </div>
        </div>

        {/* Cohort Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-roast-950">Daftar Kelompok Pelatihan</h2>
              <p className="text-xs text-roast-500">Pilih cohort untuk membuka roster peserta dan lembar asesmen</p>
            </div>
            <span className="text-xs font-mono text-roast-500">{cohorts.length} Cohort Ditugaskan</span>
          </div>

          {loading ? (
            <div className="card p-12 text-center text-roast-500 text-sm font-mono bg-white">
              Memuat daftar cohort...
            </div>
          ) : cohorts.length === 0 ? (
            <div className="card p-12 text-center text-roast-600 text-sm font-sans bg-white">
              Belum ada cohort yang ditugaskan kepada Anda saat ini.
            </div>
          ) : (
            <>
              {/* Mobile Card List (md:hidden) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {cohorts.map((cohort) => (
                  <div key={cohort.cohort_id} className="card p-4 bg-white border-paper-300 shadow-subtle space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                          {cohort.organization_name}
                        </span>
                        <h3 className="font-serif font-bold text-base text-roast-950 mt-0.5">
                          {cohort.cohort_name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-800 font-bold uppercase shrink-0">
                        {cohort.cohort_status}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-paper-50 border border-paper-200 text-xs space-y-1">
                      <p className="text-roast-700 font-medium font-sans">
                        {cohort.program_title} <span className="font-mono text-roast-500 text-[11px]">(v{cohort.program_version_no})</span>
                      </p>
                      <p className="text-roast-500 font-mono text-[11px]">
                        {cohort.participant_count} Barista Terdaftar
                      </p>
                    </div>

                    <Link
                      href={`/trainer/cohorts/${cohort.cohort_id}`}
                      className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Buka Roster &amp; Asesmen</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop Table (hidden md:block) */}
              <div className="hidden md:block data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Organisasi Klien</th>
                      <th>Nama Cohort</th>
                      <th>Program Pelatihan</th>
                      <th className="text-center">Peserta</th>
                      <th>Status</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((cohort) => (
                      <tr key={cohort.cohort_id}>
                        <td className="font-semibold text-roast-950">
                          {cohort.organization_name}
                        </td>
                        <td className="font-medium text-roast-800 font-serif">
                          {cohort.cohort_name}
                        </td>
                        <td className="text-roast-700">
                          {cohort.program_title} <span className="font-mono text-roast-500 text-[11px]">(v{cohort.program_version_no})</span>
                        </td>
                        <td className="text-center font-mono text-roast-800 tabular-nums">
                          {cohort.participant_count}
                        </td>
                        <td>
                          <span className="status-pill">{cohort.cohort_status}</span>
                        </td>
                        <td className="text-right">
                          <Link
                            href={`/trainer/cohorts/${cohort.cohort_id}`}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            Buka Roster &amp; Asesmen
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Sticky Mobile Bottom Navigation for Trainer */}
      <MobileBottomNav role="trainer" />
    </div>
  );
}
