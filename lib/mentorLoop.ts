/**
 * Cherry Edu Teams mentor loop — PURE DOMAIN MODEL for a preview-only vertical slice.
 *
 * The role switcher in /mentor-loop is a design demonstrator, NOT authentication.
 * Real production APIs MUST perform server-side identity, assignment, tenant, and
 * transition validation before calling/reusing these domain operations.
 */
export type LoopRole = "barista" | "trainer" | "owner";
export type ReviewVerdict = "practice_again" | "progressing";
export type DraftField = "sessionTopic" | "internalObservation" | "ownerSummary" | "practicePrompt";
export type PracticeInput = { changed: string; noticed: string; reason: string };

export type PracticeAttempt = PracticeInput & {
  id: string;
  submittedAt: string;
  review: null | {
    verdict: ReviewVerdict;
    message: string;
    publishedAt: string;
  };
};

export type LoopEvent = {
  id: string;
  actor: "trainer" | "barista";
  kind: "session_published" | "practice_submitted" | "feedback_published";
  timestamp: string;
};

export interface MentorLoopState {
  version: 1;
  attendance: boolean;
  sessionPublishedAt: string | null;
  draft: Record<DraftField, string>;
  attempts: PracticeAttempt[];
  events: LoopEvent[];
}

export const ACTIVITY = {
  client: "Kopi Senja",
  learner: "Naya",
  learnerFull: "Naya Putri",
  trainer: "Tim Cherry Edu",
  session: "Teknik Dasar & Espresso",
  stage: "Mentorship · Minggu ke-2",
} as const;

export const DRAFT_DEFAULTS: Record<DraftField, string> = {
  sessionTopic: "",
  internalObservation: "",
  ownerSummary: "",
  practicePrompt: "",
};

export function initialMentorLoop(): MentorLoopState {
  return {
    version: 1,
    attendance: false,
    sessionPublishedAt: null,
    draft: { ...DRAFT_DEFAULTS },
    attempts: [],
    events: [],
  };
}

function ensure(value: boolean, message: string): asserts value {
  if (!value) throw new Error(message);
}

function nonBlank(value: string, minLength: number, field: string): string {
  const cleaned = value.trim();
  ensure(cleaned.length >= minLength, field + " terlalu singkat. Tambahkan informasi yang lebih jelas.");
  ensure(cleaned.length <= 1200, field + " terlalu panjang (maksimum 1.200 karakter).");
  return cleaned;
}

export function setAttendance(state: MentorLoopState, attended: boolean): MentorLoopState {
  ensure(!state.sessionPublishedAt, "Sesi yang sudah dipublikasikan tidak dapat diubah melalui simulasi ini.");
  return { ...state, attendance: attended };
}

export function editTrainerDraft(
  state: MentorLoopState,
  field: DraftField,
  value: string
): MentorLoopState {
  ensure(!state.sessionPublishedAt, "Sesi sudah dipublikasikan. Catatan resminya tidak bisa diedit secara diam-diam.");
  ensure(Object.hasOwn(DRAFT_DEFAULTS, field), "Kolom catatan tidak dikenal.");
  return { ...state, draft: { ...state.draft, [field]: value.slice(0, 1200) } };
}

export function publishTrainerSession(state: MentorLoopState, at: string): MentorLoopState {
  ensure(!state.sessionPublishedAt, "Sesi sudah dipublikasikan.");
  ensure(state.attendance, "Tandai kehadiran peserta sebelum mempublikasikan sesi.");
  nonBlank(state.draft.sessionTopic, 6, "Materi sesi");
  nonBlank(state.draft.ownerSummary, 12, "Ringkasan untuk Owner");
  nonBlank(state.draft.practicePrompt, 12, "Instruksi latihan");
  return {
    ...state,
    sessionPublishedAt: at,
    events: [...state.events, {
      id: "session-"+at,
      actor: "trainer",
      kind: "session_published",
      timestamp: at,
    }],
  };
}

export function submitPractice(
  state: MentorLoopState,
  input: PracticeInput,
  at: string
): MentorLoopState {
  ensure(Boolean(state.sessionPublishedAt), "Instruksi latihan belum diberikan oleh Trainer.");
  ensure(state.attempts.length < 10, "Batas simulasi 10 percobaan tercapai. Reset simulasi untuk mencoba lagi.");
  const previous = state.attempts.at(-1);
  ensure(
    !previous || previous.review?.verdict === "practice_again",
    previous && !previous.review
      ? "Latihanmu sudah dikirim. Tunggu feedback sebelum mengirim percobaan baru."
      : "Belum ada instruksi latihan ulang dari Trainer."
  );
  const attempt: PracticeAttempt = {
    id: "practice-"+at,
    changed: nonBlank(input.changed, 5, "Hal yang dicoba"),
    noticed: nonBlank(input.noticed, 8, "Hasil pengamatan"),
    reason: nonBlank(input.reason, 8, "Refleksi"),
    submittedAt: at,
    review: null,
  };
  return {
    ...state,
    attempts: [...state.attempts, attempt],
    events: [...state.events, {
      id: attempt.id,
      actor: "barista",
      kind: "practice_submitted",
      timestamp: at,
    }],
  };
}

export function reviewPractice(
  state: MentorLoopState,
  verdict: ReviewVerdict,
  message: string,
  at: string
): MentorLoopState {
  const last = state.attempts.at(-1);
  ensure(Boolean(last), "Barista belum mengirim latihan untuk direview.");
  ensure(!last!.review, "Percobaan ini sudah dinilai. Perubahan hasil membutuhkan proses koreksi resmi.");
  ensure(verdict === "practice_again" || verdict === "progressing", "Hasil review tidak dikenal.");
  const cleanMessage = nonBlank(message, 12, "Feedback Trainer");
  return {
    ...state,
    attempts: state.attempts.map((attempt, index) =>
      index === state.attempts.length - 1
        ? { ...attempt, review: { verdict, message: cleanMessage, publishedAt: at } }
        : attempt
    ),
    events: [...state.events, {
      id: "feedback-"+at,
      actor: "trainer",
      kind: "feedback_published",
      timestamp: at,
    }],
  };
}

export function getPracticeStatus(state: MentorLoopState):
  "waiting_session" | "ready" | "waiting_feedback" | "retry_ready" | "reviewed" {
  if (!state.sessionPublishedAt) return "waiting_session";
  const last = state.attempts.at(-1);
  if (!last) return "ready";
  if (!last.review) return "waiting_feedback";
  return last.review.verdict === "practice_again" ? "retry_ready" : "reviewed";
}

export function getOwnerReport(state: MentorLoopState) {
  const last = state.attempts.at(-1);
  return {
    sessionPublished: Boolean(state.sessionPublishedAt),
    sessionDate: state.sessionPublishedAt,
    topic: state.sessionPublishedAt ? state.draft.sessionTopic.trim() : null,
    summary: state.sessionPublishedAt ? state.draft.ownerSummary.trim() : null,
    attendeeCount: state.sessionPublishedAt && state.attendance ? 1 : 0,
    practiceSubmissions: state.attempts.length,
    reviewPublished: Boolean(last?.review),
    latestReview: last?.review
      ? {
          verdict: last.review.verdict,
          message: last.review.message,
          at: last.review.publishedAt,
        }
      : null,
    // Deliberately exclude internalObservation, private Barista submission
    // and draft notes from Owner-facing service reports.
    nextAction: !state.sessionPublishedAt
      ? "Menunggu Trainer mencatat dan mempublikasikan sesi."
      : !last
        ? "Menunggu latihan mandiri dari Barista."
        : !last.review
          ? "Trainer perlu meninjau latihan yang sudah dikumpulkan."
          : last.review.verdict === "practice_again"
            ? "Barista perlu mencoba kembali berdasarkan feedback Trainer."
            : "Tinjau latihan berikutnya dan lanjutkan pendampingan.",
  };
}

/** Check only the minimum schema so stale or corrupt browser data never crashes UI. */
export function loadPreviewState(raw: string | null): MentorLoopState {
  if (!raw) return initialMentorLoop();
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return initialMentorLoop();
    const d = value as Partial<MentorLoopState>;
    if (
      d.version !== 1 ||
      typeof d.attendance !== "boolean" ||
      !(d.sessionPublishedAt === null || typeof d.sessionPublishedAt === "string") ||
      !d.draft ||
      !Array.isArray(d.attempts) ||
      !Array.isArray(d.events) ||
      d.attempts.length > 10
    ) return initialMentorLoop();
    for (const field of Object.keys(DRAFT_DEFAULTS) as DraftField[]) {
      if (typeof d.draft[field] !== "string" || d.draft[field].length > 1200) return initialMentorLoop();
    }
    for (const a of d.attempts) {
      if (
        typeof a.id !== "string" || typeof a.changed !== "string" ||
        typeof a.noticed !== "string" || typeof a.reason !== "string" ||
        typeof a.submittedAt !== "string" ||
        !(a.review === null || (
          typeof a.review === "object" &&
          (a.review.verdict === "practice_again" || a.review.verdict === "progressing") &&
          typeof a.review.message === "string" && typeof a.review.publishedAt === "string"
        ))
      ) return initialMentorLoop();
    }
    return { ...d, draft: { ...d.draft }, attempts: [...d.attempts], events: [...d.events] } as MentorLoopState;
  } catch {
    return initialMentorLoop();
  }
}
