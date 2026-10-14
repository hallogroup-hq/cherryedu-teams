/**
 * Cherry Edu Teams — Competency & Pedagogical Gate Engine
 * Spec: 02_PRD.md Section 8, 9 & 11; 03_ERD_Technical_Architecture.md Section 3.4
 */

import {
  CompetencyState,
  CriterionResult,
  PracticalAssessment,
  ProgramStep,
} from './types';

export class CompetencyValidationError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'CompetencyValidationError';
    this.code = code;
  }
}

export interface RubricCriterionDefinition {
  code: string;
  description: string;
  weight: number;
  is_critical: boolean;
  min_target_level?: number;
}

export interface CompetencyEvaluationInput {
  competencyId: string;
  hasCompletedOnlineLessons: boolean;
  latestAssessment?: PracticalAssessment | null;
  targetLevel?: number; // Default 3
  officialRubricCriteria?: RubricCriterionDefinition[];
}

export interface CompetencyEvaluationResult {
  competencyId: string;
  state: CompetencyState;
  isEligibleForSignoff: boolean;
  reasons: string[];
  blocker?: string | null;
  sanitizedCriterionResults?: CriterionResult[];
}

/**
 * Validates rubric completeness and enforces server-defined criticality.
 * Empty rubrics, missing criteria, duplicate criteria, and invalid levels are rejected.
 */
export function validateAndSanitizeRubricResults(
  officialCriteria: RubricCriterionDefinition[],
  submittedResults: CriterionResult[]
): CriterionResult[] {
  if (!officialCriteria || officialCriteria.length === 0) {
    throw new CompetencyValidationError(
      'EMPTY_RUBRIC_DEFINITION',
      'Definisi rubrik resmi pada server tidak boleh kosong.'
    );
  }

  if (!submittedResults || submittedResults.length === 0) {
    throw new CompetencyValidationError(
      'EMPTY_SUBMISSION_REJECTED',
      'Hasil evaluasi kriteria rubrik praktikal tidak boleh kosong.'
    );
  }

  const seenIds = new Set<string>();
  for (const r of submittedResults) {
    if (seenIds.has(r.criterion_id)) {
      throw new CompetencyValidationError(
        'DUPLICATE_CRITERIA_DETECTED',
        `Kriteria penilaian duplikat terdeteksi untuk: ${r.criterion_id}`
      );
    }
    seenIds.add(r.criterion_id);

    if (![1, 2, 3, 4].includes(r.level)) {
      throw new CompetencyValidationError(
        'INVALID_RUBRIC_LEVEL',
        `Level rubrik pada "${r.criterion_id}" tidak valid (${r.level}). Harus berupa bilangan bulat 1 s/d 4.`
      );
    }
  }

  // Enforce all mandatory criteria from official rubric
  for (const def of officialCriteria) {
    if (!seenIds.has(def.code)) {
      throw new CompetencyValidationError(
        'MISSING_MANDATORY_CRITERIA',
        `Kriteria rubrik wajib belum dinilai: "${def.code}" (${def.description}).`
      );
    }
  }

  // Server-authoritative critical failure derivation:
  // Client cannot suppress a critical failure if the criterion is defined as critical on the server.
  return submittedResults.map((r) => {
    const def = officialCriteria.find((d) => d.code === r.criterion_id);
    const serverIsCritical = def ? def.is_critical : false;
    const isCriticalFailure = serverIsCritical && (r.level === 1 || r.critical_failure === true);

    return {
      ...r,
      critical_failure: isCriticalFailure,
    };
  });
}

/**
 * Authoritative evaluation function for competency state.
 * Prevents artificial progress: online lesson completion alone NEVER passes competency.
 * Enforces strict rubric evaluation and official assessor sign-off.
 */
export function evaluateCompetency(
  input: CompetencyEvaluationInput
): CompetencyEvaluationResult {
  const {
    competencyId,
    hasCompletedOnlineLessons,
    latestAssessment,
    targetLevel = 3,
    officialRubricCriteria,
  } = input;

  const reasons: string[] = [];

  // 1. Not started online theory
  if (!hasCompletedOnlineLessons) {
    return {
      competencyId,
      state: 'learning',
      isEligibleForSignoff: false,
      reasons: ['Materi teori pendukung belum diselesaikan oleh barista.'],
      blocker: 'Selesaikan materi pembelajaran dasar terlebih dahulu.',
    };
  }

  reasons.push('Materi teori pendukung telah selesai.');

  // 2. Online completed, but no practical assessment conducted yet
  if (!latestAssessment) {
    return {
      competencyId,
      state: 'awaiting_assessment',
      isEligibleForSignoff: false,
      reasons: [
        'Teori selesai. Menunggu penjadwalan dan observasi praktik oleh trainer.',
      ],
      blocker: 'Menunggu observasi praktik langsung oleh trainer.',
    };
  }

  // 3. Assessment in progress / draft
  if (latestAssessment.status === 'in_progress') {
    return {
      competencyId,
      state: 'awaiting_assessment',
      isEligibleForSignoff: false,
      reasons: ['Observasi praktik sedang berlangsung atau tersimpan sebagai draf.'],
      blocker: 'Penilaian praktik belum difinalisasi oleh trainer.',
    };
  }

  // 4. Validate rubric criteria if official rubric provided
  let results = latestAssessment.criterion_results || [];
  if (officialRubricCriteria && officialRubricCriteria.length > 0) {
    results = validateAndSanitizeRubricResults(officialRubricCriteria, results);
  } else if (results.length === 0) {
    throw new CompetencyValidationError(
      'EMPTY_SUBMISSION_REJECTED',
      'Penilaian praktik wajib memiliki set kriteria yang dievaluasi.'
    );
  }

  // 5. Check critical failures
  const hasCriticalFail = results.some((r) => r.critical_failure);
  if (hasCriticalFail) {
    return {
      competencyId,
      state: 'needs_practice',
      isEligibleForSignoff: false,
      reasons: [
        'Terjadi kesalahan kritis dalam observasi praktik lapangan.',
        'Diperlukan latihan terarah (remedial) sebelum penilaian ulang.',
      ],
      blocker: 'Kesalahan kritis teramati dalam praktik. Latihan ulang diperlukan.',
      sanitizedCriterionResults: results,
    };
  }

  // 6. Check if any criterion is below the target level
  const belowThreshold = results.some((r) => r.level < targetLevel);
  if (belowThreshold) {
    return {
      competencyId,
      state: 'needs_practice',
      isEligibleForSignoff: false,
      reasons: [
        `Terdapat kriteria penilaian yang belum mencapai target level minimum (${targetLevel}).`,
      ],
      blocker: 'Belum semua kriteria mencapai standar mandiri & konsisten.',
      sanitizedCriterionResults: results,
    };
  }

  // 7. Check official signoff
  const signoff = latestAssessment.signoff;
  if (!signoff || signoff.decision !== 'competent') {
    if (signoff?.decision === 'not_yet_competent') {
      return {
        competencyId,
        state: 'needs_practice',
        isEligibleForSignoff: false,
        reasons: ['Trainer menetapkan keputusan "Belum Kompeten" pada sesi ini.'],
        blocker: signoff.reason || 'Perlu latihan tambahan.',
        sanitizedCriterionResults: results,
      };
    }

    return {
      competencyId,
      state: 'awaiting_assessment',
      isEligibleForSignoff: true,
      reasons: ['Kriteria teknis terpenuhi. Menunggu konfirmasi tanda tangan trainer.'],
      blocker: 'Menunggu validasi resmi trainer.',
      sanitizedCriterionResults: results,
    };
  }

  // 8. Fully Competent
  return {
    competencyId,
    state: 'competent',
    isEligibleForSignoff: false,
    reasons: [
      'Teori selesai.',
      'Observasi praktik memenuhi seluruh kriteria rubrik tanpa kesalahan kritis.',
      `Disahkan oleh trainer pada ${new Date(signoff.signed_at).toLocaleDateString('id-ID')}.`,
    ],
    blocker: null,
    sanitizedCriterionResults: results,
  };
}

/**
 * Validates step prerequisites: asserts that all required step IDs have been completed.
 */
export function isStepUnlocked(
  step: ProgramStep,
  completedStepIds: Set<string>
): { unlocked: boolean; missingStepIds: string[] } {
  const requires = step.gate_policy?.requires_prior_steps || [];
  const missing = requires.filter((id) => !completedStepIds.has(id));

  return {
    unlocked: missing.length === 0,
    missingStepIds: missing,
  };
}
