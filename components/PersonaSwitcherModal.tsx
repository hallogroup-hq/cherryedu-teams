'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Coffee, ShieldCheck, GraduationCap, Building2, Check, ArrowRight, X } from 'lucide-react';
import { toast } from 'sonner';

interface Persona {
  roleKey: 'barista' | 'owner' | 'trainer' | 'admin';
  name: string;
  email: string;
  orgName: string;
  roleTitle: string;
  destination: string;
  description: string;
  icon: React.ElementType;
}

const PERSONAS: Persona[] = [
  {
    roleKey: 'barista',
    name: 'Budi Pratama',
    email: 'barista1@kopikamu.id',
    orgName: 'Kopi Senja (Specialty Coffee)',
    roleTitle: 'Barista Learner (Tahun ke-1)',
    destination: '/org/org-kopisenja-01/learn',
    description: 'Roadmap 6 modul mentorship, tracker teori B2C, dial-in studio & ujian hybrid',
    icon: Coffee,
  },
  {
    roleKey: 'owner',
    name: 'Hendra Santoso',
    email: 'owner@kopikamu.id',
    orgName: 'Kopi Senja (Owner & Founder)',
    roleTitle: 'Coffee Shop Owner',
    destination: '/org/org-kopisenja-01/overview',
    description: 'Executive Report 1 bulan, transparansi aktivitas trainer, rapor pertumbuhan barista',
    icon: Building2,
  },
  {
    roleKey: 'trainer',
    name: 'Dimas Wicaksono',
    email: 'trainer.dimas@cherrycoffeeroastery.com',
    orgName: 'Cherry Coffee Roastery HQ',
    roleTitle: 'Instruktur Resmi Cherry Edu',
    destination: '/trainer',
    description: 'Log aktivitas offline bar, asesmen rubrik praktikal, soal ujian khusus kafe',
    icon: GraduationCap,
  },
  {
    roleKey: 'admin',
    name: 'Admin Cherry Edu',
    email: 'admin@cherrycoffeeroastery.com',
    orgName: 'HQ Governance Platform',
    roleTitle: 'Platform Administrator',
    destination: '/admin',
    description: 'Tata kelola program mentorship, penugasan trainer, onboarding coffee shop klien',
    icon: ShieldCheck,
  },
];

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole?: string;
}

export default function PersonaSwitcherModal({ isOpen, onClose, currentRole }: PersonaSwitcherModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleSwitch = (persona: Persona) => {
    // 1. Set Cookies
    document.cookie = `teams_demo_role=${persona.roleKey}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `teams_auth_token=demo-token-${persona.roleKey}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `sb-access-token=demo-token-${persona.roleKey}; path=/; max-age=86400; SameSite=Lax`;

    // 2. Set LocalStorage
    localStorage.setItem('teams_auth_token', `demo-token-${persona.roleKey}`);
    localStorage.setItem('teams_demo_role', persona.roleKey);
    localStorage.setItem('teams_user_name', persona.name);

    toast.success(`Beralih ke peran ${persona.roleTitle} (${persona.name})`, {
      description: `Membuka portal ${persona.orgName}`,
    });

    onClose();
    router.push(persona.destination);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-roast-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-elevated border border-paper-300 p-6 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-paper-200">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cherry-700 font-bold block">
              1-Klik Switcher Mode Uji
            </span>
            <h2 id="persona-modal-title" className="font-serif font-black text-xl text-roast-950 mt-0.5">
              Ganti Akun &amp; Peran Uji Coba
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-roast-400 hover:text-roast-900 hover:bg-paper-100 flex items-center justify-center transition"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-roast-600 mt-3 mb-4 leading-relaxed">
          Pilih salah satu peran di bawah untuk berpindah dashboard seketika tanpa perlu proses login ulang:
        </p>

        {/* Persona list */}
        <div className="space-y-2.5 overflow-y-auto pr-1">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const isCurrent = currentRole === p.roleKey;
            return (
              <button
                key={p.roleKey}
                type="button"
                onClick={() => handleSwitch(p)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group ${
                  isCurrent
                    ? 'bg-paper-100/80 border-roast-900 shadow-xs'
                    : 'bg-white border-paper-200 hover:border-paper-400 hover:bg-paper-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-cherry-700 text-white'
                      : 'bg-paper-100 text-roast-700 group-hover:bg-roast-950 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif font-bold text-sm text-roast-950 group-hover:text-cherry-800 transition-colors">
                      {p.name}
                    </span>
                    {isCurrent ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-olive-100 text-olive-900 border border-olive-300 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" /> Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-paper-100 text-roast-600 border border-paper-200 uppercase font-semibold">
                        {p.roleKey}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-roast-600 mt-0.5">{p.roleTitle} · {p.orgName}</p>
                  <p className="text-xs text-roast-500 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-roast-400 group-hover:text-roast-900 group-hover:translate-x-0.5 transition shrink-0 mt-3" />
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-paper-200 flex items-center justify-between text-[11px] text-roast-500 font-mono">
          <span>Mode Evaluasi MVP Cherry Edu</span>
          <a
            href="https://edu.cherrycoffeeroastery.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cherry-700 hover:underline font-semibold"
          >
            Buka Website Utama B2C ↗
          </a>
        </div>
      </div>
    </div>
  );
}
