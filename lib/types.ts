/**
 * Cherry Edu Teams — TypeScript Domain Models
 * Aligned with 03_ERD_Technical_Architecture.md v1.0
 */

// -------------------------------------------------------------------------
// 1. Core Identity & Organization Tenancy
// -------------------------------------------------------------------------

export type OrganizationStatus = 'setup' | 'active' | 'suspended' | 'closed';

export interface Organization {
  id: string;
  slug: string;
  display_name: string;
  legal_name?: string | null;
  business_category?: string | null;
  status: OrganizationStatus;
  primary_contact_user_id?: string | null;
  timezone: string; // e.g. 'Asia/Jakarta'
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
}

export type OutletStatus = 'active' | 'inactive';

export interface Outlet {
  id: string;
  organization_id: string;
  name: string;
  city: string;
  address?: string | null;
  status: OutletStatus;
  created_at: string;
  updated_at: string;
}

export type MembershipStatus = 'invited' | 'active' | 'suspended' | 'ended';
export type RoleCode = 'owner' | 'client_manager' | 'head_bar' | 'learner' | 'trainer';
export type StaffPermissionCode = 'platform_admin' | 'program_admin' | 'assessment_quality_reviewer' | 'cherry_trainer';

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  status: MembershipStatus;
  joined_at?: string | null;
  ended_at?: string | null;
  created_at: string;
  roles: RoleCode[];
  outlet_scopes?: string[]; // outlet IDs
}

export interface UserAuthContext {
  userId: string;
  email: string;
  fullName: string;
  activeOrganizationId?: string | null;
  activeMembership?: OrganizationMembership | null;
  staffPermissions: StaffPermissionCode[];
  assignedCohorts?: string[];
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invitation {
  id: string;
  organization_id: string;
  email_normalized: string;
  intended_role: RoleCode;
  outlet_id?: string | null;
  token_hash: string;
  expires_at: string;
  status: InvitationStatus;
  accepted_user_id?: string | null;
  invited_by: string;
  accepted_at?: string | null;
  created_at: string;
}

// -------------------------------------------------------------------------
// 2. Program Structure, Versions & Prerequisites
// -------------------------------------------------------------------------

export type ProgramStatus = 'setup' | 'active' | 'ended' | 'archived';
export type VersionStatus = 'building' | 'published' | 'retired';

export interface Program {
  id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  source_template_id?: string | null;
  status: ProgramStatus;
  created_by?: string | null;
  created_at: string;
}

export interface ProgramVersion {
  id: string;
  program_id: string;
  organization_id: string;
  version_no: number;
  status: VersionStatus;
  policy_snapshot: {
    passing_grade?: number;
    max_quiz_attempts?: number;
    require_practical_signoff: boolean;
  };
  content_checksum?: string | null;
  published_at?: string | null;
  created_at: string;
}

export type StepType = 'lesson' | 'quiz' | 'practice' | 'session' | 'task' | 'reference' | 'signoff';
export type StepSourceType = 'cherry_learning' | 'b2b_content' | 'practical' | 'external_link';

export interface ProgramStep {
  id: string;
  program_version_id: string;
  organization_id: string;
  step_type: StepType;
  source_type: StepSourceType;
  source_ref?: string | null; // e.g. canonical lesson_id 'bs-ext-01'
  source_version?: string | null;
  title_override?: string | null;
  sort_order: number;
  is_required: boolean;
  estimated_minutes?: number | null;
  gate_policy?: {
    requires_prior_steps?: string[];
    min_score?: number;
  };
  created_at: string;
}

// -------------------------------------------------------------------------
// 3. Cohorts, Enrollments & Learner Progress
// -------------------------------------------------------------------------

export type CohortStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type EnrollmentStatus = 'invited' | 'active' | 'paused' | 'completed' | 'withdrawn';
export type StepProgressState = 'not_started' | 'in_progress' | 'completed' | 'blocked';

export interface Cohort {
  id: string;
  organization_id: string;
  program_version_id: string;
  name: string;
  start_at: string;
  end_at?: string | null;
  status: CohortStatus;
  created_at: string;
}

export interface Enrollment {
  id: string;
  organization_id: string;
  cohort_id: string;
  user_id: string;
  outlet_id?: string | null;
  status: EnrollmentStatus;
  source_diagnostic_id?: string | null;
  enrolled_at: string;
  ended_at?: string | null;
}

export interface LearningStepProgress {
  id: string;
  organization_id: string;
  enrollment_id: string;
  program_step_id: string;
  state: StepProgressState;
  last_learning_event_id?: string | null;
  completed_at?: string | null;
  updated_at: string;
}

// -------------------------------------------------------------------------
// 4. Competencies, Rubrics & Practical Assessments
// -------------------------------------------------------------------------

export type CompetencyCriticality = 'normal' | 'critical';
export type CompetencyState = 'not_started' | 'learning' | 'needs_practice' | 'awaiting_assessment' | 'competent' | 'reassessment_due';

export interface Competency {
  id: string;
  organization_id?: string | null; // null = global library
  code: string;
  name: string;
  description?: string | null;
  source_standard_ref?: string | null; // e.g. 'SKKNI Kepmenaker 32/2023'
  criticality: CompetencyCriticality;
  status: 'active' | 'retired';
  created_at: string;
}

export interface RubricCriterion {
  id: string;
  rubric_version_id: string;
  code: string;
  description: string;
  weight: number;
  is_critical: boolean;
  anchors: {
    1: string; // Belum mampu
    2: string; // Banyak arahan
    3: string; // Sedikit arahan
    4: string; // Mandiri & konsisten
  };
}

export interface RubricVersion {
  id: string;
  rubric_id: string;
  version_no: number;
  status: VersionStatus;
  criteria: RubricCriterion[];
  published_at?: string | null;
  created_at: string;
}

export type AssessmentStatus = 'in_progress' | 'submitted' | 'signed_off' | 'voided';
export type SignoffDecision = 'competent' | 'not_yet_competent' | 'requires_review';

export interface CriterionResult {
  id: string;
  assessment_id: string;
  criterion_id: string;
  level: 1 | 2 | 3 | 4;
  critical_failure: boolean;
  notes?: string | null;
  evidence_asset_id?: string | null;
  entered_at: string;
}

export type ObservationRecommendation = 'recommend_competent' | 'recommend_needs_practice';
export type AssessorType = 'cherry_trainer' | 'delegated_assessor';

export interface PracticalAssessment {
  id: string;
  organization_id: string;
  enrollment_id: string;
  competency_id: string;
  rubric_version_id: string;
  session_id?: string | null;
  assessor_user_id?: string | null;
  status: AssessmentStatus;
  attempt_no: number;
  idempotency_key: string;
  started_at: string;
  submitted_at?: string | null;
  signed_off_at?: string | null;
  criterion_results?: CriterionResult[];
  // Head Bar observation & recommendation (not final signoff)
  head_bar_observation?: {
    observed_by: string;
    recommendation: ObservationRecommendation;
    notes?: string | null;
    observed_at: string;
  };
  // Final official signoff (Cherry Edu Trainer or certified delegated assessor)
  signoff?: {
    decision: SignoffDecision;
    signed_by: string;
    assessor_type: AssessorType;
    reason?: string | null;
    signed_at: string;
  };
  // Administrative correction by Platform Admin (strictly audited, requires reason)
  administrative_correction?: {
    corrected_by: string;
    reason: string;
    prior_decision: SignoffDecision;
    new_decision: SignoffDecision;
    audit_event_id: string;
    corrected_at: string;
  };
}

export interface CompetencyStatusRecord {
  organization_id: string;
  enrollment_id: string;
  competency_id: string;
  state: CompetencyState;
  verified_at?: string | null;
  next_review_at?: string | null;
  last_recomputed_at: string;
  derivation_revision: number;
}

export interface RemediationTask {
  id: string;
  organization_id: string;
  enrollment_id: string;
  competency_id: string;
  criterion_id?: string | null;
  assigned_by: string;
  title: string;
  instructions: string;
  due_at?: string | null;
  status: 'assigned' | 'in_progress' | 'submitted' | 'verified' | 'cancelled';
  created_at: string;
  resolved_at?: string | null;
}

// -------------------------------------------------------------------------
// 5. Training Operations (Sessions & Attendance)
// -------------------------------------------------------------------------

export type TrainingSessionStatus = 'scheduled' | 'rescheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'rescheduled';

export interface TrainingSession {
  id: string;
  organization_id: string;
  cohort_id: string;
  title: string;
  start_at: string;
  end_at: string;
  timezone: string;
  location_text?: string | null;
  status: TrainingSessionStatus;
  created_by?: string | null;
  change_reason?: string | null;
  created_at: string;
}

export interface SessionAttendance {
  organization_id: string;
  session_id: string;
  enrollment_id: string;
  status: AttendanceStatus;
  recorded_by: string;
  recorded_at: string;
}

// -------------------------------------------------------------------------
// 6. Audit & Eventing
// -------------------------------------------------------------------------

export interface AuditEvent {
  id: string;
  organization_id?: string | null;
  actor_user_id?: string | null;
  action: string;
  object_type: string;
  object_id: string;
  reason?: string | null;
  old_summary?: Record<string, unknown> | null;
  new_summary?: Record<string, unknown> | null;
  request_id?: string | null;
  occurred_at: string;
}
