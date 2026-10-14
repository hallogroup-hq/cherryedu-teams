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

const STATUS_STYLES: Record<string, string> = {
  active: 'text-slate-200',
  suspended: 'text-slate-400',
  setup: 'text-slate-500',
  closed: 'text-slate-600',
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
        if (!d.success) throw new Error(d.error ?? 'Failed to load organisations');
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
      if (!d.success) throw new Error(d.error ?? 'Failed to onboard');
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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white mb-1">Organisations</h1>
          <p className="text-sm text-slate-500">All client organisations on the platform</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded transition-colors"
        >
          {showForm ? 'Cancel' : '+ Onboard Organisation'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleOnboard}
          className="bg-slate-900 border border-slate-800 rounded-md p-5 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <h2 className="text-sm font-medium text-slate-300 col-span-full mb-1">Onboard New Client Organisation</h2>
          {[
            { label: 'Display Name *', key: 'display_name', required: true },
            { label: 'Slug *', key: 'slug', required: true },
            { label: 'Legal Name', key: 'legal_name', required: false },
            { label: 'Business Category', key: 'business_category', required: false },
          ].map(({ label, key, required }) => (
            <div key={key}>
              <label className="block text-xs text-slate-500 mb-1">{label}</label>
              <input
                required={required}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded text-sm text-slate-100 px-3 py-2 focus:outline-none focus:border-slate-500"
              />
            </div>
          ))}
          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-5 py-2 rounded disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : 'Create Organisation'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="border border-slate-800 rounded-md overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                {['Organisation', 'Slug', 'Category', 'Status', 'Members', 'Cohorts', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                  <td className="px-4 py-2 text-slate-200 font-medium">{org.display_name}</td>
                  <td className="px-4 py-2 text-slate-500 font-mono">{org.slug}</td>
                  <td className="px-4 py-2 text-slate-400">{org.business_category ?? '—'}</td>
                  <td className={`px-4 py-2 font-mono ${STATUS_STYLES[org.status] ?? 'text-slate-400'}`}>{org.status}</td>
                  <td className="px-4 py-2 text-slate-400 tabular-nums">{org.member_count}</td>
                  <td className="px-4 py-2 text-slate-400 tabular-nums">{org.active_cohort_count}</td>
                  <td className="px-4 py-2">
                    <select
                      defaultValue={org.status}
                      onChange={(e) => handleStatusChange(org.id, e.target.value)}
                      className="bg-slate-800 text-slate-300 text-xs rounded px-2 py-1 border border-slate-700 focus:outline-none"
                    >
                      <option value="setup">setup</option>
                      <option value="active">active</option>
                      <option value="suspended">suspended</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-600">No organisations yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
