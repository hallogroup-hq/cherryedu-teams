"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShellNav from "@/components/ShellNav";
import MobileBottomNav from "@/components/MobileBottomNav";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Award,
  Flame,
  Coffee,
  Plus,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  X,
  Copy,
} from "lucide-react";

interface Organization {
  id: string;
  slug: string;
  display_name: string;
  legal_name?: string | null;
  business_category?: string | null;
  timezone: string;
}

interface Outlet {
  id: string;
  name: string;
  city: string;
  address?: string | null;
  status: string;
  staff_count?: number;
}

interface Cohort {
  id: string;
  name: string;
  start_at: string;
  end_at?: string | null;
  status: string;
  participant_count?: string | number;
}

interface Invitation {
  id: string;
  email_normalized: string;
  intended_role: string;
  outlet_id?: string | null;
  status: string;
  created_at: string;
}

interface BaristaRecord {
  id: string;
  name: string;
  email: string;
  outletId: string;
  outletName: string;
  role: string;
  completionPct: number;
  streakDays: number;
  todayCalibrated: boolean;
  dialInRatio: string;
  competencyStatus: string;
  avatarText: string;
  skills: {
    dialIn: number;
    milk: number;
    sensory: number;
    hygiene: number;
  };
}

const DEFAULT_BARISTAS: BaristaRecord[] = [
  {
    id: "budi-01",
    name: "Budi Pratama",
    email: "barista1@kopikamu.id",
    outletId: "out-senja-01",
    outletName: "Senja Braga",
    role: "Junior Barista",
    completionPct: 75,
    streakDays: 5,
    todayCalibrated: true,
    dialInRatio: "1:2.0 (18.0g → 36.0g @ 27s)",
    competencyStatus: "Siap Uji Praktikal (Level 3)",
    avatarText: "BP",
    skills: { dialIn: 85, milk: 80, sensory: 65, hygiene: 90 },
  },
  {
    id: "siti-02",
    name: "Siti Rahma",
    email: "barista2@kopikamu.id",
    outletId: "out-senja-02",
    outletName: "Senja Riau",
    role: "Senior Barista",
    completionPct: 100,
    streakDays: 14,
    todayCalibrated: true,
    dialInRatio: "1:2.0 (18.5g → 37.0g @ 28s)",
    competencyStatus: "Kompeten Terverifikasi (Level 4)",
    avatarText: "SR",
    skills: { dialIn: 95, milk: 95, sensory: 90, hygiene: 100 },
  },
  {
    id: "reza-03",
    name: "Reza Kurniawan",
    email: "barista3@kopikamu.id",
    outletId: "out-senja-03",
    outletName: "Senja Dago Giri",
    role: "Apprentice Barista",
    completionPct: 50,
    streakDays: 2,
    todayCalibrated: false,
    dialInRatio: "Belum Kalibrasi Pagi Ini",
    competencyStatus: "Latihan Terarah (Remedial)",
    avatarText: "RK",
    skills: { dialIn: 50, milk: 60, sensory: 40, hygiene: 75 },
  },
  {
    id: "dewi-04",
    name: "Dewi Lestari",
    email: "barista4@kopikamu.id",
    outletId: "out-senja-01",
    outletName: "Senja Braga",
    role: "Head Bar",
    completionPct: 90,
    streakDays: 9,
    todayCalibrated: true,
    dialInRatio: "1:2.1 (18.0g → 38.0g @ 26s)",
    competencyStatus: "Kompeten Terverifikasi (Level 3+)",
    avatarText: "DL",
    skills: { dialIn: 90, milk: 92, sensory: 88, hygiene: 95 },
  },
  {
    id: "fajar-05",
    name: "Fajar Ramadhan",
    email: "barista5@kopikamu.id",
    outletId: "out-senja-02",
    outletName: "Senja Riau",
    role: "Junior Barista",
    completionPct: 80,
    streakDays: 6,
    todayCalibrated: true,
    dialInRatio: "1:1.9 (18.0g → 35.0g @ 29s)",
    competencyStatus: "Sedang Belajar (Modul 3)",
    avatarText: "FR",
    skills: { dialIn: 80, milk: 85, sensory: 70, hygiene: 85 },
  },
];

export default function OwnerOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  
  // Navigation & Sub-filters
  const [activeTab, setActiveTab] = useState<"team" | "outlets" | "cohorts" | "invites">("team");
  const [selectedOutletFilter, setSelectedOutletFilter] = useState<string>("all");
  const [selectedBarista, setSelectedBarista] = useState<BaristaRecord | null>(null);

  // Modal States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("learner");
  const [inviteOutletId, setInviteOutletId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [generatedInviteToken, setGeneratedInviteToken] = useState<string | null>(null);

  // New Outlet Form State
  const [newOutletName, setNewOutletName] = useState("");
  const [newOutletCity, setNewOutletCity] = useState("");
  const [newOutletAddress, setNewOutletAddress] = useState("");
  const [creatingOutlet, setCreatingOutlet] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== 'undefined' ? localStorage.getItem('teams_auth_token') || '' : '';
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`/api/teams/organizations/${orgId}/overview`, {
          headers,
          credentials: 'same-origin',
        });
        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); return; }
          throw new Error("Gagal memuat overview organisasi.");
        }
        const data = await res.json();
        setOverview(data.overview);
        setOutlets(data.overview?.outlets || []);
        setCohorts(data.overview?.active_cohorts || []);

        const inviteRes = await fetch(`/api/teams/organizations/${orgId}/invitations`, {
          headers,
          credentials: 'same-origin',
        });
        if (inviteRes.ok) {
          const inviteData = await inviteRes.json();
          setInvitations(inviteData.invitations || []);
        }
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orgId, router]);

  // Filtered Barista list
  const filteredBaristas = selectedOutletFilter === "all"
    ? DEFAULT_BARISTAS
    : DEFAULT_BARISTAS.filter((b) => b.outletId === selectedOutletFilter);

  // Handle Send Invitation
  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setInviting(true);
      const res = await fetch(`/api/teams/organizations/${orgId}/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          outlet_id: inviteOutletId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim undangan.");
        return;
      }
      setGeneratedInviteToken(data.token);
      setInvitations((prev) => [data.invitation, ...prev]);
      setInviteEmail("");
      toast.success(`Undangan untuk ${data.invitation.email_normalized} siap dibagikan!`);
    } catch {
      toast.error("Koneksi gagal saat mengirim undangan.");
    } finally {
      setInviting(false);
    }
  }

  // Handle Revoke Invitation
  async function handleRevokeInvitation(inviteId: string) {
    try {
      const res = await fetch(`/api/teams/organizations/${orgId}/invitations?id=${inviteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Gagal membatalkan undangan.");
        return;
      }
      toast.success("Undangan berhasil dibatalkan.");
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {
      toast.error("Koneksi gagal saat membatalkan undangan.");
    }
  }

  // Handle Create Outlet
  async function handleCreateOutlet(e: React.FormEvent) {
    e.preventDefault();
    if (!newOutletName.trim() || !newOutletCity.trim()) return;
    try {
      setCreatingOutlet(true);
      const res = await fetch(`/api/teams/organizations/${orgId}/outlets`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newOutletName.trim(),
          city: newOutletCity.trim(),
          address: newOutletAddress.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Gagal membuat outlet.");
        return;
      }
      toast.success(`Outlet "${data.outlet.name}" berhasil ditambahkan.`);
      setOutlets((prev) => [...prev, data.outlet]);
      setNewOutletName(""); setNewOutletCity(""); setNewOutletAddress("");
    } catch {
      toast.error("Koneksi gagal saat menambahkan outlet.");
    } finally {
      setCreatingOutlet(false);
    }
  }

  // Export Barista Roster to CSV
  function handleExportCSV() {
    const headers = "ID,Nama,Email,Outlet,Peran,Progres_Kompetensi,Streak_Hari,Status_Kalibrasi,Status_Asesmen\n";
    const rows = DEFAULT_BARISTAS.map(
      (b) => `"${b.id}","${b.name}","${b.email}","${b.outletName}","${b.role}","${b.completionPct}%","${b.streakDays} Hari","${b.todayCalibrated ? 'Terkalibrasi' : 'Belum'}","${b.competencyStatus}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `roster-barista-${orgId}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV Roster Barista berhasil diunduh.");
  }

  const organization: Organization | undefined = overview?.organization;
  const calibratedTodayCount = DEFAULT_BARISTAS.filter((b) => b.todayCalibrated).length;

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="owner" orgId={orgId} orgName={organization?.display_name || "Kopi Senja Utama"} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-28 md:pb-12">
        
        {/* Top Hero Card */}
        <div className="card p-5 sm:p-6 bg-white border-paper-300 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-roast-500 font-bold">
                  Owner &amp; Multi-Outlet Dashboard
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-800 font-semibold">
                  3 Cabang Aktif
                </span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-roast-950">
                {organization?.display_name || "Kopi Senja Utama"}
              </h1>
              <p className="text-xs sm:text-sm text-roast-600 font-sans">
                Pantau kompetensi seduh barista, verifikasi kalibrasi harian, dan standarisasi rasa tiap cabang.
              </p>
            </div>

            {/* Header Fast Actions */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Undang Barista</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                title="Unduh laporan tim format CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ekspor CSV</span>
              </button>
              <Link
                href={`/org/${orgId}/learn`}
                className="btn-ghost text-xs py-2 px-2.5 text-roast-700 hover:text-roast-950 flex items-center gap-1 border border-paper-300 rounded-lg hover:bg-paper-50"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lihat Sebagai Barista</span>
              </Link>
            </div>
          </div>

          {/* KPI Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-paper-200">
            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold">Total Barista</span>
                <Users className="w-4 h-4 text-roast-400" />
              </div>
              <p className="text-2xl font-bold font-serif text-roast-950 mt-1">{DEFAULT_BARISTAS.length}</p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">Tersebar di 3 cabang</p>
            </div>

            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold">Kalibrasi Hari Ini</span>
                <Coffee className="w-4 h-4 text-cherry-700" />
              </div>
              <p className="text-2xl font-bold font-serif text-roast-950 mt-1">
                {calibratedTodayCount} <span className="text-sm font-sans font-normal text-roast-500">/ {DEFAULT_BARISTAS.length}</span>
              </p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">80% cabang siap seduh</p>
            </div>

            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold">Kelulusan Skill</span>
                <Award className="w-4 h-4 text-roast-600" />
              </div>
              <p className="text-2xl font-bold font-serif text-roast-950 mt-1">79%</p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">Standar Cherry Edu Level 3</p>
            </div>

            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-mono text-roast-500 font-bold">Streak Tim Tertinggi</span>
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold font-serif text-roast-950 mt-1">14 Hari</p>
              <p className="text-[11px] text-roast-500 font-mono mt-0.5">Siti Rahma (Senja Riau)</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-paper-300 gap-2 sm:gap-6 text-sm overflow-x-auto scrollbar-none">
          {[
            { key: "team", label: `Roster Barista (${DEFAULT_BARISTAS.length})` },
            { key: "outlets", label: `Daftar Cabang (${outlets.length || 3})` },
            { key: "cohorts", label: `Batch Pelatihan (${cohorts.length || 2})` },
            { key: "invites", label: `Undangan Tim (${invitations.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 px-1 font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-roast-950 text-roast-950 font-bold"
                  : "border-transparent text-roast-500 hover:text-roast-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: BARISTA ROSTER & TRACKER */}
        {activeTab === "team" && (
          <div className="space-y-4">
            
            {/* Multi-outlet Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-mono uppercase tracking-wider text-roast-500 font-bold shrink-0">
                Pilih Cabang:
              </span>
              {[
                { id: "all", label: `Semua Cabang (${DEFAULT_BARISTAS.length})` },
                { id: "out-senja-01", label: "Senja Braga (2)" },
                { id: "out-senja-02", label: "Senja Riau (2)" },
                { id: "out-senja-03", label: "Senja Dago Giri (1)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOutletFilter(opt.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-mono transition-all shrink-0 border ${
                    selectedOutletFilter === opt.id
                      ? "bg-roast-950 text-white border-roast-950 font-bold shadow-2xs"
                      : "bg-white text-roast-700 border-paper-300 hover:border-roast-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Baristas Cards Grid — Mobile-First */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredBaristas.map((barista) => (
                <div
                  key={barista.id}
                  onClick={() => setSelectedBarista(barista)}
                  className="card p-4 sm:p-5 bg-white border-paper-300 hover:border-roast-400 hover:shadow-subtle transition-all cursor-pointer space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-crema-200 border border-crema-300 text-roast-900 font-serif font-black flex items-center justify-center text-sm shrink-0">
                        {barista.avatarText}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base text-roast-950 leading-tight">
                            {barista.name}
                          </h3>
                        </div>
                        <p className="text-xs text-roast-500 font-mono mt-0.5">
                          {barista.outletName} · {barista.role}
                        </p>
                      </div>
                    </div>

                    {/* Circular Competency Meter */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="relative w-11 h-11 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            className="text-paper-200 stroke-current"
                            strokeWidth="3"
                            fill="none"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            className="text-cherry-800 stroke-current"
                            strokeWidth="3.2"
                            strokeDasharray={94.2}
                            strokeDashoffset={94.2 - (94.2 * barista.completionPct) / 100}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                        <span className="absolute font-mono font-bold text-[10px] text-roast-950">
                          {barista.completionPct}%
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-roast-400 uppercase mt-0.5">Skor Skill</span>
                    </div>
                  </div>

                  {/* Operational Status Badges */}
                  <div className="p-2.5 rounded-lg bg-paper-50 border border-paper-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-roast-600 font-sans">Kalibrasi Pagi:</span>
                      <span className={`text-[11px] font-mono font-bold ${
                        barista.todayCalibrated ? 'text-roast-900' : 'text-roast-500'
                      }`}>
                        {barista.dialInRatio}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-roast-600 font-sans">Streak Konsistensi:</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-700 font-bold">
                        <Flame className="w-3 h-3 fill-amber-500" />
                        {barista.streakDays} Hari Berturut-turut
                      </span>
                    </div>
                  </div>

                  {/* Skills Snapshot & CTA */}
                  <div className="flex items-center justify-between pt-1 border-t border-paper-200 text-xs">
                    <span className="text-[11px] font-mono text-roast-600 truncate max-w-[210px]">
                      {barista.competencyStatus}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cherry-800 font-bold">
                      Lihat Rincian <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: OUTLET MANAGEMENT */}
        {activeTab === "outlets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif font-bold text-lg text-roast-950">Cabang Terdaftar</h2>
                  <p className="text-xs text-roast-500">Standarisasi SOP dan mesin tiap cabang</p>
                </div>
                <span className="text-xs font-mono text-roast-500">{outlets.length || 3} Outlet Aktif</span>
              </div>

              {(outlets.length > 0 ? outlets : [
                { id: "out-senja-01", name: "Senja Braga Flagship", city: "Bandung", address: "Jl. Braga No. 45", status: "active", staff_count: 2 },
                { id: "out-senja-02", name: "Senja Riau", city: "Bandung", address: "Jl. LLRE Martadinata No. 88", status: "active", staff_count: 2 },
                { id: "out-senja-03", name: "Senja Dago Giri", city: "Bandung", address: "Jl. Dago Giri No. 12", status: "active", staff_count: 1 },
              ]).map((outlet) => (
                <div key={outlet.id} className="card p-4 sm:p-5 bg-white border-paper-300 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest font-mono text-roast-500 font-bold">
                          {outlet.city}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-paper-100 border border-paper-200 text-roast-700">
                          {outlet.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-roast-950 mt-1 font-serif">{outlet.name}</h3>
                      {outlet.address && (
                        <p className="text-xs text-roast-600 mt-0.5 font-sans">{outlet.address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-roast-900 bg-paper-100 px-2.5 py-1 rounded border border-paper-200">
                        {outlet.staff_count ?? 2} Barista
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Outlet Form */}
            <div className="card h-fit p-5 bg-white border-paper-300 space-y-4">
              <div>
                <h2 className="font-serif font-bold text-base text-roast-950">Tambah Cabang Baru</h2>
                <p className="text-xs text-roast-500">Perluas standarisasi ke lokasi baru</p>
              </div>
              <form onSubmit={handleCreateOutlet} className="space-y-3.5">
                <div>
                  <label className="label text-[11px]">Nama Cabang / Outlet *</label>
                  <input
                    type="text" required
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    placeholder="Contoh: Senja Sudirman"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-[11px]">Kota *</label>
                  <input
                    type="text" required
                    value={newOutletCity}
                    onChange={(e) => setNewOutletCity(e.target.value)}
                    placeholder="Contoh: Jakarta Selatan"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-[11px]">Alamat Lengkap</label>
                  <textarea
                    value={newOutletAddress}
                    onChange={(e) => setNewOutletAddress(e.target.value)}
                    placeholder="Jl. Jenderal Sudirman Kav. 25..."
                    className="input text-xs h-16"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingOutlet}
                  className="btn-primary w-full text-xs py-2.5"
                >
                  {creatingOutlet ? "Menyimpan..." : "Simpan Cabang Baru"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: COHORTS */}
        {activeTab === "cohorts" && (
          <div className="space-y-4">
            <div className="card p-5 bg-white border-paper-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-serif font-bold text-lg text-roast-950">Batch Pelatihan Terjadwal</h2>
                  <p className="text-xs text-roast-500">Kelompok pembelajaran terstruktur dengan instruktur resmi</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: "coh-senja-barista-01",
                    name: "Batch Barista Standarisasi Q1",
                    start_at: "2026-04-01T08:00:00Z",
                    end_at: "2026-05-30T17:00:00Z",
                    status: "active",
                    participant_count: 5,
                    trainer: "Dimas Trainer (Instruktur Resmi Cherry Edu)",
                    curriculum: "Kurikulum Barista & Kalibrasi Seduh Profesional (v1)",
                  },
                  {
                    id: "coh-senja-brew-02",
                    name: "Batch Kalibrasi Sensori & Manual Brew",
                    start_at: "2026-04-15T08:00:00Z",
                    end_at: "2026-06-01T17:00:00Z",
                    status: "active",
                    participant_count: 2,
                    trainer: "Dimas Trainer (Instruktur Resmi Cherry Edu)",
                    curriculum: "Manual Brewing & Sensorik Lanjut (v1)",
                  },
                ].map((cohort) => (
                  <div
                    key={cohort.id}
                    className="p-4 bg-paper-50 rounded-xl border border-paper-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-crema-100 border border-crema-300 text-roast-800 font-bold uppercase">
                          {cohort.status}
                        </span>
                        <span className="text-xs text-roast-500 font-mono">
                          Mulai: {new Date(cohort.start_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-roast-950 font-serif">{cohort.name}</h3>
                      <p className="text-xs text-roast-600 font-sans">{cohort.curriculum}</p>
                      <p className="text-xs text-roast-500 font-mono">Instruktur: {cohort.trainer}</p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span className="text-xs font-mono text-roast-900 bg-white px-3 py-1.5 rounded-lg border border-paper-300 font-bold inline-block">
                        {cohort.participant_count} Barista Aktif
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INVITATIONS */}
        {activeTab === "invites" && (
          <div className="space-y-4">
            <div className="card p-5 bg-white border-paper-300 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif font-bold text-lg text-roast-950">Riwayat Undangan Akses</h2>
                  <p className="text-xs text-roast-500">Kelola token aktivasi akun untuk barista baru</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Undangan Baru</span>
                </button>
              </div>

              {invitations.length === 0 ? (
                <div className="p-8 text-center text-roast-500 text-xs font-mono bg-paper-50 rounded-xl border border-paper-200">
                  Belum ada riwayat undangan. Klik tombol &ldquo;Buat Undangan Baru&rdquo; untuk mengirim akses ke tim Anda.
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="p-3.5 bg-paper-50 rounded-xl border border-paper-200 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-paper-300 text-roast-700 font-bold uppercase">
                            {invite.intended_role}
                          </span>
                          <span className="text-[10px] font-mono text-roast-500 uppercase">{invite.status}</span>
                        </div>
                        <p className="text-sm font-semibold text-roast-950 font-mono">{invite.email_normalized}</p>
                        <p className="text-[11px] text-roast-500 font-mono mt-0.5">
                          Dikirim: {new Date(invite.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        </p>
                      </div>
                      {invite.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleRevokeInvitation(invite.id)}
                          className="btn-ghost text-xs text-roast-500 hover:text-cherry-800 font-mono"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: BARISTA DETAIL INSPECTOR */}
      {selectedBarista && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-roast-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="card max-w-lg w-full bg-white p-6 rounded-2xl shadow-elevated border border-paper-300 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-crema-200 border border-crema-300 text-roast-900 font-serif font-black flex items-center justify-center text-lg">
                  {selectedBarista.avatarText}
                </div>
                <div>
                  <h3 className="font-serif font-black text-xl text-roast-950">{selectedBarista.name}</h3>
                  <p className="text-xs text-roast-500 font-mono">
                    {selectedBarista.outletName} · {selectedBarista.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBarista(null)}
                className="text-roast-400 hover:text-roast-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Radar / Skills Progress */}
            <div className="p-4 rounded-xl bg-paper-50 border border-paper-200 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-roast-500 font-bold">
                Penguasaan Kriteria Barista (Cherry Edu Rubrik)
              </p>

              <div className="space-y-2.5">
                {[
                  { label: "Dial-In & Rasio Seduh Espresso", val: selectedBarista.skills.dialIn },
                  { label: "Microfoam Steaming & Latte Art", val: selectedBarista.skills.milk },
                  { label: "Kalibrasi Rasa & Evaluasi Sensori", val: selectedBarista.skills.sensory },
                  { label: "Alur Kerja, Sanitasi & Bar Hygiene", val: selectedBarista.skills.hygiene },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-roast-800 font-medium">{s.label}</span>
                      <span className="font-mono font-bold text-roast-950">{s.val}%</span>
                    </div>
                    <div className="w-full bg-paper-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-roast-950 h-full rounded-full transition-all"
                        style={{ width: `${s.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calibration Record */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-paper-200">
                <span className="text-roast-500 font-mono">Kalibrasi Pagi Ini</span>
                <span className="font-mono font-bold text-roast-950">{selectedBarista.dialInRatio}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-paper-200">
                <span className="text-roast-500 font-mono">Konsistensi Streak</span>
                <span className="font-mono font-bold text-amber-700">{selectedBarista.streakDays} Hari Beruntun</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-roast-500 font-mono">Status Kompetensi</span>
                <span className="font-mono font-bold text-roast-900">{selectedBarista.competencyStatus}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.success(`Pengingat kalibrasi berhasil dikirim ke ${selectedBarista.name}`);
                  setSelectedBarista(null);
                }}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Kirim Pengingat Kalibrasi
              </button>
              <Link
                href={`/org/${orgId}/learn`}
                className="btn-primary flex-1 text-xs py-2.5 text-center"
              >
                Buka Silabus
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INVITE EMPLOYEE */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-roast-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="card max-w-md w-full bg-white p-6 rounded-2xl shadow-elevated border border-paper-300 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-paper-200 pb-3">
              <div>
                <h3 className="font-serif font-black text-lg text-roast-950">Undang Barista / Staf</h3>
                <p className="text-xs text-roast-500">Berikan akses ke platform pelatihan tim</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setGeneratedInviteToken(null);
                }}
                className="text-roast-400 hover:text-roast-900 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Token Display */}
            {generatedInviteToken ? (
              <div className="space-y-3 p-4 bg-paper-50 rounded-xl border border-paper-300 text-xs">
                <div className="flex items-center gap-2 text-roast-950 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-roast-900" />
                  <span>Token Undangan Berhasil Dibuat</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-paper-300 font-mono text-[11px] text-roast-900 break-all select-all flex items-center justify-between gap-2">
                  <span>{generatedInviteToken}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteToken);
                      toast.success("Token berhasil disalin ke clipboard!");
                    }}
                    className="p-1 text-roast-600 hover:text-roast-950"
                    title="Salin token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-roast-600 text-[11px] leading-relaxed">
                  Bagikan token ini ke barista untuk mengklaim akses di halaman login.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteModalOpen(false);
                    setGeneratedInviteToken(null);
                  }}
                  className="btn-primary w-full text-xs py-2 mt-2"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvitation} className="space-y-3.5">
                <div>
                  <label className="label text-[11px]">Email Staf / Barista *</label>
                  <input
                    type="email" required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="nama@kopikamu.id"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-[11px]">Peran Kerja *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="learner">Barista / Peserta Pelatihan</option>
                    <option value="head_bar">Head Bar / Supervisor Cabang</option>
                    <option value="client_manager">Manajer Operasional</option>
                  </select>
                </div>
                <div>
                  <label className="label text-[11px]">Penugasan Cabang</label>
                  <select
                    value={inviteOutletId}
                    onChange={(e) => setInviteOutletId(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="">Semua Cabang / Rotasi</option>
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.city})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviting}
                  className="btn-primary w-full text-xs py-2.5 mt-2"
                >
                  {inviting ? "Memproses..." : "Kirim Undangan Akses"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation for Owner */}
      <MobileBottomNav role="owner" orgId={orgId} />
    </div>
  );
}
