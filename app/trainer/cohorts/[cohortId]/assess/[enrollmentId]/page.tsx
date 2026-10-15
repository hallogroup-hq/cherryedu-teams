'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import ShellNav from '@/components/ShellNav';

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
      <div className="min-h-screen bg-roast-950 text-roast-100 flex flex-col">
        <ShellNav role="trainer" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-roast-500 text-sm font-mono">Memuat ruang kerja asesmen...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-roast-950 text-roast-100 flex flex-col">
        <ShellNav role="trainer" />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-4">
          <Link href={`/trainer/cohorts/${cohortId}`} className="text-xs font-mono text-roast-500 hover:text-paper-100 transition-colors">
            ← Kembali ke Roster Peserta
          </Link>
          <div className="p-4 bg-cherry-950 border border-cherry-900 rounded-lg text-sm text-cherry-300">
            {error || 'Data ruang kerja tidak ditemukan.'}
          </div>
        </main>
      </div>
    );
  }

  let hasCriticalFailure = false;
  let hasSubstandardScore = false;
  for (const c of data.rubric.criteria) {
    const s = scores[c.code];
    if (s) {
      if (c.isCritical && (s.level < 3 || s.critical_failure)) hasCriticalFailure = true;
      if (s.level < 3) hasSubstandardScore = true;
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
    setScores((prev) => ({ ...prev, [code]: { ...prev[code], notes } }));
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
        const refresh = await fetch(`/api/teams/trainer/cohorts/${cohortId}/assess/${enrollmentId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const refData = await refresh.json();
        if (refData.success) setData(refData.workspace);
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
    <div className="min-h-screen bg-roast-950 text-roast-100 flex flex-col">
      <ShellNav role="trainer" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <Link
            href={`/trainer/cohorts/${cohortId}`}
            className="text-xs font-mono text-roast-500 hover:text-paper-100 transition-colors inline-block"
          >
            ← Kembali ke Roster Cohort ({data.enrollment.cohort_name})
          </Link>
          <div className="border-b border-roast-800 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="section-label mb-1">
                {data.enrollment.organization_name} · {data.enrollment.outlet_name || 'Outlet Utama'}
              </p>
              <h1 className="font-serif font-bold text-2xl text-paper-100">
                Lembar Asesmen Praktik: {data.enrollment.participant_name}
              </h1>
              <p className="text-xs text-roast-400 mt-1 font-mono">
                {data.competency.name} ({data.competency.code}) · Rubrik v{data.rubric.versionNo}
              </p>
            </div>
            <span className="status-pill self-start">
              {data.enrollment.competency_state.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 bg-cherry-950 border border-cherry-900 rounded-lg text-sm text-cherry-300">{error}</div>
        )}
        {successMessage && (
          <div className="p-4 bg-roast-900 border border-roast-700 rounded-lg text-sm text-paper-200">{successMessage}</div>
        )}

        {/* Monotonic Lock Notice */}
        {data.isMonotonicallyLocked && (
          <div className="card border-roast-700 space-y-1">
            <div className="text-sm font-semibold text-paper-100">Kelulusan Kompetensi Terverifikasi</div>
            <div className="text-xs text-roast-400">
              Barista telah memenuhi standar kompetensi industri dan status terkunci secara permanen. Lembar penilaian ini bersifat arsip resmi (read-only).
            </div>
          </div>
        )}

        {/* Theory Gate Status */}
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <p className="section-label">Prasyarat Teori Online (Pedagogical Gate)</p>
            <span className="text-xs font-mono text-roast-300">
              {data.theoryStatus.completedCount} / {data.theoryStatus.totalRequired} Modul
            </span>
          </div>
          {data.theoryStatus.isCompleted ? (
            <p className="text-xs text-roast-400">
              Seluruh modul teori telah diselesaikan. Barista memenuhi syarat untuk asesmen praktik.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-roast-300">Barista belum menyelesaikan seluruh modul teori yang dipersyaratkan.</p>
              <p className="text-xs text-roast-500 font-mono">
                Tertunda: {data.theoryStatus.missingSteps.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Rubric Criteria */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-roast-800 pb-3">
            <div>
              <h2 className="font-serif font-bold text-lg text-paper-100">Kriteria Rubrik Penilaian</h2>
              <p className="text-xs text-roast-400 mt-0.5">Pilih level kecakapan (1–4) berdasarkan observasi langsung.</p>
            </div>
            <span className="text-xs font-mono text-roast-500">Skala 1:Novice → 4:Mastery</span>
          </div>

          <div className="space-y-5">
            {data.rubric.criteria.map((c) => {
              const currentScore = scores[c.code]?.level || 3;
              const currentNotes = scores[c.code]?.notes || '';

              return (
                <div key={c.code} className="card space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-paper-100">{c.description}</span>
                        {c.isCritical && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cherry-950 border border-cherry-900 text-cherry-400">
                            Kritis
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-roast-500 font-mono mt-0.5">
                        {c.code} · Bobot: {c.weight}x
                      </div>
                    </div>
                    <div className="text-xs font-mono text-roast-300 self-start whitespace-nowrap">
                      Level Terpilih: {currentScore}
                    </div>
                  </div>

                  {/* Level Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((lvl) => {
                      const isSelected = currentScore === lvl;
                      const anchorText = c.anchors?.[lvl] || `Level ${lvl}`;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          disabled={data.isMonotonicallyLocked}
                          onClick={() => handleScoreChange(c.code, lvl)}
                          className={`p-3 rounded-lg text-left border transition-all text-xs ${
                            isSelected
                              ? 'bg-cherry-950/40 border-cherry-700 text-paper-100'
                              : 'bg-roast-950/60 border-roast-800 text-roast-400 hover:border-roast-600'
                          } ${data.isMonotonicallyLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <div className="font-mono font-semibold mb-1">
                            L{lvl} {lvl >= 3 ? '(Lulus)' : '(Remedial)'}
                          </div>
                          <div className="text-[11px] leading-relaxed text-roast-400 line-clamp-3">{anchorText}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Criterion Notes */}
                  <input
                    type="text"
                    disabled={data.isMonotonicallyLocked}
                    placeholder={`Catatan observasi ${c.code} (wajib jika < Level 3)...`}
                    value={currentNotes}
                    onChange={(e) => handleNotesChange(c.code, e.target.value)}
                    className="input text-xs"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Eligibility Status */}
        <div className="card space-y-2">
          <p className="section-label">Kalkulasi Kelulusan Real-Time</p>
          {hasCriticalFailure || hasSubstandardScore ? (
            <div className="text-xs text-roast-300 space-y-1">
              <p className="font-semibold text-paper-200">Kriteria Substandar Terdeteksi — Keputusan: Belum Kompeten.</p>
              <p className="text-roast-400">
                Semua kriteria wajib ≥ Level 3. Barista akan diarahkan ke sesi Latihan Terarah (Remedial).
              </p>
            </div>
          ) : (
            <div className="text-xs space-y-1">
              <p className="font-semibold text-paper-100">Seluruh Kriteria Memenuhi Standar (Level 3+).</p>
              <p className="text-roast-400">Barista siap disahkan sebagai KOMPETEN dalam kompetensi ini.</p>
            </div>
          )}
        </div>

        {/* Notes & Submission */}
        {!data.isMonotonicallyLocked && (
          <div className="card space-y-4">
            <div>
              <label className="label mb-1.5">Catatan Evaluator &amp; Umpan Balik Kualitatif</label>
              <textarea
                rows={3}
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Tuliskan catatan teknis hasil observasi (ekstraksi, tamping, kebersihan stasiun)..."
                className="input text-xs"
              />
            </div>

            {(hasCriticalFailure || hasSubstandardScore) && (
              <div>
                <label className="label mb-1.5">Instruksi Sesi Remedial / Latihan Terarah</label>
                <textarea
                  rows={2}
                  value={remediationInstructions}
                  onChange={(e) => setRemediationInstructions(e.target.value)}
                  placeholder="Contoh: Lakukan 5x kalibrasi espresso 18g:36g dalam 26–28 detik sebelum pengujian ulang..."
                  className="input text-xs"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <p className="text-xs text-roast-500 font-mono">Assessor: Trainer Resmi Cherry Edu · Keputusan Mengikat</p>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitEvaluation}
                className="btn-primary text-xs py-2 px-5 disabled:opacity-50"
              >
                {submitting
                  ? 'Menyimpan Hasil...'
                  : isEligibleToSignoff
                  ? 'Sahkan Kelulusan (Kompeten)'
                  : 'Catat Hasil (Belum Kompeten)'}
              </button>
            </div>
          </div>
        )}

        {/* Assessment History */}
        {data.attempts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-base text-paper-100">Riwayat Percobaan Asesmen</h3>
            <div className="data-table">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>Percobaan</th>
                    <th>Keputusan</th>
                    <th>Catatan</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono font-semibold text-paper-100">#{a.attempt_no}</td>
                      <td>
                        <span className="status-pill">
                          {a.decision ? a.decision.replace(/_/g, ' ') : a.status}
                        </span>
                      </td>
                      <td className="text-roast-400">{a.reason || '—'}</td>
                      <td className="font-mono text-roast-500">
                        {new Date(a.started_at).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
