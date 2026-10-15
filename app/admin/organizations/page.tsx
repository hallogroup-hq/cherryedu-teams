'use client';

import { useEffect, useState } from 'react';

type Org = {
  id: string;
  slug: string;
  display_name: string;
  legal_name: string | null;
  business_category: string | null;
  status: string;
  timezone: string;
  created_at: string;
  member_count: string;
  active_cohort_count: string;
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    display_name: '',
    legal_name: '',
    business_category: '',
    slug: '',
    timezone: 'Asia/Jakarta',
  });

  const loadOrgs = () => {
    setLoading(true);
    fetch('/api/teams/admin/organizations')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error ?? 'Gagal memuat daftar organisasi');
        setOrgs(d.organizations ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleStatusChange = async (orgId: string, status: string) => {
    await fetch(`/api/teams/admin/organizations/${orgId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadOrgs();
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/teams/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error ?? 'Gagal menambahkan organisasi');
      setShowForm(false);
      setForm({
        display_name: '',
        legal_name: '',
        business_category: '',
        slug: '',
        timezone: 'Asia/Jakarta',
      });
      loadOrgs();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-5 border-b border-paper-300 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="section-label block mb-1">Platform Admin · Organisasi Klien</span>
          <h1 className="font-serif font-black text-2xl text-roast-950">Kelola Organisasi Bisnis Kopi</h1>
          <p className="text-sm text-roast-600 mt-1">
            Daftar tenant, status kemitraan, jumlah outlet, dan cohort aktif
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-xs py-2 px-3.5 shrink-0"
        >
          {showForm ? 'Tutup Form' : '+ Onboard Organisasi Baru'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-cherry-50 border border-cherry-200 text-cherry-900 rounded-lg px-4 py-3 text-xs">
          <span>{error}</span>
        </div>
      )}

      {/* Onboard Form Card */}
      {showForm && (
        <form
          onSubmit={handleOnboard}
          className="card p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="col-span-full pb-3 border-b border-paper-200">
            <h2 className="font-serif font-bold text-base text-roast-950">Form Onboarding Organisasi Klien</h2>
            <p className="text-xs text-roast-500">Daftarkan bisnis kopi atau roastery baru ke dalam ekosistem Teams</p>
          </div>
          {[
            { label: 'Nama Bisnis / Brand *', key: 'display_name', required: true, placeholder: 'Kopi Toko Kamu' },
            { label: 'Slug Identitas URL *', key: 'slug', required: true, placeholder: 'kopi-toko-kamu' },
            { label: 'Nama Legalitas Perusahaan', key: 'legal_name', required: false, placeholder: 'PT Rasa Kopi Nusantara' },
            { label: 'Kategori Bisnis', key: 'business_category', required: false, placeholder: 'Specialty Coffee Shop' },
          ].map(({ label, key, required, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                required={required}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input"
              />
            </div>
          ))}
          <div className="col-span-full flex justify-end gap-2 pt-3 border-t border-paper-200">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary text-xs"
            >
              Batal
            </button>
            <button type="submit" disabled={submitting} className="btn-primary text-xs disabled:opacity-50">
              {submitting ? 'Menyimpan...' : 'Simpan & Daftarkan'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-roast-500 font-mono">Memuat daftar organisasi...</p>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Nama Organisasi</th>
                <th>Slug</th>
                <th>Kategori</th>
                <th>Status</th>
                <th className="text-center">Member</th>
                <th className="text-center">Cohort Aktif</th>
                <th className="text-right">Ubah Status</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <div className="font-semibold text-roast-950">{org.display_name}</div>
                    {org.legal_name && (
                      <div className="text-[10px] text-roast-500">{org.legal_name}</div>
                    )}
                  </td>
                  <td className="text-roast-600 font-mono text-[11px]">{org.slug}</td>
                  <td className="text-roast-700">{org.business_category ?? '—'}</td>
                  <td>
                    <span className="status-pill">{org.status}</span>
                  </td>
                  <td className="text-center font-mono text-roast-700 tabular-nums">{org.member_count}</td>
                  <td className="text-center font-mono text-roast-700 tabular-nums">{org.active_cohort_count}</td>
                  <td className="text-right">
                    <select
                      defaultValue={org.status}
                      onChange={(e) => handleStatusChange(org.id, e.target.value)}
                      className="bg-white text-roast-800 text-xs font-mono rounded-md px-2 py-1 border border-paper-300 focus:outline-none focus:border-roast-700 cursor-pointer"
                    >
                      {['setup', 'active', 'suspended', 'closed'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-roast-500 font-mono text-xs">
                    Belum ada organisasi terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
