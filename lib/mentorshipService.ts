/**
 * Cherry Edu Teams — B2B 1-Month Hybrid Mentorship Service Framework
 * 
 * Standar Service 1 Bulan untuk Coffee Shop:
 * 1. R&D (Audit Bar, Resep & SOP Mesin)
 * 2. Mentorship Hybrid:
 *    2.1 Fundamental (Online Tracker sync ke edu.cherrycoffeeroastery.com)
 *    2.2 Teknik (Offline Practical Bar Session)
 *    2.3 Espresso Base (Offline Dial-in & Sensory Session)
 *    2.4 Class (Min. 3 Specialized Paths dari Cherry Edu)
 *    2.5 Ujian (Hybrid Exam: Teori B2C + Soal Custom Trainer)
 *    2.6 Executive Owner Report (Transparansi kegiatan, progres service & perkembangan SDM)
 */

export interface TrainerServiceLog {
  id: string;
  date: string;
  sessionType: 'rnd' | 'offline_teknik' | 'offline_espresso' | 'audit_evaluasi';
  title: string;
  trainerName: string;
  summary: string;
  findings: string[];
  actionItems: string[];
}

export interface BaristaPathProgress {
  pathId: string;
  title: string;
  category: string;
  completed: boolean;
  score?: number;
  completedAt?: string;
  cherryEduUrl: string;
}

export interface BaristaMentorshipRecord {
  id: string;
  name: string;
  email: string;
  role: string; // e.g. Junior Barista, Senior Barista, Head Bar
  avatarText: string;
  
  // Baseline vs Current
  initialScore: number; // e.g. 42
  currentScore: number; // e.g. 86
  overallStatus: 'needs_practice' | 'on_track' | 'ready_exam' | 'certified';
  
  // 2.1 Fundamental Online (edu.cherrycoffeeroastery.com)
  fundamentalHuluHilir: {
    completed: boolean;
    progressPct: number;
    finalExamPassed: boolean;
    examScore?: number;
    lastAccessed?: string;
  };
  fundamentalBaristaPath: {
    completed: boolean;
    progressPct: number;
    finalExamPassed: boolean;
    examScore?: number;
    lastAccessed?: string;
  };

  // 2.2 Sesi Offline Teknik (Praktik Bar)
  offlineTeknik: {
    verified: boolean;
    verifiedAt?: string;
    trainerNotes: string;
    score: number; // 0 - 100
    criteria: {
      barErgonomics: boolean;
      dosingDistribution: boolean;
      tampingConsistency: boolean;
      stationCleanliness: boolean;
    };
  };

  // 2.3 Sesi Offline Espresso Base (Dial-in & Sensori)
  offlineEspressoBase: {
    verified: boolean;
    verifiedAt?: string;
    trainerNotes: string;
    score: number; // 0 - 100
    dialInRatio: string;
    sensoryEvaluation: 'under' | 'over' | 'balanced' | 'sweet_spot';
    milkSteamingConsistency: boolean;
  };

  // 2.4 Class (Min. 3 Paths dari Cherry Edu)
  classesTaken: BaristaPathProgress[];

  // 2.5 Ujian Komprehensif (Hybrid)
  hybridExam: {
    status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
    theoryScore: number; // Dari materi B2C
    practicalCustomScore: number; // Soal custom trainer
    finalScore: number;
    passed: boolean;
    takenAt?: string;
  };

  // 2.6 Rekomendasi Trainer untuk Owner
  trainerRecommendation: string;
}

export interface CoffeeShopMentorshipProgram {
  organizationId: string;
  coffeeShopName: string;
  startDate: string;
  endDate: string;
  currentWeek: number; // 1 to 4
  currentPhase: 'rnd' | 'fundamental' | 'teknik_espresso' | 'classes_exam' | 'final_report';
  overallServiceProgressPct: number; // 0 to 100
  
  // 1. R&D Deliverables
  rndAudit: {
    completed: boolean;
    completedAt: string;
    waterTdsPpm: number;
    machineStatus: string;
    grinderSpecs: string;
    houseBlendRecipe: {
      doseGrams: number;
      yieldGrams: number;
      targetTimeSec: number;
      brewRatio: string;
    };
    sopDocumentUrl: string;
    keyFindings: string[];
  };

  // Trainer Activity Logs (Untuk transparansi owner)
  serviceLogs: TrainerServiceLog[];

  // Barista SDM Roster
  baristas: BaristaMentorshipRecord[];
}

export const DEMO_MENTORSHIP_PROGRAM: CoffeeShopMentorshipProgram = {
  organizationId: "org-kopisenja-01",
  coffeeShopName: "Kopi Senja (Specialty Coffee)",
  startDate: "2026-04-01",
  endDate: "2026-04-30",
  currentWeek: 3,
  currentPhase: "teknik_espresso",
  overallServiceProgressPct: 78,

  rndAudit: {
    completed: true,
    completedAt: "2026-04-04",
    waterTdsPpm: 125,
    machineStatus: "La Marzocco Linea PB 2-Group (Tekanan stabil 9 bar, suhu 93.5°C)",
    grinderSpecs: "Mahlkönig EK43 & Mazzer Kony S (Burrs alignment terkalibrasi)",
    houseBlendRecipe: {
      doseGrams: 18.0,
      yieldGrams: 36.0,
      targetTimeSec: 27,
      brewRatio: "1:2.0",
    },
    sopDocumentUrl: "https://edu.cherrycoffeeroastery.com/docs/sop-senja-v1.pdf",
    keyFindings: [
      "Distribusi bubuk kopi sebelumnya tidak konsisten, menyebabkan channeling minor pada basket kanan.",
      "Suhu steaming susu awal sering over 70°C; telah dikalibrasi ke sweet-spot 60–63°C.",
      "TDS air bar 125 ppm tergolong optimal untuk ekstraksi arabika washed & natural.",
    ],
  },

  serviceLogs: [
    {
      id: "log-01",
      date: "2026-04-03",
      sessionType: "rnd",
      title: "Audit Teknis Bar & Kalibrasi Resep House Blend",
      trainerName: "Dimas Trainer (Cherry Edu)",
      summary: "Pemeriksaan menyeluruh mesin espresso, grinder, TDS air, dan penentuan SOP rasio seduh standar kafe.",
      findings: [
        "Basket portafilter dibersihkan dari kerak sisa minyak kopi lama.",
        "Resep dasar ditentukan pada 18g dose : 36g yield di rentang 26-28 detik.",
      ],
      actionItems: [
        "Barista wajib melakukan flushing sebelum pasang portafilter.",
        "Gunakan WDT needle tool untuk mencegah channeling.",
      ],
    },
    {
      id: "log-02",
      date: "2026-04-08",
      sessionType: "offline_teknik",
      title: "Mentorship Praktik: Ergonomi Bar, Dosing & Milk Physics",
      trainerName: "Dimas Trainer (Cherry Edu)",
      summary: "Sesi tatap muka langsung di stasiun bar kafe. Melatih memegang tamping 90 derajat dan stretching susu microfoam.",
      findings: [
        "Budi Pratama dan Siti Rahma sudah konsisten tamping rata.",
        "Reza Kurniawan butuh penyesuaian sudut siku saat tamping agar tidak miring.",
      ],
      actionItems: [
        "Latihan 10x steaming air campur sabun untuk melatih pusaran vortex pitcher.",
      ],
    },
    {
      id: "log-03",
      date: "2026-04-14",
      sessionType: "offline_espresso",
      title: "Mentorship Praktik: Dial-In Espresso Base & Uji Sensori",
      trainerName: "Dimas Trainer (Cherry Edu)",
      summary: "Fokus kalibrasi pagi mandiri tanpa bantuan supervisor, evaluasi rasa (acidity vs sweetness vs bitterness).",
      findings: [
        "Tim sudah mampu mengidentifikasi shot underextracted (sour/salty) vs overextracted (dry/bitter).",
        "Waktu dial-in harian terpangkas dari 25 menit menjadi 8 menit.",
      ],
      actionItems: [
        "Pencatatan log kalibrasi tiap jam 08.00 pagi sebelum pintu kafe buka.",
      ],
    },
  ],

  baristas: [
    {
      id: "barista-01",
      name: "Budi Pratama",
      email: "barista1@kopikamu.id",
      role: "Junior Barista (Tahun ke-1)",
      avatarText: "BP",
      initialScore: 42,
      currentScore: 84,
      overallStatus: "ready_exam",
      fundamentalHuluHilir: {
        completed: true,
        progressPct: 100,
        finalExamPassed: true,
        examScore: 88,
        lastAccessed: "2026-04-06",
      },
      fundamentalBaristaPath: {
        completed: true,
        progressPct: 100,
        finalExamPassed: true,
        examScore: 92,
        lastAccessed: "2026-04-10",
      },
      offlineTeknik: {
        verified: true,
        verifiedAt: "2026-04-08",
        trainerNotes: "Tamping stabil 15kg pressure, distribusi kopi rapi, kebersihan bar sangat terjaga.",
        score: 88,
        criteria: {
          barErgonomics: true,
          dosingDistribution: true,
          tampingConsistency: true,
          stationCleanliness: true,
        },
      },
      offlineEspressoBase: {
        verified: true,
        verifiedAt: "2026-04-14",
        trainerNotes: "Dial-in konsisten 18g:36g @ 27s. Mampu mendeteksi defect astringency dengan akurat.",
        score: 85,
        dialInRatio: "1:2.0 (18.0g → 36.2g @ 27s)",
        sensoryEvaluation: "sweet_spot",
        milkSteamingConsistency: true,
      },
      classesTaken: [
        {
          pathId: "path-sensory",
          title: "Sensory & Cupping Foundation",
          category: "Sensory",
          completed: true,
          score: 86,
          completedAt: "2026-04-11",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/sensory",
        },
        {
          pathId: "path-milk",
          title: "Milk Science & Microfoam Texturing",
          category: "Barista Skills",
          completed: true,
          score: 90,
          completedAt: "2026-04-13",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/milk-science",
        },
        {
          pathId: "path-manualbrew",
          title: "Specialty Manual Brewing (V60 & Aeropress)",
          category: "Brewing",
          completed: false,
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/manual-brew",
        },
      ],
      hybridExam: {
        status: "graded",
        theoryScore: 90,
        practicalCustomScore: 85,
        finalScore: 87.5,
        passed: true,
        takenAt: "2026-04-15",
      },
      trainerRecommendation: "Rekomendasi naik ke level Barista Terstandar Penuh. Siap memegang stasiun espresso pada peak hours tanpa supervisi ketat.",
    },
    {
      id: "barista-02",
      name: "Siti Rahma",
      email: "barista2@kopikamu.id",
      role: "Senior Barista (Tahun ke-2)",
      avatarText: "SR",
      initialScore: 68,
      currentScore: 95,
      overallStatus: "certified",
      fundamentalHuluHilir: {
        completed: true,
        progressPct: 100,
        finalExamPassed: true,
        examScore: 96,
        lastAccessed: "2026-04-04",
      },
      fundamentalBaristaPath: {
        completed: true,
        progressPct: 100,
        finalExamPassed: true,
        examScore: 98,
        lastAccessed: "2026-04-07",
      },
      offlineTeknik: {
        verified: true,
        verifiedAt: "2026-04-08",
        trainerNotes: "Kecepatan workflow luar biasa, multi-tasking grinder dan steam wand sangat bersih.",
        score: 96,
        criteria: {
          barErgonomics: true,
          dosingDistribution: true,
          tampingConsistency: true,
          stationCleanliness: true,
        },
      },
      offlineEspressoBase: {
        verified: true,
        verifiedAt: "2026-04-14",
        trainerNotes: "Paham mikro-adjusment grind size saat suhu bar panas di siang hari.",
        score: 95,
        dialInRatio: "1:2.0 (18.2g → 36.5g @ 28s)",
        sensoryEvaluation: "sweet_spot",
        milkSteamingConsistency: true,
      },
      classesTaken: [
        {
          pathId: "path-sensory",
          title: "Sensory & Cupping Foundation",
          category: "Sensory",
          completed: true,
          score: 94,
          completedAt: "2026-04-08",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/sensory",
        },
        {
          pathId: "path-milk",
          title: "Milk Science & Microfoam Texturing",
          category: "Barista Skills",
          completed: true,
          score: 98,
          completedAt: "2026-04-10",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/milk-science",
        },
        {
          pathId: "path-workflow",
          title: "High-Volume Bar Speed & Ergonomics",
          category: "Operations",
          completed: true,
          score: 92,
          completedAt: "2026-04-12",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/bar-ergonomics",
        },
      ],
      hybridExam: {
        status: "graded",
        theoryScore: 97,
        practicalCustomScore: 95,
        finalScore: 96,
        passed: true,
        takenAt: "2026-04-15",
      },
      trainerRecommendation: "Sangat direkomendasikan dipromosikan sebagai Head Bar / Lead Trainer internal kafe. Mampu mendampingi junior saat kalibrasi harian.",
    },
    {
      id: "barista-03",
      name: "Reza Kurniawan",
      email: "barista3@kopikamu.id",
      role: "Barista Operasional (Tahun ke-1)",
      avatarText: "RK",
      initialScore: 35,
      currentScore: 68,
      overallStatus: "needs_practice",
      fundamentalHuluHilir: {
        completed: true,
        progressPct: 100,
        finalExamPassed: true,
        examScore: 78,
        lastAccessed: "2026-04-09",
      },
      fundamentalBaristaPath: {
        completed: false,
        progressPct: 65,
        finalExamPassed: false,
        lastAccessed: "2026-04-13",
      },
      offlineTeknik: {
        verified: true,
        verifiedAt: "2026-04-08",
        trainerNotes: "Tamping masih perlu pembiasaan agar tidak miring (channeling risk).",
        score: 70,
        criteria: {
          barErgonomics: true,
          dosingDistribution: true,
          tampingConsistency: false,
          stationCleanliness: true,
        },
      },
      offlineEspressoBase: {
        verified: false,
        trainerNotes: "Perlu sesi pengulangan ekstraksi espresso 18g:36g. Masih sering under-extracted karena grind size terlalu kasar.",
        score: 65,
        dialInRatio: "1:2.4 (18.0g → 43.0g @ 21s) - Underextracted",
        sensoryEvaluation: "under",
        milkSteamingConsistency: false,
      },
      classesTaken: [
        {
          pathId: "path-milk",
          title: "Milk Science & Microfoam Texturing",
          category: "Barista Skills",
          completed: true,
          score: 75,
          completedAt: "2026-04-12",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/milk-science",
        },
        {
          pathId: "path-sensory",
          title: "Sensory & Cupping Foundation",
          category: "Sensory",
          completed: false,
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/sensory",
        },
        {
          pathId: "path-manualbrew",
          title: "Specialty Manual Brewing (V60 & Aeropress)",
          category: "Brewing",
          completed: false,
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/courses/manual-brew",
        },
      ],
      hybridExam: {
        status: "not_started",
        theoryScore: 0,
        practicalCustomScore: 0,
        finalScore: 0,
        passed: false,
      },
      trainerRecommendation: "Dibutuhkan 1 sesi latihan terarah tambahan (remedial kalibrasi) sebelum mengambil ujian akhir hybrid.",
    },
  ],
};
