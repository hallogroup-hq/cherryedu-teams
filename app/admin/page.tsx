'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Overview = {
  organizations: { total: number; active: number; suspended: number; setup: number };
  cohorts: { total: number; active: number };
  learners: { active: number };
};

type AuditEvent = {
  id: string;
  organization_name: string | null;
  actor_name: string | null;
  action: string;
  object_type: string;
  object_id: string;
  occurred_at: string;
};

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('teams_auth_token') || '' : '';
    fetch('/api/teams/admin/dashboard', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'same-origin',
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error ?? 'Gagal memuat dashboard admin');
        setOverview(d.overview);
        setEvents(d.recent_audit_events ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const kpis = overview
    ? [
        { label: 'Total Organisasi', value: overview.organizations.total },
        { label: 'Organisasi Aktif', value: overview.organizations.active },
        { label: 'Suspended', value: overview.organizations.suspended },
        { label: 'Cohort Berjalan', value: overview.cohorts.active },
        { label: 'Barista Terdaftar', value: overview.learners.active },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-5 border-b border-paper-300 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="section-label block mb-1">Tata Kelola Platform · Cherry Edu Teams</span>
          <h1 className="font-serif font-black text-2xl text-roast-950">Dasbor Operasional</h1>
          <p className="text-sm text-roast-600 mt-1">
            Ringkasan tata kelola organisasi klien, cohort pelatihan, dan audit operasional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/organizations" className="btn-primary text-xs py-2 px-3.5">
            + Onboard Klien Baru
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-roast-500 font-mono">Memuat data platform...</p>}

      {error && (
        <div className="flex items-center gap-2 text-cherry-900 bg-cherry-50 border border-cherry-200 rounded-lg px-4 py-3 text-xs">
          <span>{error}</span>
        </div>
      )}

      {overview && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="card p-4">
                <span className="section-label block mb-1.5">{kpi.label}</span>
                <span className="font-serif font-bold text-2xl text-roast-950 tabular-nums">
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>

          {/* Audit Trail Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-roast-950">Log Aktivitas & Audit Terkini</h2>
                <p className="text-xs text-roast-500">Rekam jejak perubahan data dan otorisasi operasional</p>
              </div>
              <span className="text-xs font-mono text-roast-500">{events.length} Peristiwa Terakhir</span>
            </div>

            {events.length === 0 ? (
              <div className="card p-8 text-center text-roast-500 text-xs font-mono">
                Belum ada rekaman audit log.
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Aktor</th>
                      <th>Aksi</th>
                      <th>Objek</th>
                      <th>Organisasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td className="font-mono text-roast-500 whitespace-nowrap">
                          {new Date(e.occurred_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="font-medium text-roast-950">{e.actor_name ?? 'Sistem'}</td>
                        <td>
                          <span className="status-pill font-mono">{e.action}</span>
                        </td>
                        <td className="font-mono text-roast-600">
                          {e.object_type}
                        </td>
                        <td className="text-roast-700 font-medium">
                          {e.organization_name ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
