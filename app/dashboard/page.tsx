"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

/**
 * Post-auth redirect hub.
 * Fetches the user's role and redirects to the appropriate role-specific dashboard.
 */
export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Memeriksa kredensial & otorisasi akun...");

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
        const codes = staffPerms.map((p: { permission_code: string }) => p.permission_code);
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
        router.replace(`/org/${m.organization_id}/learn`);
        return;
      }

      // 3. No membership found
      setStatus("Akun Anda belum terdaftar dalam organisasi pelatihan. Silakan periksa email undangan dari manajer Anda.");
    }

    resolveRole().catch(() =>
      setStatus("Gagal memuat sesi otorisasi. Silakan muat ulang halaman.")
    );
  }, [router]);

  return (
    <div className="min-h-screen bg-paper-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Brand */}
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cherry-700 flex items-center justify-center shadow-xs">
            <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5" aria-hidden="true">
              <circle cx="7" cy="13" r="4" fill="#F9E5E7" opacity="0.95"/>
              <circle cx="13" cy="13" r="4" fill="#F9E5E7" opacity="0.75"/>
              <path d="M10 9 C10 9 11 4 13 3 C13 3 10 4 9 7" stroke="#F9E5E7" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div className="text-left border-l border-paper-300 pl-3">
            <span className="font-serif font-black text-xl text-roast-950 leading-none">
              Cherry<span className="font-sans font-light text-cherry-700 text-lg ml-0.5">Edu</span>
            </span>
            <span className="block text-[9px] font-mono tracking-widest text-roast-500 uppercase mt-0.5 font-bold">
              Teams
            </span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl border border-paper-300 p-6 shadow-card space-y-4">
          <div className="w-6 h-6 border-2 border-roast-950 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-roast-700 font-sans leading-relaxed">
            {status}
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="text-xs font-mono text-roast-500 hover:text-cherry-700 transition-colors"
            >
              ← Kembali ke Halaman Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
