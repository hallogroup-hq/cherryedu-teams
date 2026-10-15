'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import ShellNav from '@/components/ShellNav';

interface Participant {
  enrollmentId: string;
  userId: string;
  name: string;
  email: string;
  outletName: string;
  enrollmentStatus: string;
  competencyState: string;
  completedStepsCount: number;
  totalRequiredSteps: number;
  isTheoryCompleted: boolean;
  canAssess: boolean;
  assessmentAttemptsCount: number;
}

interface CohortDetail {
  id: string;
  organization_id: string;
  organization_name: string;
  name: string;
  status: string;
  start_at: string;
  end_at: string | null;
  program_title: string;
  program_version_no: number;
}

export default function TrainerCohortParticipantsPage({
  params,
}: {
  params: Promise<{ cohortId: string }>;
}) {
  const { cohortId } = use(params);
  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCohort() {
      try {
        const token = localStorage.getItem('teams_auth_token') || '';
        const res = await fetch(`/api/teams/trainer/cohorts/${cohortId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setCohort(data.cohort);
          setParticipants(data.participants || []);
        } else {
          setError(data.error || 'Gagal memuat detail peserta cohort.');
        }
      } catch (err: any) {
        setError(err.message || 'Koneksi jaringan bermasalah.');
      } finally {
        setLoading(false);
      }
    }
    loadCohort();
  }, [cohortId]);

  return (
    <div className="min-h-screen bg-roast-950 text-roast-100 flex flex-col">
      <ShellNav role="trainer" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <Link
            href="/trainer"
            className="text-xs font-mono text-roast-500 hover:text-paper-100 transition-colors inline-block"
          >
            ← Kembali ke Daftar Cohort
          </Link>
          <div className="border-b border-roast-800 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="section-label mb-1">{cohort?.organization_name || 'Organisasi Klien'}</p>
              <h1 className="font-serif font-bold text-2xl text-paper-100">
                {cohort?.name || 'Cohort Pelatihan'}
              </h1>
              <p className="text-xs text-roast-400 mt-1 font-mono">
                {cohort?.program_title} · Versi {cohort?.program_version_no}
              </p>
            </div>
            {cohort?.status && (
              <span className="status-pill self-start">
                {cohort.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-cherry-950 border border-cherry-900 rounded-lg text-sm text-cherry-300">
            {error}
          </div>
        )}

        {/* Participants Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-paper-100">Daftar Barista &amp; Status Asesmen</h2>
            <span className="text-xs font-mono text-roast-500">{participants.length} Peserta Terdaftar</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-roast-500 text-sm font-mono">Memuat roster barista...</div>
          ) : participants.length === 0 ? (
            <div className="card p-12 text-center text-roast-400 text-sm">
              Belum ada peserta yang terdaftar pada cohort ini.
            </div>
          ) : (
            <div className="data-table">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th>Nama Barista</th>
                    <th>Outlet</th>
                    <th>Progres Teori</th>
                    <th>Status Kompetensi</th>
                    <th className="text-center">Percobaan</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.enrollmentId}>
                      <td>
                        <div className="font-medium text-paper-100">{p.name}</div>
                        <div className="text-xs text-roast-500 font-mono">{p.email}</div>
                      </td>
                      <td className="text-roast-300">{p.outletName}</td>
                      <td>
                        <div className="text-xs font-mono text-roast-300">
                          {p.completedStepsCount} / {p.totalRequiredSteps} Modul
                        </div>
                        <div className="text-xs text-roast-500 mt-0.5">
                          {p.isTheoryCompleted ? 'Prasyarat Selesai' : 'Belum Lengkap'}
                        </div>
                      </td>
                      <td>
                        <span className="status-pill">
                          {p.competencyState.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-center font-mono text-roast-300 text-xs">
                        {p.assessmentAttemptsCount}x
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/trainer/cohorts/${cohortId}/assess/${p.enrollmentId}`}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Lembar Asesmen
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
