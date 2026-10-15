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
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="trainer" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <Link
            href="/trainer"
            className="text-xs font-mono text-roast-600 hover:text-roast-950 transition-colors inline-block"
          >
            ← Kembali ke Daftar Cohort Trainer
          </Link>
          <div className="border-b border-paper-300 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="section-label mb-1">{cohort?.organization_name || 'Organisasi Klien'}</p>
              <h1 className="font-serif font-black text-2xl text-roast-950">
                {cohort?.name || 'Cohort Pelatihan'}
              </h1>
              <p className="text-xs text-roast-600 mt-1 font-mono">
                Program: {cohort?.program_title} · Versi {cohort?.program_version_no}
              </p>
            </div>
            {cohort?.status && (
              <span className="status-pill self-start sm:self-auto font-bold">
                STATUS: {cohort.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-cherry-50 border border-cherry-200 rounded-lg text-xs text-cherry-900">
            {error}
          </div>
        )}

        {/* Participants Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-bold text-lg text-roast-950">Roster Barista &amp; Status Kelulusan</h2>
              <p className="text-xs text-roast-500">Periksa progres teori online dan buka lembar evaluasi praktik</p>
            </div>
            <span className="text-xs font-mono text-roast-500">{participants.length} Barista Terdaftar</span>
          </div>

          {loading ? (
            <div className="card p-12 text-center text-roast-500 text-sm font-mono">Memuat roster barista...</div>
          ) : participants.length === 0 ? (
            <div className="card p-12 text-center text-roast-500 text-sm font-sans">
              Belum ada peserta yang terdaftar pada cohort ini.
            </div>
          ) : (
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Nama Barista</th>
                    <th>Outlet</th>
                    <th>Progres Teori Online</th>
                    <th>Status Kompetensi</th>
                    <th className="text-center">Percobaan</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.enrollmentId}>
                      <td>
                        <div className="font-semibold text-roast-950">{p.name}</div>
                        <div className="text-xs text-roast-500 font-mono">{p.email}</div>
                      </td>
                      <td className="text-roast-700 font-medium">{p.outletName}</td>
                      <td>
                        <div className="text-xs font-mono text-roast-800 font-medium">
                          {p.completedStepsCount} / {p.totalRequiredSteps} Modul
                        </div>
                        <div className="text-[11px] text-roast-500 mt-0.5">
                          {p.isTheoryCompleted ? 'Prasyarat Terpenuhi' : 'Belum Lengkap'}
                        </div>
                      </td>
                      <td>
                        <span className="status-pill">
                          {p.competencyState.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-center font-mono text-roast-700 text-xs">
                        {p.assessmentAttemptsCount}x
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/trainer/cohorts/${cohortId}/assess/${p.enrollmentId}`}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          Buka Asesmen
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
