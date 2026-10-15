"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ShellNav from "@/components/ShellNav";

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

  const [newOutletName, setNewOutletName] = useState("");
  const [newOutletCity, setNewOutletCity] = useState("");
  const [newOutletAddress, setNewOutletAddress] = useState("");
  const [creatingOutlet, setCreatingOutlet] = useState(false);

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
      if (!res.ok) { setActionMessage(data.error || "Gagal membuat outlet."); return; }
      setActionMessage(`Outlet "${data.outlet.name}" berhasil ditambahkan.`);
      setOutlets((prev) => [...prev, data.outlet]);
      setNewOutletName(""); setNewOutletCity(""); setNewOutletAddress("");
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
      if (!res.ok) { setActionMessage(data.error || "Gagal mengirim undangan."); return; }
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
      if (!res.ok) { setActionMessage("Gagal membatalkan undangan."); return; }
      setActionMessage("Undangan berhasil dibatalkan.");
      setInvitations((prev) => prev.filter((i) => i.id !== inviteId));
    } catch {
      setActionMessage("Koneksi gagal saat membatalkan undangan.");
    }
  }

  const organization = overview?.organization;

  return (
    <div className="min-h-screen bg-paper-100 text-roast-950 flex flex-col">
      <ShellNav role="owner" orgId={orgId} orgName={organization?.display_name} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Organization Hero Card */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="section-label mb-1">
                Kemitraan Bisnis Kopi · Zona Waktu {organization?.timezone || "Asia/Jakarta"}
              </p>
              <h1 className="font-serif font-black text-2xl text-roast-950">
                {organization?.display_name || "Memuat Profil Bisnis..."}
              </h1>
              <p className="text-xs text-roast-500 mt-1 font-mono">
                Identitas Tenant: <span className="text-roast-700 font-semibold">{orgId}</span>
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Link href={`/org/${orgId}/learn`} className="btn-secondary text-xs py-2 px-3.5">
                Lihat Sebagai Barista
              </Link>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-paper-200">
            {[
              { label: "Total Outlet", value: overview?.outlets_count ?? 0, sub: "Cabang aktif" },
              { label: "Barista Aktif", value: overview?.active_learners_count ?? 0, sub: "Peserta terdaftar" },
              { label: "Head Bar / Spv", value: overview?.head_bars_count ?? 0, sub: "Supervisor tim" },
              { label: "Kelulusan Skill", value: `${overview?.competency_completion_rate ?? 0}%`, sub: "Standar industri" },
            ].map((kpi) => (
              <div key={kpi.label} className="p-4 bg-paper-50 rounded-xl border border-paper-200 shadow-subtle">
                <p className="text-[10px] uppercase tracking-widest font-mono text-roast-500 font-bold">{kpi.label}</p>
                <p className="text-2xl font-bold font-serif text-roast-950 mt-1">{kpi.value}</p>
                <p className="text-[11px] text-roast-400 mt-0.5 font-mono">{kpi.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div className="p-4 rounded-xl bg-paper-50 border border-paper-300 text-xs text-roast-900 flex items-center justify-between shadow-subtle">
            <span className="font-medium">{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-roast-500 hover:text-roast-900 ml-4 font-mono">
              Tutup
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-cherry-50 border border-cherry-200 text-xs text-cherry-900">
            {error}
          </div>
        )}

        {/* Generated Invite Token Banner */}
        {generatedInviteToken && (
          <div className="p-5 rounded-xl bg-paper-50 border border-paper-300 text-xs space-y-2 shadow-card">
            <p className="font-bold text-roast-950">Token Undangan Karyawan Berhasil Dibuat:</p>
            <p className="font-mono text-roast-900 select-all bg-white p-3 rounded-lg border border-paper-300 break-all text-xs font-semibold">
              {generatedInviteToken}
            </p>
            <p className="text-roast-600 leading-relaxed font-sans">
              Bagikan token ini kepada barista atau supervisor outlet untuk mengklaim akses ke portal pelatihan organisasi Anda.
            </p>
          </div>
        )}

        {/* Workspace Tab Navigation */}
        <div className="flex border-b border-paper-300 gap-6 text-sm">
          {(["overview", "outlets", "team"] as const).map((tab) => {
            const labels: Record<string, string> = {
              overview: `Ringkasan & Cohort (${cohorts.length})`,
              outlets: `Kelola Outlet (${outlets.length})`,
              team: `Undangan & Anggota Tim (${invitations.length})`,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3.5 font-medium transition-colors border-b-2 -mb-px text-xs font-mono uppercase tracking-wider ${
                  activeTab === tab
                    ? "border-roast-950 text-roast-950 font-bold"
                    : "border-transparent text-roast-500 hover:text-roast-800"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* TAB 1: COHORTS */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-serif font-bold text-lg text-roast-950 mb-4">Cohort Pelatihan Berjalan</h2>
              {cohorts.length === 0 ? (
                <div className="p-8 text-center text-roast-500 text-xs font-mono">
                  Belum ada kelompok pelatihan (cohort) yang dijadwalkan untuk organisasi ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {cohorts.map((cohort) => (
                    <div
                      key={cohort.id}
                      className="p-4 bg-paper-50 rounded-xl border border-paper-200 flex items-center justify-between shadow-subtle hover:border-paper-400 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="status-pill">{cohort.status}</span>
                          <span className="text-xs text-roast-500 font-mono">
                            Mulai: {new Date(cohort.start_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-roast-950">{cohort.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-roast-700 bg-white px-2.5 py-1 rounded border border-paper-200 font-semibold">
                          {cohort.participant_count ?? 1} Barista Terdaftar
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
            <div className="lg:col-span-2 space-y-3.5">
              <h2 className="font-serif font-bold text-lg text-roast-950 mb-2">Daftar Cabang &amp; Outlet</h2>
              {outlets.length === 0 ? (
                <div className="card p-8 text-center text-roast-500 text-xs font-mono">
                  Belum ada cabang outlet yang ditambahkan.
                </div>
              ) : (
                outlets.map((outlet) => (
                  <div key={outlet.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-mono text-roast-500 font-bold">
                          {outlet.city}
                        </span>
                        <h3 className="text-base font-semibold text-roast-950 mt-1">{outlet.name}</h3>
                        {outlet.address && (
                          <p className="text-xs text-roast-600 mt-1 font-sans">{outlet.address}</p>
                        )}
                      </div>
                      <span className="status-pill">{outlet.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Outlet Form */}
            <div className="card h-fit space-y-4">
              <div>
                <h2 className="font-serif font-bold text-base text-roast-950">Tambah Cabang Baru</h2>
                <p className="text-xs text-roast-500">Daftarkan outlet baru untuk penempatan barista</p>
              </div>
              <form onSubmit={handleCreateOutlet} className="space-y-4">
                <div>
                  <label className="label">Nama Outlet / Cabang *</label>
                  <input
                    type="text" required
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    placeholder="Contoh: Flagship Dago"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Kota *</label>
                  <input
                    type="text" required
                    value={newOutletCity}
                    onChange={(e) => setNewOutletCity(e.target.value)}
                    placeholder="Contoh: Bandung"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Alamat Lengkap</label>
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
                  className="btn-primary w-full text-xs py-2.5"
                >
                  {creatingOutlet ? "Menyimpan..." : "Simpan Cabang Outlet"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: TEAM & INVITATIONS */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3.5">
              <h2 className="font-serif font-bold text-lg text-roast-950 mb-2">Riwayat Undangan Anggota Tim</h2>
              {invitations.length === 0 ? (
                <div className="card p-8 text-center text-roast-500 text-xs font-mono">
                  Belum ada undangan yang dikirimkan.
                </div>
              ) : (
                invitations.map((invite) => (
                  <div key={invite.id} className="card flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="status-pill">{invite.intended_role}</span>
                        <span className="text-[10px] font-mono text-roast-500 uppercase">{invite.status}</span>
                      </div>
                      <p className="text-sm font-semibold text-roast-950 font-mono">{invite.email_normalized}</p>
                      <p className="text-xs text-roast-500 font-mono mt-0.5">
                        Dibuat: {new Date(invite.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                      </p>
                    </div>
                    {invite.status === "pending" && (
                      <button
                        onClick={() => handleRevokeInvitation(invite.id)}
                        className="btn-ghost text-xs text-roast-500 hover:text-cherry-700 font-mono"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Send Invite Form Card */}
            <div className="card h-fit space-y-4">
              <div>
                <h2 className="font-serif font-bold text-base text-roast-950">Undang Anggota Tim</h2>
                <p className="text-xs text-roast-500">Kirim undangan untuk barista atau supervisor</p>
              </div>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label className="label">Alamat Email Karyawan *</label>
                  <input
                    type="email" required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="barista@kopikamu.id"
                    className="input text-xs"
                  />
                </div>
                <div>
                  <label className="label">Peran Kerja (Role) *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input text-xs"
                  >
                    <option value="learner">Barista / Peserta Pelatihan</option>
                    <option value="head_bar">Head Bar / Supervisor Outlet</option>
                    <option value="client_manager">Manajer Operasional</option>
                    <option value="owner">Co-Owner (Pemilik)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Penugasan Outlet (Opsional)</label>
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
                  className="btn-primary w-full text-xs py-2.5"
                >
                  {inviting ? "Memproses Undangan..." : "Kirim Undangan Akses"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
