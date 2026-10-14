'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';

interface Criterion {
  id: string;
  code: string;
  description: string;
  weight: number;
  isCritical: boolean;
  anchors: Record<number, string>;
}

interface WorkspaceData {
  enrollment: {
    id: string;
    organization_id: string;
    organization_name: string;
    cohort_id: string;
    cohort_name: string;
    user_id: string;
    participant_name: string;
    participant_email: string;
    outlet_name: string | null;
    program_title: string;
    competency_state: string;
  };
  competency: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
  rubric: {
    rubricVersionId: string;
    versionNo: number;
    criteria: Criterion[];
  };
  theoryStatus: {
    isCompleted: boolean;
    totalRequired: number;
    completedCount: number;
    missingSteps: string[];
  };
  isMonotonicallyLocked: boolean;
  attempts: Array<{
    id: string;
    status: string;
    attempt_no: number;
    started_at: string;
    submitted_at: string | null;
    decision: string | null;
    signed_by: string | null;
    signed_at: string | null;
    reason: string | null;
  }>;
  remediationTasks: Array<{
    id: string;
    notes: string;
    status: string;
    created_at: string;
  }>;
}

export default function PracticalAssessmentWorkspacePage({
  params,
}: {
  params: Promise<{ cohortId: string; enrollmentId: string }>;
}) {
  const { cohortId, enrollmentId } = use(params);

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [scores, setScores] = useState<Record<string, { level: number; notes: string; critical_failure: boolean }>>({});
  const [overallNotes, setOverallNotes] = useState<string>('');
  const [remediationInstructions, setRemediationInstructions] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const token = localStorage.getItem('teams_auth_token') || '';
        const res = await fetch(`/api/teams/trainer/cohorts/${cohortId}/assess/${enrollmentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const resData = await res.json();
        if (resData.success) {
          setData(resData.workspace);
          // Initialize default scores
          const initial: Record<string, { level: number; notes: string; critical_failure: boolean }> = {};
          resData.workspace.rubric.criteria.forEach((c: Criterion) => {
            initial[c.code] = { level: 3, notes: '', critical_failure: false };
          });
          setScores(initial);
        } else {
          setError(resData.error || 'Gagal memuat ruang kerja asesmen.');
        }
      } catch (err: any) {
        setError(err.message || 'Koneksi jaringan bermasalah.');
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [cohortId, enrollmentId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto text-slate-500 text-sm">Memuat ruang kerja asesmen praktikal...</div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <Link href={`/trainer/cohorts/${cohortId}`} className="text-xs text-slate-400 hover:text-white">
            &larr; Kembali ke Roster Peserta
          </Link>
          <div className="p-4 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300">
            {error || 'Data ruang kerja tidak ditemukan.'}
          </div>
        </div>
      </main>
    );
  }

  // Real-time evaluation computation
  let hasCriticalFailure = false;
  let hasSubstandardScore = false;
  for (const c of data.rubric.criteria) {
    const s = scores[c.code];
    if (s) {
      if (c.isCritical && (s.level < 3 || s.critical_failure)) {
        hasCriticalFailure = true;
      }
      if (s.level < 3) {
        hasSubstandardScore = true;
      }
    }
  }

  const isEligibleToSignoff =
    data.theoryStatus.isCompleted &&
    !data.isMonotonicallyLocked &&
    !hasCriticalFailure &&
    !hasSubstandardScore;

  const handleScoreChange = (code: string, level: number) => {
    setScores((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        level,
        critical_failure: level < 3 && (data.rubric.criteria.find((c) => c.code === code)?.isCritical || false),
      },
    }));
  };

  const handleNotesChange = (code: string, notes: string) => {
    setScores((prev) => ({
      ...prev,
      [code]: { ...prev[code], notes },
    }));
  };

  const handleSubmitEvaluation = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('teams_auth_token') || '';
      const payload = {
        rubric_version_id: data.rubric.rubricVersionId,
        competency_id: data.competency.id,
        criterion_results: data.rubric.criteria.map((c) => ({
          criterion_id: c.code,
          level: scores[c.code]?.level || 1,
          critical_failure: Boolean(scores[c.code]?.critical_failure),
          notes: scores[c.code]?.notes || '',
        })),
        notes: overallNotes,
        remediation_instructions: remediationInstructions,
      };

      const res = await fetch(`/api/teams/trainer/cohorts/${cohortId}/assess/${enrollmentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setSuccessMessage(resData.message || 'Evaluasi berhasil disimpan.');
        // Refresh page data
        const refresh = await fetch(`/api/teams/trainer/cohorts/${cohortId}/assess/${enrollmentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const refData = await refresh.json();
        if (refData.success) {
          setData(refData.workspace);
        }
      } else {
        setError(resData.error || 'Gagal menyimpan hasil evaluasi asesmen.');
      }
    } catch (err: any) {
      setError(err.message || 'Koneksi jaringan gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="space-y-2">
          <Link
            href={`/trainer/cohorts/${cohortId}`}
            className="text-xs text-slate-400 hover:text-white transition-colors inline-block"
          >
            &larr; Kembali ke Roster Cohort ({data.enrollment.cohort_name})
          </Link>
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-mono mb-1">
                {data.enrollment.organization_name} &bull; {data.enrollment.outlet_name || 'Outlet Utama'}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Lembar Asesmen Praktik: {data.enrollment.participant_name}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Kompetensi: {data.competency.name} ({data.competency.code}) &bull; Rubrik v{data.rubric.versionNo}
              </p>
            </div>
            <div className="text-xs font-mono px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 self-start">
              Status: {data.enrollment.competency_state.toUpperCase().replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200">
            {successMessage}
          </div>
        )}

        {/* Monotonic Lock Notice */}
        {data.isMonotonicallyLocked && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-1">
            <div className="text-sm font-semibold text-white">Kelulusan Kompetensi Terverifikasi</div>
            <div className="text-xs text-slate-400">
              Barista telah memenuhi standar kompetensi industri dan status terkunci secara permanen. Lembar penilaian ini bersifat arsip resmi (read-only).
            </div>
          </div>
        )}

        {/* Theory Prerequisites Gate Status */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase text-slate-400">
              Prasyarat Teori Online (Pedagogical Gate)
            </div>
            <div className="text-xs font-mono text-slate-300">
              {data.theoryStatus.completedCount} / {data.theoryStatus.totalRequired} Modul Tuntas
            </div>
          </div>
          {data.theoryStatus.isCompleted ? (
            <p className="text-xs text-slate-400">
              Seluruh modul pembelajaran teori online telah diselesaikan. Barista memenuhi syarat untuk asesmen praktik langsung.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-slate-300">
                Barista belum menyelesaikan seluruh modul teori online yang dipersyaratkan.
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Modul tertunda: {data.theoryStatus.missingSteps.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Rubric Criteria Evaluation Matrix */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Kriteria Rubrik Penilaian</h2>
              <p className="text-xs text-slate-400">
                Pilih level kecakapan (1–4) berdasarkan observasi langsung di stasiun espresso.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Skala 1:Novice s/d 4:Mastery</span>
          </div>

          <div className="space-y-6">
            {data.rubric.criteria.map((c) => {
              const currentScore = scores[c.code]?.level || 3;
              const currentNotes = scores[c.code]?.notes || '';

              return (
                <div
                  key={c.code}
                  className="p-5 bg-slate-900 border border-slate-800 rounded space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{c.description}</span>
                        {c.isCritical && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            Wajib / Kritis
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">Kode: {c.code} &bull; Bobot: {c.weight}x</div>
                    </div>
                    <div className="text-xs font-mono text-slate-300 self-start">
                      Level Terpilih: {currentScore}
                    </div>
                  </div>

                  {/* Level Selection Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((lvl) => {
                      const isSelected = currentScore === lvl;
                      const anchorText = c.anchors?.[lvl] || `Deskripsi kecakapan level ${lvl}`;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          disabled={data.isMonotonicallyLocked}
                          onClick={() => handleScoreChange(c.code, lvl)}
                          className={`p-3 rounded text-left border transition-colors ${
                            isSelected
                              ? 'bg-slate-800 border-slate-600 text-white'
                              : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-700'
                          } ${data.isMonotonicallyLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                          <div className="text-xs font-mono font-semibold mb-1">
                            Level {lvl} {lvl >= 3 ? '(Lulus)' : '(Belum Lulus)'}
                          </div>
                          <div className="text-[11px] leading-relaxed text-slate-400 line-clamp-3">
                            {anchorText}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Criterion Note Input */}
                  <div>
                    <input
                      type="text"
                      disabled={data.isMonotonicallyLocked}
                      placeholder={`Catatan observasi untuk ${c.code} (opsional jika lulus, wajib jika < Level 3)...`}
                      value={currentNotes}
                      onChange={(e) => handleNotesChange(c.code, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 disabled:opacity-50"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Status Alert */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2">
          <div className="text-xs font-mono uppercase text-slate-400">
            Kalkulasi Kelulusan Real-Time
          </div>
          {hasCriticalFailure || hasSubstandardScore ? (
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">
                Kriteria Kritis / Substandar Terdeteksi. Keputusan: Belum Kompeten.
              </p>
              <p className="text-slate-400">
                Seluruh kriteria penilaian praktikal wajib mencapai minimal Level 3. Jika disahkan saat ini, barista akan diarahkan ke sesi remedial (Latihan Terarah).
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-white">
                Seluruh Kriteria Memenuhi Standar Industri (Level 3+).
              </p>
              <p className="text-slate-400">
                Barista siap disahkan secara definitif sebagai KOMPETEN dalam kompetensi ini.
              </p>
            </div>
          )}
        </div>

        {/* Notes & Remediation Instructions */}
        {!data.isMonotonicallyLocked && (
          <div className="space-y-4 p-5 bg-slate-900 border border-slate-800 rounded">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Catatan Evaluator &amp; Umpan Balik Kualitatif
              </label>
              <textarea
                rows={3}
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Tuliskan catatan teknis hasil observasi (misal: ekstraksi stabil, tamping konsisten, kebersihan stasiun kerja)..."
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600"
              />
            </div>

            {(hasCriticalFailure || hasSubstandardScore) && (
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Instruksi Sesi Remedial / Latihan Terarah
                </label>
                <textarea
                  rows={2}
                  value={remediationInstructions}
                  onChange={(e) => setRemediationInstructions(e.target.value)}
                  placeholder="Contoh: Barista wajib melakukan 5x kalibrasi espresso dengan rasio 18g:36g dalam rentang 26-28 detik sebelum pengujian ulang..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-mono">
                Assessor: Trainer Resmi Cherry Edu &bull; Keputusan Mengikat
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitEvaluation}
                className="text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 rounded transition-colors disabled:opacity-50"
              >
                {submitting
                  ? 'Menyimpan Hasil...'
                  : isEligibleToSignoff
                  ? 'Sahkan Kelulusan (Kompeten)'
                  : 'Catat Hasil Evaluasi (Belum Kompeten)'}
              </button>
            </div>
          </div>
        )}

        {/* Previous Assessment Attempts History */}
        {data.attempts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Riwayat Percobaan Asesmen</h3>
            <div className="border border-slate-800 rounded bg-slate-900 divide-y divide-slate-800">
              {data.attempts.map((a) => (
                <div key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-white">Percobaan #{a.attempt_no}</div>
                    <div className="text-slate-400 mt-0.5">{a.reason || 'Tidak ada catatan khusus.'}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {a.decision ? a.decision.replace(/_/g, ' ') : a.status}
                    </span>
                    <div className="text-slate-500 font-mono text-[10px] mt-1">
                      {new Date(a.started_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
