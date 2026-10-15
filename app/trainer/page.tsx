'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ShellNav from '@/components/ShellNav';

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="pb-5 border-b border-paper-300 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <span className="section-label block mb-1">Portal Trainer · Dasbor Pelatihan</span>
            <h1 className="font-serif font-black text-2xl text-roast-950">Kelompok Pelatihan & Asesmen</h1>
            <p className="text-sm text-roast-600 mt-1">
              Pengelolaan kelompok barista, verifikasi rubrik praktikal, dan pengesahan kompetensi industri.
            </p>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-md bg-paper-50 border border-paper-300 text-roast-700 font-semibold self-start sm:self-auto">
            Instruktur: {trainerName || 'Trainer Resmi Cherry Edu'}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-cherry-50 border border-cherry-200 text-cherry-900 rounded-lg px-4 py-3 text-xs">
            <span>{error}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <span className="section-label block mb-1.5">Cohort Ditugaskan</span>
            <div className="font-serif font-bold text-3xl text-roast-950 tabular-nums">{cohorts.length}</div>
            <p className="text-xs text-roast-500 mt-1">Kelompok aktif binaan Anda</p>
          </div>
          <div className="card p-5">
            <span className="section-label block mb-1.5">Total Barista Binaan</span>
            <div className="font-serif font-bold text-3xl text-roast-950 tabular-nums">{totalParticipants}</div>
            <p className="text-xs text-roast-500 mt-1">Peserta terdaftar aktif lintas outlet</p>
          </div>
          <div className="card p-5">
            <span className="section-label block mb-1.5">Standar Kelulusan</span>
            <div className="font-serif font-bold text-3xl text-roast-950 tabular-nums">Level 3</div>
            <p className="text-xs text-roast-500 mt-1">Ambang batas kompetensi industri Cherry Edu</p>
          </div>
        </div>

        {/* Cohort Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-roast-950">Daftar Kelompok Pelatihan</h2>
              <p className="text-xs text-roast-500">Pilih cohort untuk membuka roster peserta dan lembar asesmen</p>
            </div>
            <span className="text-xs font-mono text-roast-500">{cohorts.length} Cohort Ditugaskan</span>
          </div>

          {loading ? (
            <div className="card p-12 text-center text-roast-500 text-sm font-mono">
              Memuat daftar cohort...
            </div>
          ) : cohorts.length === 0 ? (
            <div className="card p-12 text-center text-roast-600 text-sm font-sans">
              Belum ada cohort yang ditugaskan kepada Anda saat ini.
            </div>
          ) : (
            <div className="data-table">
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
                      <td className="font-medium text-roast-800">
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
          )}
        </div>
      </main>
    </div>
  );
}
