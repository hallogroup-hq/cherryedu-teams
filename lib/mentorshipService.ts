/**
 * Cherry Edu Teams — Program Mentorship 1 Bulan Hybrid untuk Coffee Shop
 * 
 * Standar Service 1 Bulan untuk Coffee Shop:
 * 1. R&D (Audit Bar, Resep & SOP Mesin)
 * 2. Mentorship Hybrid:
 *    2.1 Fundamental (Materi online di edu.cherrycoffeeroastery.com)
 *    2.2 Teknik (Sesi Praktik Tatap Muka di Bar)
 *    2.3 Espresso Base (Sesi Praktik Dial-In & Sensori di Bar)
 *    2.4 Class (Min. 3 Path Spesialisasi dari Cherry Edu)
 *    2.5 Ujian (Hybrid Exam: Teori Online + Studi Kasus Mesin Kafe)
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
    url: string;
  };
  fundamentalBaristaPath: {
    completed: boolean;
    progressPct: number;
    finalExamPassed: boolean;
    examScore?: number;
    lastAccessed?: string;
    url: string;
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
    theoryScore: number; // Dari materi online
    practicalCustomScore: number; // Soal khusus trainer
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
    sopDocumentUrl: "https://edu.cherrycoffeeroastery.com/paths/barista-specialization",
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
        url: "https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir",
      },
      fundamentalBaristaPath: {
        completed: true,
        progressPct: 100,
        finalExamPassed: true,
        examScore: 92,
        lastAccessed: "2026-04-10",
        url: "https://edu.cherrycoffeeroastery.com/paths/barista-specialization",
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
          pathId: "path-barista",
          title: "Professional Barista Specialization",
          category: "Barista Skills",
          completed: true,
          score: 92,
          completedAt: "2026-04-10",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/barista-specialization",
        },
        {
          pathId: "path-home-brewer",
          title: "Manual Brewing & Water Chemistry",
          category: "Brewing",
          completed: true,
          score: 86,
          completedAt: "2026-04-12",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/home-brewer-specialization",
        },
        {
          pathId: "path-foundation",
          title: "Foundation: Kopi dari Hulu ke Hilir",
          category: "Foundation",
          completed: true,
          score: 88,
          completedAt: "2026-04-06",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir",
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
        url: "https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir",
      },
      fundamentalBaristaPath: {
        completed: true,
        progressPct: 100,
        finalExamPassed: true,
        examScore: 98,
        lastAccessed: "2026-04-07",
        url: "https://edu.cherrycoffeeroastery.com/paths/barista-specialization",
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
          pathId: "path-barista",
          title: "Professional Barista Specialization",
          category: "Barista Skills",
          completed: true,
          score: 98,
          completedAt: "2026-04-07",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/barista-specialization",
        },
        {
          pathId: "path-foundation",
          title: "Foundation: Kopi dari Hulu ke Hilir",
          category: "Foundation",
          completed: true,
          score: 96,
          completedAt: "2026-04-04",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir",
        },
        {
          pathId: "path-home-brewer",
          title: "Manual Brewing & Water Chemistry",
          category: "Brewing",
          completed: true,
          score: 94,
          completedAt: "2026-04-11",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/home-brewer-specialization",
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
        url: "https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir",
      },
      fundamentalBaristaPath: {
        completed: false,
        progressPct: 65,
        finalExamPassed: false,
        lastAccessed: "2026-04-13",
        url: "https://edu.cherrycoffeeroastery.com/paths/barista-specialization",
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
          pathId: "path-foundation",
          title: "Foundation: Kopi dari Hulu ke Hilir",
          category: "Foundation",
          completed: true,
          score: 78,
          completedAt: "2026-04-09",
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/kopi-dari-hulu-ke-hilir",
        },
        {
          pathId: "path-barista",
          title: "Professional Barista Specialization",
          category: "Barista Skills",
          completed: false,
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/barista-specialization",
        },
        {
          pathId: "path-home-brewer",
          title: "Manual Brewing & Water Chemistry",
          category: "Brewing",
          completed: false,
          cherryEduUrl: "https://edu.cherrycoffeeroastery.com/paths/home-brewer-specialization",
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

export interface ScenarioChallenge {
  id: string;
  title: string;
  category: 'extraction' | 'milk' | 'workflow' | 'sensory';
  categoryLabel: string;
  scenario: string;
  symptom: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export const DEMO_SCENARIOS: ScenarioChallenge[] = [
  {
    id: 'sc-01',
    title: 'Ekstraksi Terlalu Cepat & Asam Menusuk',
    category: 'extraction',
    categoryLabel: 'Dinamika Ekstraksi',
    scenario: 'Saat membuka shift pagi di kedai, espresso pertama kamu mengalir sangat deras (17 detik menghasilkan 38 gram). Crema tampak pucat, tipis, dan rasa kopi terasa sangat tajam/asam di samping lidah.',
    symptom: 'Waktu ekstraksi 17 detik (target 26-28 detik), rasa asam mentah (sour under-extraction).',
    options: [
      {
        id: 'opt-a',
        text: 'Kurangi dosis kopi dari 18.0g menjadi 16.0g agar beban portafilter lebih ringan.',
        isCorrect: false,
        explanation: 'Mengurangi dosis justru akan mempercepat aliran air karena cake kopi semakin tipis dan resistensi menurun drastis.',
      },
      {
        id: 'opt-b',
        text: 'Haluskan ukuran gilingan (grind finer) 1–2 tingkat dan ratakan distribusi bubuk kopi dengan WDT.',
        isCorrect: true,
        explanation: 'Tepat. Menggiling lebih halus mempersempit celah antar-partikel, menaikkan resistensi air sehingga waktu kontak air dan kopi mencapai rentang ideal (25-30 detik) dan mengekstraksi rasa manis alami kopi.',
      },
      {
        id: 'opt-c',
        text: 'Tekan tamping dua kali sekuat tenaga dengan berat badan.',
        isCorrect: false,
        explanation: 'Kepadatan tamping memiliki batas maksimal (biasanya 15-20 kg). Menekan berlebihan tidak bisa mengompensasi ukuran gilingan yang terlalu kasar dan berisiko mencederai pergelangan tangan.',
      },
    ],
  },
  {
    id: 'sc-02',
    title: 'Busa Susu Kasar & Cepat Terpisah pada Cappuccino',
    category: 'milk',
    categoryLabel: 'Teknik Texturing Susu',
    scenario: 'Saat menyajikan cappuccino untuk pelanggan, permukaan susu tampak memiliki gelembung-gelembung besar yang mudah pecah, dan lapisan busa terpisah dari cairan susu hanya dalam 1 menit.',
    symptom: 'Busa kasar (dry foam), suhu pitcher terasa sangat panas membakar tangan (>75°C).',
    options: [
      {
        id: 'opt-a',
        text: 'Tarik tip steam wand keluar dari susu di akhir proses saat susu sudah mendidih.',
        isCorrect: false,
        explanation: 'Menarik wand saat susu panas justru merusak struktur busa dan membuat susu meletup membakar tangan barista.',
      },
      {
        id: 'opt-b',
        text: 'Selesaikan peregangan udara (stretching) di awal saat susu dingin (<38°C), lalu benamkan tip sedikit untuk pusaran (rolling) hingga suhu 60–65°C.',
        isCorrect: true,
        explanation: 'Tepat. Protein susu (kasein & whey) hanya bisa mengikat udara dengan stabil saat dingin. Di atas 65°C protein terdenaturasi dan gula laktosa kehilangan rasa manis alaminya.',
      },
      {
        id: 'opt-c',
        text: 'Biarkan pitcher diam di atas meja tanpa dipegang selama proses steam.',
        isCorrect: false,
        explanation: 'Tangan barista berfungsi sebagai sensor termal penting untuk merasakan perubahan suhu susu secara real-time.',
      },
    ],
  },
  {
    id: 'sc-03',
    title: 'Channeling & Rasa Pahit Sepet (Astringent)',
    category: 'workflow',
    categoryLabel: 'SOP Bar & Distribusi',
    scenario: 'Saat ekstraksi dengan bottomless portafilter, terlihat semburan cairan halus (jet spray) memancar ke samping, dan espresso di cangkir meninggalkan rasa kering/sepet di bagian belakang tenggorokan.',
    symptom: 'Channeling lokal: air mengalir tidak merata menembus jalur terlemah di dalam portafilter.',
    options: [
      {
        id: 'opt-a',
        text: 'Lakukan distribusi jarum (WDT) dari dasar basket secara melingkar dan pastikan tamping benar-benar datar tegak lurus 90 derajat.',
        isCorrect: true,
        explanation: 'Tepat. Channeling disebabkan gumpalan bubuk atau distribusi tidak rata yang menciptakan celah air bertekanan tinggi. Area celah mengalami over-extraction parah (penyebab rasa kering/astringent).',
      },
      {
        id: 'opt-b',
        text: 'Ketuk portafilter keras-keras dengan tamper logam ke sisi kuping portafilter.',
        isCorrect: false,
        explanation: 'Mengetuk dinding portafilter setelah bubuk rata justru memecahkan ikatan cake kopi di pinggir keranjang (side channeling).',
      },
      {
        id: 'opt-c',
        text: 'Ganti biji kopi dengan varietas yang berbeda.',
        isCorrect: false,
        explanation: 'Masalah ini berkaitan dengan mekanika persiapan portafilter (puck preparation), bukan kualitas green bean atau roast profile.',
      },
    ],
  },
];

export interface CoffeeExperiment {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  steps: string[];
  parameterA: { label: string; value: string };
  parameterB: { label: string; value: string };
  expectedInsight: string;
}

export const DEMO_EXPERIMENTS: CoffeeExperiment[] = [
  {
    id: 'exp-01',
    title: 'Eksperimen Rasio: Ristretto vs Normale vs Lungo',
    subtitle: 'Sensori Perbandingan Hasil Ekstraksi',
    objective: 'Memahami bagaimana yield (cairan hasil) mengubah persepsi keasaman, rasa manis, dan kepahitan kopi.',
    steps: [
      'Gunakan dosis tetap 18.0g kopi House Blend Cherry Edu.',
      'Ekstraksi Cangkir 1 (Ristretto): Hentikan di 27.0g (rasio 1:1.5).',
      'Ekstraksi Cangkir 2 (Normale): Hentikan di 36.0g (rasio 1:2.0).',
      'Ekstraksi Cangkir 3 (Lungo): Hentikan di 45.0g (rasio 1:2.5).',
      'Cicipi berdampingan dan catat perbedaan body serta aftertaste.',
    ],
    parameterA: { label: 'Ristretto (1:1.5)', value: 'Tinggi body, asam pekat, aftertaste pendek' },
    parameterB: { label: 'Normale (1:2.0)', value: 'Seimbang, manis karamel maksimal, bersih' },
    expectedInsight: 'Semakin panjang rasio yield, semakin banyak komponen pahit larut. Rasio 1:2.0 merupakan standar calibrated recipe kedai Aroma Kopi.',
  },
  {
    id: 'exp-02',
    title: 'Uji Distribusi: Tamping Langsung vs WDT Needle',
    subtitle: 'Stabilitas Aliran & Reduksi Channeling',
    objective: 'Membuktikan secara visual pengaruh de-clumping bubuk kopi terhadap konsistensi ekstraksi.',
    steps: [
      'Giling 18.0g kopi ke dalam portafilter.',
      'Shot 1: Ratakan dengan jari permukaan saja, lalu tamping dan ekstrak.',
      'Shot 2: Aduk merata dari dasar basket dengan WDT tool selama 5 detik, lalu tamping datar.',
      'Bandingkan waktu shot dan kestabilan aliran cairan di cangkir.',
    ],
    parameterA: { label: 'Tanpa WDT', value: 'Aliran tidak stabil, variasi waktu ±4 detik antar shot' },
    parameterB: { label: 'Dengan WDT', value: 'Aliran halus terpusat, konsisten di 27 detik ±1s' },
    expectedInsight: 'WDT memecah gumpalan statis dari grinder, menyamakan kepadatan di seluruh basket, dan menghilangkan channeling.',
  },
];

