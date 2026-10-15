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
    fetch('/api/teams/admin/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) throw new Error(d.error ?? 'Failed to load dashboard');
        setOverview(d.overview);
        setEvents(d.recent_audit_events ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const kpis = overview
    ? [
        { label: 'Total Org', value: overview.organizations.total },
        { label: 'Org Aktif', value: overview.organizations.active },
        { label: 'Org Suspended', value: overview.organizations.suspended },
        { label: 'Cohort Aktif', value: overview.cohorts.active },
        { label: 'Active Learners', value: overview.learners.active },
      ]
    : [];

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 pb-5 border-b border-roast-800">
        <span className="section-label block mb-1">Platform Admin · Overview</span>
        <h1 className="font-serif font-bold text-2xl text-paper-100">Dashboard</h1>
        <p className="text-sm text-roast-500 mt-1">Ringkasan operasional platform Cherry Edu Teams</p>
      </div>

      {loading && <p className="text-sm text-roast-500">Memuat…</p>}
      {error && (
        <div className="flex items-center gap-2 text-cherry-300 bg-cherry-950 border border-cherry-900 rounded-lg px-4 py-3 text-sm mb-6">
          <span>{error}</span>
        </div>
      )}

      {overview && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-roast-900 border border-roast-800 rounded-xl p-4">
                <span className="section-label block mb-2">{kpi.label}</span>
                <span className="font-serif font-bold text-2xl text-paper-100 tabular-nums">{kpi.value}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mb-10">
            {[
              { label: '+ Onboard Organisasi', href: '/admin/organizations' },
              { label: 'Kelola Program', href: '/admin/programs' },
              { label: 'Lihat Audit Log', href: '/admin/audit' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-mono uppercase tracking-wider bg-roast-900 hover:bg-roast-800 border border-roast-800 text-roast-200 px-4 py-2 rounded-md transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Audit trail */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif font-bold text-base text-paper-200">Aktivitas Terkini</h2>
              <Link href="/admin/audit" className="text-[11px] font-mono uppercase tracking-wider text-roast-500 hover:text-roast-200 transition-colors">
                Semua Log →
              </Link>
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-roast-600">Belum ada event.</p>
            ) : (
              <div className="border border-roast-800 rounded-xl overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      {['Waktu', 'Organisasi', 'Aktor', 'Aksi', 'Objek'].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td className="text-roast-500 whitespace-nowrap">
                          {new Date(ev.occurred_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="text-roast-300">{ev.organization_name ?? '—'}</td>
                        <td className="text-roast-400">{ev.actor_name ?? '—'}</td>
                        <td className="text-paper-200 font-mono">{ev.action}</td>
                        <td className="text-roast-500 font-mono truncate max-w-[120px]">
                          {ev.object_type}/{ev.object_id.slice(0, 8)}…
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
