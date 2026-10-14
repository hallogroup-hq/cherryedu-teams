"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/**
 * Post-auth redirect hub.
 * Fetches the user's role from public.profiles and redirects to the
 * appropriate role-specific dashboard.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Memuat dashboard...");

  useEffect(() => {
    async function resolveRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      // 1. Check for internal staff (Cherry Edu staff) permissions
      const { data: staffPerms } = await supabase
        .from("b2b.internal_staff_permissions")
        .select("permission_code")
        .eq("user_id", userId)
        .is("revoked_at", null);

      if (staffPerms && staffPerms.length > 0) {
        const codes = staffPerms.map((p: {permission_code: string}) => p.permission_code);
        if (codes.includes("platform_admin")) {
          router.replace("/admin");
          return;
        }
        if (codes.includes("cherry_trainer")) {
          router.replace("/trainer");
          return;
        }
      }

      // 2. Check organization membership role
      const { data: memberships } = await supabase
        .schema("b2b")
        .from("organization_memberships")
        .select(`
          id,
          status,
          organization_id,
          membership_roles(role_code)
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1);

      if (memberships && memberships.length > 0) {
        const m = memberships[0] as {
          organization_id: string;
          membership_roles: { role_code: string }[];
        };
        const roles = m.membership_roles?.map((r) => r.role_code) || [];
        if (roles.includes("owner") || roles.includes("client_manager")) {
          router.replace(`/org/${m.organization_id}/overview`);
          return;
        }
        // Head bar / learner
        router.replace(`/org/${m.organization_id}/learn`);
        return;
      }

      // 3. No membership found — prompt to join or wait for invite
      setStatus("Akunmu belum terhubung ke organisasi. Cek email undanganmu.");
    }

    resolveRole().catch(() =>
      setStatus("Gagal memuat data. Silakan muat ulang halaman.")
    );
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400 text-sm">{status}</p>
    </div>
  );
}
