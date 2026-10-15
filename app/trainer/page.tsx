'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-roast-950 text-roast-100">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-roast-950/95 backdrop-blur-md border-b border-roast-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-5">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded bg-cherry-700 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden>
                <circle cx="7" cy="13" r="4" fill="#F9E5E7" opacity="0.9"/>
                <circle cx="13" cy="13" r="4" fill="#F9E5E7" opacity="0.7"/>
                <path d="M10 9 C10 9 11 4 13 3 C13 3 10 4 9 7" stroke="#F9E5E7" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col border-l border-roast-800 pl-2.5">
              <span className="font-serif font-black text-base tracking-tight text-paper-100 leading-none">
                Cherry<span className="font-sans font-light text-cherry-400 text-sm ml-0.5">Edu</span>
              </span>
              <span className="text-[8px] font-mono tracking-widest text-roast-500 uppercase mt-0.5">Teams · Trainer</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-1 rounded border border-roast-800 text-roast-600 bg-roast-900">trainer</span>
            {trainerName && <span className="text-xs text-roast-400 hidden sm:block truncate max-w-[160px]">{trainerName}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page header */}
        <div className="pb-5 border-b border-roast-800 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <span className="section-label block mb-1">Portal Trainer · Dasbor</span>
            <h1 className="font-serif font-bold text-2xl text-paper-100">Pelatihan &amp; Asesmen</h1>
            <p className="text-sm text-roast-500 mt-1">Kelompok pelatihan, verifikasi rubrik, dan pengesahan kompetensi barista.</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-cherry-950 border border-cherry-900 text-cherry-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Cohort Ditugaskan', value: cohorts.length, sub: 'Grup aktif lintas klien' },
            { label: 'Total Barista Binaan', value: totalParticipants, sub: 'Peserta terdaftar aktif' },
            { label: 'Standar Penilaian', value: 'Level 3', sub: 'Ambang batas kompetensi industri' },
          ].map((k) => (
            <div key={k.label} className="bg-roast-900 border border-roast-800 rounded-xl p-5">
              <span className="section-label block mb-2">{k.label}</span>
              <span className="font-serif font-bold text-2xl text-paper-100 tabular-nums">{k.value}</span>
              <p className="text-xs text-roast-600 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Cohort roster */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-paper-200">Daftar Cohort</h2>
            <span className="section-label">{cohorts.length} cohort</span>
          </div>

          {loading ? (
            <p className="text-sm text-roast-500">Memuat cohort…</p>
          ) : cohorts.length === 0 ? (
            <div className="py-12 text-center bg-roast-900 border border-roast-800 rounded-xl text-roast-500 text-sm font-mono uppercase tracking-wider">
              Belum ada cohort yang ditugaskan
            </div>
          ) : (
            <div className="border border-roast-800 rounded-xl overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Organisasi', 'Cohort', 'Program', 'Peserta', 'Status', ''].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => (
                    <tr key={c.assignment_id}>
                      <td className="text-roast-300">{c.organization_name}</td>
                      <td className="text-paper-200 font-medium">{c.cohort_name}</td>
                      <td className="text-roast-400">{c.program_title} <span className="text-roast-600">v{c.program_version_no}</span></td>
                      <td className="text-roast-300 tabular-nums text-center">{c.participant_count}</td>
                      <td>
                        <span className={`status-${c.cohort_status === 'active' ? 'active' : 'inactive'}`}>{c.cohort_status}</span>
                      </td>
                      <td className="text-right">
                        <a
                          href={`/trainer/cohorts/${c.cohort_id}`}
                          className="text-[11px] font-mono uppercase tracking-wider text-roast-400 hover:text-paper-200 transition-colors"
                        >
                          Kelola →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

