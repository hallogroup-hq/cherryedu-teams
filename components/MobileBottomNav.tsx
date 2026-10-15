'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Award,
  Coffee,
  Building2,
  Users,
  Layers,
  LayoutDashboard,
  Sparkles,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import PersonaSwitcherModal from './PersonaSwitcherModal';

interface MobileBottomNavProps {
  role?: 'barista' | 'owner' | 'trainer' | 'admin';
  orgId?: string;
  onOpenCalibration?: () => void;
  onOpenTracker?: () => void;
}

export default function MobileBottomNav({
  role = 'barista',
  orgId = 'org-kopisenja-01',
  onOpenCalibration,
  onOpenTracker,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-paper-300 md:hidden shadow-elevated"
      >
        <div className="grid grid-cols-4 h-16 max-w-md mx-auto items-center px-1">
          {/* TAB 1: Primary View */}
          {role === 'barista' && (
            <Link
              href={`/org/${orgId}/learn`}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                pathname.includes('/learn') && !pathname.includes('/tools')
                  ? 'text-cherry-800 font-bold'
                  : 'text-roast-500 hover:text-roast-900 font-medium'
              }`}
            >
              <BookOpen className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Silabus</span>
            </Link>
          )}

          {role === 'owner' && (
            <Link
              href={`/org/${orgId}/overview`}
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                pathname.includes('/overview')
                  ? 'text-cherry-800 font-bold'
                  : 'text-roast-500 hover:text-roast-900 font-medium'
              }`}
            >
              <Building2 className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Ringkasan</span>
            </Link>
          )}

          {role === 'trainer' && (
            <Link
              href="/trainer"
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                pathname === '/trainer'
                  ? 'text-cherry-800 font-bold'
                  : 'text-roast-500 hover:text-roast-900 font-medium'
              }`}
            >
              <Layers className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Cohorts</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link
              href="/admin"
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                pathname === '/admin'
                  ? 'text-cherry-800 font-bold'
                  : 'text-roast-500 hover:text-roast-900 font-medium'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Dasbor</span>
            </Link>
          )}

          {/* TAB 2: Secondary / Tracker View */}
          {role === 'barista' && (
            <button
              type="button"
              onClick={onOpenTracker ? onOpenTracker : () => {
                const el = document.getElementById('competency-tracker-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center h-full text-roast-500 hover:text-roast-900 font-medium transition-colors"
            >
              <Award className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Tracker Skill</span>
            </button>
          )}

          {role === 'owner' && (
            <Link
              href={`/org/${orgId}/learn`}
              className="flex flex-col items-center justify-center h-full text-roast-500 hover:text-roast-900 font-medium transition-colors"
            >
              <Coffee className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Barista View</span>
            </Link>
          )}

          {role === 'trainer' && (
            <Link
              href="/trainer/cohorts/coh-senja-barista-01"
              className="flex flex-col items-center justify-center h-full text-roast-500 hover:text-roast-900 font-medium transition-colors"
            >
              <Users className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Roster Binaan</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link
              href="/admin/organizations"
              className={`flex flex-col items-center justify-center h-full transition-colors ${
                pathname.includes('/organizations')
                  ? 'text-cherry-800 font-bold'
                  : 'text-roast-500 hover:text-roast-900 font-medium'
              }`}
            >
              <Building2 className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Organisasi</span>
            </Link>
          )}

          {/* TAB 3: Coffee Tool Link */}
          {role === 'barista' && (
            <button
              type="button"
              onClick={onOpenCalibration ? onOpenCalibration : () => {
                const el = document.getElementById('daily-calibration-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center justify-center h-full text-roast-500 hover:text-roast-900 font-medium transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Dial-In Tool</span>
            </button>
          )}

          {role !== 'barista' && (
            <a
              href="https://edu.cherrycoffeeroastery.com/tools"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center h-full text-roast-500 hover:text-roast-900 font-medium transition-colors"
            >
              <ExternalLink className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] mt-1 tracking-tight">Tools Kopi</span>
            </a>
          )}

          {/* TAB 4: Instant Role Switcher */}
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(true)}
            className="flex flex-col items-center justify-center h-full text-cherry-700 hover:text-cherry-900 font-bold transition-colors"
          >
            <Sparkles className="w-5 h-5 stroke-[2]" />
            <span className="text-[10px] mt-1 tracking-tight">Ganti Role</span>
          </button>
        </div>
      </nav>

      {/* 1-Click Role Switcher Modal */}
      <PersonaSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentRole={role}
      />
    </>
  );
}
