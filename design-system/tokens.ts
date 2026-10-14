/**
 * Cherry Edu Teams — Verified Design Tokens & Semantic UI System
 * Aligned with 05_UI_Visual_Direction_Guardrails.md v1.1 & Brand Specifications
 * 
 * HARD CONSTRAINTS:
 * - NO neon/lime green (#00FF00, #39FF14, #22C55E glow, etc.)
 * - NO green glow or colored glowing box-shadows
 * - NO bright decorative red (red is strictly reserved for actual destructive/error actions)
 * - NO decorative pill badges without clear user utility
 * - Accessible: All statuses are accompanied by readable text labels (grayscale-safe)
 */

export const brandTokens = {
  // Bespoke Artisanal Coffee Canvas & Ink
  canvas: {
    bg: '#FCFAF7',        // paper-50: clean warm background
    surface: '#FFFFFF',   // clean white surface for content cards
    surfaceMuted: '#F7F3EC', // paper-100: subtle contrast for nested sections
    border: '#EFE8DC',    // paper-200: soft natural separator
    borderSubtle: '#F5F2F0', // roast-50
  },
  typography: {
    primary: '#140E0C',   // roast-950: deepest espresso ink
    secondary: '#5A473D', // roast-600: balanced secondary text
    muted: '#957D71',     // roast-400: subtle helper text
    inverse: '#FCFAF7',   // paper-50: white/paper text on dark buttons
  },
  actions: {
    primary: '#7E1D2A',   // cherry-700: signature Cherry Roastery red CTA
    primaryHover: '#651822', // cherry-800
    primaryActive: '#50141C', // cherry-900
    neutral: '#211814',   // roast-900: secondary solid button
    neutralHover: '#31241E',
  },
  semantics: {
    // Competent / Completed / Saved: Calm muted olive, NEVER neon
    success: {
      text: '#3B4E34',    // olive-700
      bg: '#F4F6F2',      // olive-50
      border: '#CCD7C3',  // olive-200
      indicator: '#4D6644', // olive-600
    },
    // Waiting for Assessment / Pending Review: Warm subtle crema
    pending: {
      text: '#6F4F21',    // crema-800
      bg: '#FDFBF5',      // crema-50
      border: '#EDDDA4',  // crema-300
      indicator: '#B38933', // crema-600
    },
    // Needs Practice / Remedial Required: Thoughtful warm roast/amber (not aggressive flashing red)
    attention: {
      text: '#44342C',    // roast-700
      bg: '#F7F3EC',      // paper-100
      border: '#D3C3AC',  // paper-400
      indicator: '#745E53', // roast-500
    },
    // Actual Error / Connection Offline / Critical Hazard: Controlled cherry danger
    danger: {
      text: '#651822',    // cherry-800
      bg: '#FCF2F3',      // cherry-50
      border: '#F3CCD1',  // cherry-200
      indicator: '#7E1D2A', // cherry-700
    },
  },
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px - standard clean button
    lg: '0.75rem',   // 12px - card container
    xl: '1rem',      // 16px - outer modal/drawer
  },
  touchTarget: {
    minHeight: '44px',
    minWidth: '44px',
  },
} as const;

/**
 * Returns accessible styling and semantic label for competency states.
 * Fully readable even on monochrome / grayscale displays.
 */
export function getCompetencyStatusPresentation(state: string): {
  label: string;
  subtext: string;
  className: string;
} {
  switch (state) {
    case 'competent':
      return {
        label: 'Kompeten',
        subtext: 'Tervalidasi oleh trainer',
        className: 'bg-olive-50 text-olive-800 border-olive-200',
      };
    case 'awaiting_assessment':
      return {
        label: 'Menunggu Penilaian',
        subtext: 'Teori selesai, belum observasi praktik',
        className: 'bg-crema-50 text-crema-800 border-crema-200',
      };
    case 'needs_practice':
      return {
        label: 'Perlu Latihan',
        subtext: 'Diperlukan pengulangan & bimbingan',
        className: 'bg-paper-100 text-roast-800 border-paper-400',
      };
    case 'learning':
      return {
        label: 'Sedang Belajar',
        subtext: 'Materi dasar sedang berlangsung',
        className: 'bg-roast-50 text-roast-700 border-roast-200',
      };
    case 'not_started':
    default:
      return {
        label: 'Belum Dimulai',
        subtext: 'Belum ada progres tercatat',
        className: 'bg-paper-50 text-roast-500 border-paper-300',
      };
  }
}
