'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';

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
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-2">
          <Link
            href="/trainer"
            className="text-xs text-slate-400 hover:text-white transition-colors inline-block"
          >
            &larr; Kembali ke Daftar Cohort Trainer
          </Link>
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-mono mb-1">
                {cohort?.organization_name || 'Organisasi Klien'}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                {cohort?.name || 'Cohort Pelatihan'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Program: {cohort?.program_title} (Versi {cohort?.program_version_no})
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 self-start">
              Status: {cohort?.status?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300">
            {error}
          </div>
        )}

        {/* Participants Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Daftar Barista &amp; Status Asesmen</h2>
            <span className="text-xs text-slate-400">{participants.length} Peserta Terdaftar</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Memuat roster barista...</div>
          ) : participants.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded text-slate-400 text-sm">
              Belum ada peserta yang terdaftar pada cohort ini.
            </div>
          ) : (
            <div className="border border-slate-800 rounded bg-slate-900 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-xs text-slate-400 font-mono uppercase">
                    <th className="py-3 px-4">Nama Barista</th>
                    <th className="py-3 px-4">Outlet</th>
                    <th className="py-3 px-4">Progres Teori Online</th>
                    <th className="py-3 px-4">Status Kompetensi</th>
                    <th className="py-3 px-4 text-center">Percobaan</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {participants.map((p) => {
                    return (
                      <tr key={p.enrollmentId} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-white">
                          <div>{p.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{p.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {p.outletName}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-mono text-slate-300">
                            {p.completedStepsCount} / {p.totalRequiredSteps} Modul
                          </div>
                          <div className="text-xs text-slate-500">
                            {p.isTheoryCompleted ? 'Selesai Prasyarat' : 'Belum Lengkap'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                            {p.competencyState.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                          {p.assessmentAttemptsCount}x
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/trainer/cohorts/${cohortId}/assess/${p.enrollmentId}`}
                            className="inline-block text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition-colors"
                          >
                            Buka Lembar Asesmen
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
