"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  const [activeTab, setActiveTab] = useState<"overview" | "outlets" | "team">("overview");

  // Add Outlet Form State
  const [newOutletName, setNewOutletName] = useState("");
  const [newOutletCity, setNewOutletCity] = useState("");
  const [newOutletAddress, setNewOutletAddress] = useState("");
  const [creatingOutlet, setCreatingOutlet] = useState(false);

  // Invite Member Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("learner");
  const [inviteOutletId, setInviteOutletId] = useState("");
  const [inviting, setInviting] = useState(false);
  const [generatedInviteToken, setGeneratedInviteToken] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Overview metrics
        const res = await fetch(`/api/teams/organizations/${orgId}/overview`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Gagal memuat overview organisasi.");
        }
        const data = await res.json();
        setOverview(data.overview);
        setOutlets(data.overview.outlets || []);
        setCohorts(data.overview.active_cohorts || []);

        // 2. Fetch Invitations
        const inviteRes = await fetch(`/api/teams/organizations/${orgId}/invitations`);
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

  async function handleCreateOutlet(e: React.FormEvent) {
    e.preventDefault();
    if (!newOutletName.trim() || !newOutletCity.trim()) return;

    try {
      setCreatingOutlet(true);
      setActionMessage(null);

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
        setActionMessage(data.error || "Gagal membuat outlet.");
        return;
      }

      setActionMessage(`Outlet "${data.outlet.name}" berhasil ditambahkan.`);
      setOutlets((prev) => [...prev, data.outlet]);
      setNewOutletName("");
      setNewOutletCity("");
      setNewOutletAddress("");
    } catch {
      setActionMessage("Koneksi gagal saat menambahkan outlet.");
    } finally {
      setCreatingOutlet(false);
    }
  }

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviting(true);
      setActionMessage(null);
      setGeneratedInviteToken(null);

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
        setActionMessage(data.error || "Gagal mengirim undangan.");
        return;
      }

      setActionMessage(`Undangan untuk ${data.invitation.email_normalized} berhasil dibuat.`);
      setGeneratedInviteToken(data.token);
      setInvitations((prev) => [data.invitation, ...prev]);
      setInviteEmail("");
    } catch {
      setActionMessage("Koneksi gagal saat mengirim undangan.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeInvitation(inviteId: string) {
    try {
      setActionMessage(null);
      const res = await fetch(`/api/teams/organizations/${orgId}/invitations?id=${inviteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setActionMessage("Gagal membatalkan undangan.");
        return;
      }

      setActionMessage("Undangan berhasil dibatalkan.");
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {
      setActionMessage("Koneksi gagal saat membatalkan undangan.");
    }
  }

  const organization = overview?.organization;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-white hover:text-slate-300">
            Cherry Edu <span className="text-zinc-400">Teams</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            Portal Pemilik & Manajemen
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>{organization?.display_name || "Organisasi"}</span>
          <Link href="/login" className="hover:text-slate-200">
            Keluar
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Organization Hero */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-mono text-zinc-400 mb-1">
                Bisnis Kopi Terdaftar &middot; Zona Waktu {organization?.timezone || "Asia/Jakarta"}
              </p>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {organization?.display_name || "Memuat Organisasi..."}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                ID Tenant: <span className="font-mono text-slate-500">{orgId}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/org/${orgId}/learn`}
                className="btn-secondary text-xs py-2 px-3"
              >
                Buka Portal Barista
              </Link>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-500 font-mono">Total Outlet</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">{overview?.outlets_count ?? 0}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-500 font-mono">Barista Aktif</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">{overview?.active_learners_count ?? 0}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-500 font-mono">Head Bar / Supervisor</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">{overview?.head_bars_count ?? 0}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-xs text-slate-500 font-mono">Kelulusan Kompetensi</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">{overview?.competency_completion_rate ?? 0}%</p>
            </div>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
              Tutup
            </button>
          </div>
        )}

        {/* Generated Token Banner */}
        {generatedInviteToken && (
          <div className="mb-6 p-4 rounded-lg bg-slate-900 border border-slate-700 text-xs space-y-1">
            <p className="font-semibold text-white">Token Undangan Berhasil Dibuat:</p>
            <p className="font-mono text-zinc-300 select-all bg-slate-950 p-2 rounded border border-slate-800">
              {generatedInviteToken}
            </p>
            <p className="text-slate-500 text-xs">
              Kirimkan token ini kepada karyawan untuk klaim akses di portal undangan.
            </p>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-6 text-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "overview"
                ? "border-zinc-200 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Ringkasan & Cohort ({cohorts.length})
          </button>
          <button
            onClick={() => setActiveTab("outlets")}
            className={`pb-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "outlets"
                ? "border-zinc-200 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Kelola Outlet ({outlets.length})
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`pb-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "team"
                ? "border-zinc-200 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            Undang & Kelola Tim ({invitations.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & COHORTS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">Cohort Pelatihan Aktif</h2>
              {cohorts.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada cohort yang dijadwalkan.</p>
              ) : (
                <div className="space-y-3">
                  {cohorts.map((cohort) => (
                    <div key={cohort.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-zinc-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 uppercase">
                            {cohort.status}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            Mulai: {new Date(cohort.start_at).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-white">{cohort.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-slate-400">
                          {cohort.participant_count ?? 1} Peserta Terdaftar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OUTLET MANAGEMENT */}
        {activeTab === "outlets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Outlets List */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-base font-semibold text-white mb-2">Daftar Outlet</h2>
              {outlets.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada outlet yang ditambahkan.</p>
              ) : (
                outlets.map((outlet) => (
                  <div key={outlet.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {outlet.city}
                        </span>
                        <h3 className="text-sm font-semibold text-white mt-2">{outlet.name}</h3>
                        {outlet.address && (
                          <p className="text-xs text-slate-400 mt-1">{outlet.address}</p>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {outlet.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Outlet Form */}
            <div className="card h-fit">
              <h2 className="text-base font-semibold text-white mb-4">Tambah Outlet Baru</h2>
              <form onSubmit={handleCreateOutlet} className="space-y-4">
                <div>
                  <label className="label text-xs">Nama Outlet *</label>
                  <input
                    type="text"
                    required
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    placeholder="Contoh: Flagship Dago"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-xs">Kota *</label>
                  <input
                    type="text"
                    required
                    value={newOutletCity}
                    onChange={(e) => setNewOutletCity(e.target.value)}
                    placeholder="Contoh: Bandung"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-xs">Alamat Lengkap</label>
                  <textarea
                    value={newOutletAddress}
                    onChange={(e) => setNewOutletAddress(e.target.value)}
                    placeholder="Jl. Ir. H. Juanda No. 100..."
                    className="input text-xs h-20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingOutlet}
                  className="btn-primary w-full text-xs py-2 bg-zinc-200 text-slate-950 hover:bg-white"
                >
                  {creatingOutlet ? "Menyimpan..." : "Simpan Outlet"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: TEAM & INVITATIONS */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invitations List */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-base font-semibold text-white mb-2">Riwayat Undangan Tim</h2>
              {invitations.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada undangan yang dikirim.</p>
              ) : (
                invitations.map((invite) => (
                  <div key={invite.id} className="card flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-zinc-300">
                          {invite.intended_role}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          Status: {invite.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{invite.email_normalized}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dibuat: {new Date(invite.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>

                    {invite.status === "pending" && (
                      <button
                        onClick={() => handleRevokeInvitation(invite.id)}
                        className="btn-ghost text-xs text-slate-400 hover:text-white"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Send Invite Form */}
            <div className="card h-fit">
              <h2 className="text-base font-semibold text-white mb-4">Undang Anggota Tim</h2>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label className="label text-xs">Email Karyawan *</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="barista@kopikamu.id"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label text-xs">Peran (Role) *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="learner">Barista / Peserta Pelatihan (Learner)</option>
                    <option value="head_bar">Head Bar / Supervisor Outlet</option>
                    <option value="client_manager">Manajer Operasional</option>
                    <option value="owner">Co-Owner (Pemilik)</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Penugasan Outlet (Opsional)</label>
                  <select
                    value={inviteOutletId}
                    onChange={(e) => setInviteOutletId(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="">Semua Outlet / Belum Ditugaskan</option>
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
                  className="btn-primary w-full text-xs py-2 bg-zinc-200 text-slate-950 hover:bg-white"
                >
                  {inviting ? "Mengirim Undangan..." : "Kirim Undangan"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
