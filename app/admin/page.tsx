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
        { label: 'Total Organisations', value: overview.organizations.total },
        { label: 'Active Orgs', value: overview.organizations.active },
        { label: 'Suspended Orgs', value: overview.organizations.suspended },
        { label: 'Active Cohorts', value: overview.cohorts.active },
        { label: 'Active Learners', value: overview.learners.active },
      ]
    : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-slate-500">Platform-wide operations overview</p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {overview && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-md p-4">
                <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                <p className="text-2xl font-semibold text-white tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="flex gap-3 mb-10">
            {[
              { label: 'Onboard Organisation', href: '/admin/organizations' },
              { label: 'Assign Trainer', href: '/admin/trainers' },
              { label: 'View Audit Log', href: '/admin/audit' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Recent audit events */}
          <div>
            <h2 className="text-sm font-medium text-slate-300 mb-3">Recent Activity</h2>
            {events.length === 0 ? (
              <p className="text-sm text-slate-600">No recent events.</p>
            ) : (
              <div className="border border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800">
                    <tr>
                      {['Time', 'Organisation', 'Actor', 'Action', 'Object'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2 text-slate-500 font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                        <td className="px-4 py-2 text-slate-500 whitespace-nowrap">
                          {new Date(ev.occurred_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-2 text-slate-400">{ev.organization_name ?? '—'}</td>
                        <td className="px-4 py-2 text-slate-400">{ev.actor_name ?? '—'}</td>
                        <td className="px-4 py-2 text-slate-200 font-mono">{ev.action}</td>
                        <td className="px-4 py-2 text-slate-500 font-mono truncate max-w-[120px]">
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
