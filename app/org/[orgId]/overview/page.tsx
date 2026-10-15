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

        const res = await fetch(`/api/teams/organizations/${orgId}/overview`);
        if (!res.ok) {
          if (res.status === 401) { router.push("/login"); return; }
          throw new Error("Gagal memuat overview organisasi.");
        }
        const data = await res.json();
        setOverview(data.overview);
        setOutlets(data.overview.outlets || []);
        setCohorts(data.overview.active_cohorts || []);

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
    <div className="min-h-screen bg-roast-950 text-roast-100 flex flex-col">
      <ShellNav role="owner" orgId={orgId} orgName={organization?.display_name} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Organization Hero */}
        <div className="card mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="section-label mb-1">
                Bisnis Kopi Terdaftar · {organization?.timezone || "Asia/Jakarta"}
              </p>
              <h1 className="font-serif font-bold text-2xl text-paper-100">
                {organization?.display_name || "Memuat Organisasi..."}
              </h1>
              <p className="text-xs text-roast-500 mt-1 font-mono">ID: {orgId}</p>
            </div>
            <div className="shrink-0">
              <Link href={`/org/${orgId}/learn`} className="btn-secondary text-xs py-2 px-3">
                Portal Barista
              </Link>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-roast-800">
            {[
              { label: "Total Outlet", value: overview?.outlets_count ?? 0 },
              { label: "Barista Aktif", value: overview?.active_learners_count ?? 0 },
              { label: "Head Bar", value: overview?.head_bars_count ?? 0 },
              { label: "Kelulusan", value: `${overview?.competency_completion_rate ?? 0}%` },
            ].map((kpi) => (
              <div key={kpi.label} className="p-3 bg-roast-950 rounded-lg border border-roast-800">
                <p className="text-[10px] uppercase tracking-widest font-mono text-roast-500">{kpi.label}</p>
                <p className="text-2xl font-bold font-mono text-paper-100 mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className="mb-6 p-4 rounded-lg bg-roast-900 border border-roast-700 text-xs text-roast-200 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="text-roast-500 hover:text-paper-100 ml-4">Tutup</button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-cherry-950 border border-cherry-900 text-xs text-cherry-300">{error}</div>
        )}

        {/* Invite Token Banner */}
        {generatedInviteToken && (
          <div className="mb-6 p-4 rounded-lg bg-roast-900 border border-roast-700 text-xs space-y-1.5">
            <p className="font-semibold text-paper-100">Token Undangan Berhasil Dibuat:</p>
            <p className="font-mono text-paper-300 select-all bg-roast-950 p-2 rounded border border-roast-800 break-all">
              {generatedInviteToken}
            </p>
            <p className="text-roast-500">Kirimkan token ini kepada karyawan untuk klaim akses di portal undangan.</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-roast-800 mb-6 gap-6 text-sm">
          {(["overview", "outlets", "team"] as const).map((tab) => {
            const labels: Record<string, string> = {
              overview: `Ringkasan & Cohort (${cohorts.length})`,
              outlets: `Outlet (${outlets.length})`,
              team: `Undangan Tim (${invitations.length})`,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 font-medium transition-colors border-b-2 -mb-px text-sm ${
                  activeTab === tab
                    ? "border-cherry-700 text-paper-100"
                    : "border-transparent text-roast-500 hover:text-roast-300"
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
              <h2 className="font-serif font-bold text-base text-paper-100 mb-4">Cohort Pelatihan Aktif</h2>
              {cohorts.length === 0 ? (
                <p className="text-xs text-roast-500">Belum ada cohort yang dijadwalkan.</p>
              ) : (
                <div className="space-y-3">
                  {cohorts.map((cohort) => (
                    <div
                      key={cohort.id}
                      className="p-4 bg-roast-950 rounded-lg border border-roast-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="status-pill">{cohort.status}</span>
                          <span className="text-xs text-roast-600 font-mono">
                            {new Date(cohort.start_at).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-paper-100">{cohort.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-roast-400">
                          {cohort.participant_count ?? 1} Peserta
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OUTLETS */}
        {activeTab === "outlets" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <h2 className="font-serif font-bold text-base text-paper-100 mb-2">Daftar Outlet</h2>
              {outlets.length === 0 ? (
                <p className="text-xs text-roast-500">Belum ada outlet yang ditambahkan.</p>
              ) : (
                outlets.map((outlet) => (
                  <div key={outlet.id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-mono text-roast-500">
                          {outlet.city}
                        </span>
                        <h3 className="text-sm font-semibold text-paper-100 mt-1">{outlet.name}</h3>
                        {outlet.address && (
                          <p className="text-xs text-roast-400 mt-1">{outlet.address}</p>
                        )}
                      </div>
                      <span className="status-pill">{outlet.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Outlet Form */}
            <div className="card h-fit">
              <h2 className="font-serif font-bold text-base text-paper-100 mb-4">Tambah Outlet Baru</h2>
              <form onSubmit={handleCreateOutlet} className="space-y-4">
                <div>
                  <label className="label">Nama Outlet *</label>
                  <input
                    type="text" required
                    value={newOutletName}
                    onChange={(e) => setNewOutletName(e.target.value)}
                    placeholder="Flagship Dago"
                    className="input text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="label">Kota *</label>
                  <input
                    type="text" required
                    value={newOutletCity}
                    onChange={(e) => setNewOutletCity(e.target.value)}
                    placeholder="Bandung"
                    className="input text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="label">Alamat Lengkap</label>
                  <textarea
                    value={newOutletAddress}
                    onChange={(e) => setNewOutletAddress(e.target.value)}
                    placeholder="Jl. Ir. H. Juanda No. 100..."
                    className="input text-xs h-20 mt-1"
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingOutlet}
                  className="btn-primary w-full text-xs py-2 disabled:opacity-50"
                >
                  {creatingOutlet ? "Menyimpan..." : "Simpan Outlet"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: TEAM */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <h2 className="font-serif font-bold text-base text-paper-100 mb-2">Riwayat Undangan Tim</h2>
              {invitations.length === 0 ? (
                <p className="text-xs text-roast-500">Belum ada undangan yang dikirim.</p>
              ) : (
                invitations.map((invite) => (
                  <div key={invite.id} className="card flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="status-pill">{invite.intended_role}</span>
                        <span className="text-[10px] font-mono text-roast-500 uppercase">{invite.status}</span>
                      </div>
                      <p className="text-sm font-semibold text-paper-100">{invite.email_normalized}</p>
                      <p className="text-xs text-roast-600 font-mono mt-0.5">
                        {new Date(invite.created_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    {invite.status === "pending" && (
                      <button
                        onClick={() => handleRevokeInvitation(invite.id)}
                        className="btn-ghost text-xs text-roast-400 hover:text-cherry-400"
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
              <h2 className="font-serif font-bold text-base text-paper-100 mb-4">Undang Anggota Tim</h2>
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label className="label">Email Karyawan *</label>
                  <input
                    type="email" required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="barista@kopikamu.id"
                    className="input text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="label">Peran (Role) *</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="input text-xs mt-1"
                  >
                    <option value="learner">Barista / Peserta (Learner)</option>
                    <option value="head_bar">Head Bar / Supervisor</option>
                    <option value="client_manager">Manajer Operasional</option>
                    <option value="owner">Co-Owner</option>
                  </select>
                </div>
                <div>
                  <label className="label">Penugasan Outlet</label>
                  <select
                    value={inviteOutletId}
                    onChange={(e) => setInviteOutletId(e.target.value)}
                    className="input text-xs mt-1"
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
                  className="btn-primary w-full text-xs py-2 disabled:opacity-50"
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
