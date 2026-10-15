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
      <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
        <ShellNav role="trainer" />
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-roast-500 text-sm font-mono">Memuat ruang kerja asesmen praktikal...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
        <ShellNav role="trainer" />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-4">
          <Link href={`/trainer/cohorts/${cohortId}`} className="text-xs font-mono text-roast-600 hover:text-roast-950 transition-colors">
            ← Kembali ke Roster Peserta
          </Link>
          <div className="p-4 bg-cherry-50 border border-cherry-200 rounded-lg text-xs text-cherry-900">
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
        setSuccessMessage(resData.message || 'Evaluasi asesmen berhasil disimpan.');
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
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="trainer" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <Link
            href={`/trainer/cohorts/${cohortId}`}
            className="text-xs font-mono text-roast-600 hover:text-roast-950 transition-colors inline-block"
          >
            ← Kembali ke Roster ({data.enrollment.cohort_name})
          </Link>
          <div className="border-b border-paper-300 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="section-label mb-1">
                {data.enrollment.organization_name} · {data.enrollment.outlet_name || 'Outlet Utama'}
              </p>
              <h1 className="font-serif font-black text-2xl text-roast-950">
                Lembar Observasi Praktik: {data.enrollment.participant_name}
              </h1>
              <p className="text-xs text-roast-600 mt-1 font-mono">
                {data.competency.name} ({data.competency.code}) · Rubrik Resmi Versi {data.rubric.versionNo}
              </p>
            </div>
            <span className="status-pill self-start sm:self-auto font-bold">
              {data.enrollment.competency_state.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-4 bg-cherry-50 border border-cherry-200 rounded-lg text-xs text-cherry-900">{error}</div>
        )}
        {successMessage && (
          <div className="p-4 bg-paper-50 border border-paper-300 rounded-lg text-xs text-roast-900 font-medium">{successMessage}</div>
        )}

        {/* Monotonic Lock Notice */}
        {data.isMonotonicallyLocked && (
          <div className="card bg-paper-50 border-paper-300 space-y-1">
            <div className="text-sm font-semibold text-roast-950">Kelulusan Kompetensi Terverifikasi</div>
            <div className="text-xs text-roast-600 leading-relaxed">
              Barista telah memenuhi standar kompetensi industri dan status terkunci secara permanen. Lembar penilaian ini bersifat arsip resmi negara/industri (read-only).
            </div>
          </div>
        )}

        {/* Theory Gate Status */}
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <p className="section-label">Prasyarat Teori Online (Pedagogical Gate)</p>
            <span className="text-xs font-mono text-roast-700 font-semibold">
              {data.theoryStatus.completedCount} / {data.theoryStatus.totalRequired} Modul Selesai
            </span>
          </div>
          {data.theoryStatus.isCompleted ? (
            <p className="text-xs text-roast-600">
              Seluruh modul teori telah diselesaikan dengan tuntas. Barista memenuhi syarat untuk observasi praktik langsung di bar espresso.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-cherry-900 font-medium">Barista belum menyelesaikan seluruh modul teori yang dipersyaratkan.</p>
              <p className="text-xs text-roast-500 font-mono">
                Tertunda: {data.theoryStatus.missingSteps.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Rubric Criteria Evaluation Matrix */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-paper-300 pb-3">
            <div>
              <h2 className="font-serif font-bold text-lg text-roast-950">Kriteria Rubrik Penilaian</h2>
              <p className="text-xs text-roast-600 mt-0.5">Pilih level kecakapan (1–4) berdasarkan observasi stasiun espresso.</p>
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
                        <span className="text-sm font-semibold text-roast-950">{c.description}</span>
                        {c.isCritical && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cherry-50 border border-cherry-200 text-cherry-900 font-bold">
                            Kritis
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-roast-500 font-mono mt-0.5">
                        Kode: {c.code} · Bobot: {c.weight}x
                      </div>
                    </div>
                    <div className="text-xs font-mono text-roast-700 font-bold self-start whitespace-nowrap bg-paper-100 px-2 py-0.5 rounded border border-paper-200">
                      Level Terpilih: {currentScore}
                    </div>
                  </div>

                  {/* Level Selection Buttons */}
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
                              ? 'bg-roast-950 text-white border-roast-950 shadow-xs'
                              : 'bg-paper-50 border-paper-200 text-roast-700 hover:border-roast-400 hover:bg-paper-100'
                          } ${data.isMonotonicallyLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <div className="font-mono font-bold mb-1">
                            L{lvl} {lvl >= 3 ? '(Lulus)' : '(Remedial)'}
                          </div>
                          <div className={`text-[11px] leading-relaxed line-clamp-3 ${isSelected ? 'text-paper-200' : 'text-roast-500'}`}>
                            {anchorText}
                          </div>
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

        {/* Real-time Status Card */}
        <div className="card space-y-2">
          <p className="section-label">Kalkulasi Kelulusan Real-Time</p>
          {hasCriticalFailure || hasSubstandardScore ? (
            <div className="text-xs text-roast-800 space-y-1">
              <p className="font-semibold text-roast-950">Kriteria Substandar / Kritis Terdeteksi — Keputusan: Belum Kompeten.</p>
              <p className="text-roast-600">
                Seluruh kriteria wajib ≥ Level 3. Barista akan diarahkan ke sesi Latihan Terarah (Remedial).
              </p>
            </div>
          ) : (
            <div className="text-xs space-y-1">
              <p className="font-semibold text-roast-950">Seluruh Kriteria Memenuhi Standar Industri (Level 3+).</p>
              <p className="text-roast-600">Barista siap disahkan secara definitif sebagai KOMPETEN dalam kompetensi ini.</p>
            </div>
          )}
        </div>

        {/* Notes & Submission */}
        {!data.isMonotonicallyLocked && (
          <div className="card space-y-4">
            <div>
              <label className="label">Catatan Evaluator &amp; Umpan Balik Kualitatif</label>
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
                <label className="label">Instruksi Sesi Remedial / Latihan Terarah</label>
                <textarea
                  rows={2}
                  value={remediationInstructions}
                  onChange={(e) => setRemediationInstructions(e.target.value)}
                  placeholder="Contoh: Lakukan 5x kalibrasi espresso 18g:36g dalam rentang 26–28 detik sebelum uji ulang..."
                  className="input text-xs"
                />
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-roast-500 font-mono">Assessor: Trainer Resmi Cherry Edu · Keputusan Mengikat</p>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitEvaluation}
                className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50 w-full sm:w-auto"
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
            <h3 className="font-serif font-bold text-base text-roast-950">Riwayat Percobaan Asesmen</h3>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Percobaan</th>
                    <th>Keputusan</th>
                    <th>Catatan Trainer</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attempts.map((a) => (
                    <tr key={a.id}>
                      <td className="font-mono font-bold text-roast-950">#{a.attempt_no}</td>
                      <td>
                        <span className="status-pill font-mono">
                          {a.decision ? a.decision.replace(/_/g, ' ') : a.status}
                        </span>
                      </td>
                      <td className="text-roast-700">{a.reason || '—'}</td>
                      <td className="font-mono text-roast-500 text-[11px]">
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
