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
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-mono mb-1">
              Cherry Edu Teams — Portal Trainer
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dasbor Pelatihan & Asesmen
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pengelolaan kelompok pelatihan, verifikasi rubrik, dan pengesahan kompetensi barista.
            </p>
          </div>
          <div className="text-sm font-medium text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded self-start">
            Trainer Resmi: {trainerName || 'Instruktur Terdaftar'}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300">
            {error}
          </div>
        )}

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded">
            <div className="text-xs text-slate-400 font-medium">Cohort Ditugaskan</div>
            <div className="text-3xl font-bold text-white mt-2 font-mono">{cohorts.length}</div>
            <div className="text-xs text-slate-500 mt-1">Grup aktif lintas klien</div>
          </div>
          <div className="p-5 bg-slate-900 border border-slate-800 rounded">
            <div className="text-xs text-slate-400 font-medium">Total Barista Binaan</div>
            <div className="text-3xl font-bold text-white mt-2 font-mono">{totalParticipants}</div>
            <div className="text-xs text-slate-500 mt-1">Peserta terdaftar aktif</div>
          </div>
          <div className="p-5 bg-slate-900 border border-slate-800 rounded">
            <div className="text-xs text-slate-400 font-medium">Standar Penilaian</div>
            <div className="text-3xl font-bold text-white mt-2 font-mono">Level 3</div>
            <div className="text-xs text-slate-500 mt-1">Ambang batas kompetensi industri</div>
          </div>
        </div>

        {/* Cohort Roster Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Daftar Kelompok Pelatihan</h2>
            <span className="text-xs text-slate-500">{cohorts.length} Cohort Tersedia</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Memuat daftar cohort...</div>
          ) : cohorts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded text-slate-400 text-sm">
              Belum ada cohort yang ditugaskan kepada Anda saat ini.
            </div>
          ) : (
            <div className="border border-slate-800 rounded bg-slate-900 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400 font-mono uppercase">
                    <th className="py-3 px-4">Organisasi Klien</th>
                    <th className="py-3 px-4">Nama Cohort</th>
                    <th className="py-3 px-4">Program Pelatihan</th>
                    <th className="py-3 px-4 text-center">Peserta</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cohorts.map((cohort) => (
                    <tr key={cohort.cohort_id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {cohort.organization_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-200">
                        {cohort.cohort_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {cohort.program_title} (v{cohort.program_version_no})
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {cohort.participant_count}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {cohort.cohort_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/trainer/cohorts/${cohort.cohort_id}`}
                          className="inline-block text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
                        >
                          Buka Roster &amp; Asesmen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
