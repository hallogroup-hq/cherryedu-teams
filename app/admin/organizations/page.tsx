'use client';

import { useEffect, useState } from 'react';

type Org = {
  id: string; slug: string; display_name: string; legal_name: string | null;
  business_category: string | null; status: string; timezone: string;
  created_at: string; member_count: string; active_cohort_count: string;
};

const STATUS_TEXT: Record<string, string> = {
  active: 'text-paper-300', suspended: 'text-roast-500',
  setup: 'text-roast-600', closed: 'text-roast-700',
};

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    display_name: '', legal_name: '', business_category: '', slug: '', timezone: 'Asia/Jakarta',
  });

  const loadOrgs = () => {
    setLoading(true);
    fetch('/api/teams/admin/organizations')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error ?? 'Failed');
        setOrgs(d.organizations ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrgs(); }, []);

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
      if (!d.success) throw new Error(d.error ?? 'Failed');
      setShowForm(false);
      setForm({ display_name: '', legal_name: '', business_category: '', slug: '', timezone: 'Asia/Jakarta' });
      loadOrgs();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 pb-5 border-b border-roast-800 flex items-end justify-between gap-4">
        <div>
          <span className="section-label block mb-1">Platform Admin · Organisations</span>
          <h1 className="font-serif font-bold text-2xl text-paper-100">Organisasi Klien</h1>
          <p className="text-sm text-roast-500 mt-1">Seluruh organisasi yang terdaftar di platform</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary shrink-0"
        >
          {showForm ? 'Batal' : '+ Onboard Org'}
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 bg-cherry-950 border border-cherry-900 text-cherry-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleOnboard}
          className="bg-roast-900 border border-roast-800 rounded-xl p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="col-span-full pb-4 border-b border-roast-800">
            <span className="section-label">Onboard Organisasi Baru</span>
          </div>
          {[
            { label: 'Display Name *', key: 'display_name', required: true },
            { label: 'Slug URL *', key: 'slug', required: true },
            { label: 'Nama Legal', key: 'legal_name', required: false },
            { label: 'Kategori Bisnis', key: 'business_category', required: false },
          ].map(({ label, key, required }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                required={required}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input"
              />
            </div>
          ))}
          <div className="col-span-full flex justify-end pt-2">
            <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
              {submitting ? 'Menyimpan…' : 'Buat Organisasi'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-roast-500">Memuat…</p>
      ) : (
        <div className="border border-roast-800 rounded-xl overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                {['Organisasi', 'Slug', 'Kategori', 'Status', 'Member', 'Cohort', 'Ubah Status'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td className="text-paper-200 font-medium">{org.display_name}</td>
                  <td className="text-roast-500 font-mono">{org.slug}</td>
                  <td className="text-roast-400">{org.business_category ?? '—'}</td>
                  <td className={`font-mono ${STATUS_TEXT[org.status] ?? 'text-roast-400'}`}>{org.status}</td>
                  <td className="text-roast-400 tabular-nums">{org.member_count}</td>
                  <td className="text-roast-400 tabular-nums">{org.active_cohort_count}</td>
                  <td>
                    <select
                      defaultValue={org.status}
                      onChange={(e) => handleStatusChange(org.id, e.target.value)}
                      className="bg-roast-900 text-roast-300 text-[11px] font-mono rounded px-2 py-1 border border-roast-700 focus:outline-none focus:border-cherry-700"
                    >
                      {['setup','active','suspended','closed'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-roast-600 font-mono text-xs uppercase tracking-wider">
                    Belum ada organisasi.
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
