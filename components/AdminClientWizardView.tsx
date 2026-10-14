'use client';

import React, { useState } from 'react';
import { Card, Button } from '../design-system/components';

export interface AdminClientWizardProps {
  onComplete: (data: {
    displayName: string;
    legalName: string;
    slug: string;
    outletName: string;
    outletCity: string;
    ownerEmail: string;
  }) => void;
  onCancel: () => void;
}

export const AdminClientWizardView: React.FC<AdminClientWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [displayName, setDisplayName] = useState<string>('');
  const [legalName, setLegalName] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [outletName, setOutletName] = useState<string>('');
  const [outletCity, setOutletCity] = useState<string>('Jakarta');
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNextStep1 = () => {
    if (!displayName.trim() || !slug.trim()) {
      setErrorMsg('Nama brand dan URL slug wajib diisi.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!outletName.trim()) {
      setErrorMsg('Nama outlet pertama wajib diisi.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinish = () => {
    if (!ownerEmail.trim() || !ownerEmail.includes('@')) {
      setErrorMsg('Email pemilik coffee shop harus valid.');
      return;
    }
    setErrorMsg(null);
    onComplete({
      displayName,
      legalName,
      slug,
      outletName,
      outletCity,
      ownerEmail,
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-paper-50 min-h-screen text-roast-950 p-4 sm:p-6 flex flex-col">
      <header className="mb-6">
        <span className="text-[11px] font-mono uppercase tracking-wider text-roast-500 font-semibold block mb-1">
          Konsol Pengelola Cherry Edu Teams
        </span>
        <h1 className="font-serif font-bold text-2xl text-roast-950">
          Aktivasi Klien Baru
        </h1>
        <p className="text-xs text-roast-600 mt-1">
          Langkah {step} dari 3: {step === 1 ? 'Identitas Bisnis' : step === 2 ? 'Outlet Pertama' : 'Akses Pemilik'}
        </p>
      </header>

      {errorMsg && (
        <div className="mb-4 bg-cherry-50 border border-cherry-200 text-cherry-800 text-xs p-3 rounded-lg">
          {errorMsg}
        </div>
      )}

      <Card className="bg-white border-paper-300 p-5 flex-1">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-roast-800 block mb-1">
                Nama Coffee Shop / Brand *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
                  }
                }}
                placeholder="Contoh: Kopi Ruang"
                className="w-full text-sm p-2.5 border border-paper-300 rounded-lg focus:outline-hidden focus:border-roast-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-roast-800 block mb-1">
                Nama Entitas Legal (Opsional)
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Contoh: PT Ruang Rasa Kopi"
                className="w-full text-sm p-2.5 border border-paper-300 rounded-lg focus:outline-hidden focus:border-roast-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-roast-800 block mb-1">
                Slug Workspace (URL Unik) *
              </label>
              <div className="flex items-center text-xs text-roast-500 bg-paper-50 border border-paper-300 rounded-lg overflow-hidden px-2.5">
                <span>teams.cherryedu.id/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="kopi-ruang"
                  className="w-full text-sm p-2 bg-transparent focus:outline-hidden text-roast-900 font-mono font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Batal
              </Button>
              <Button variant="primary" size="sm" onClick={handleNextStep1}>
                Lanjut ke Outlet →
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-roast-800 block mb-1">
                Nama Outlet Pertama *
              </label>
              <input
                type="text"
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                placeholder="Contoh: Senopati Branch"
                className="w-full text-sm p-2.5 border border-paper-300 rounded-lg focus:outline-hidden focus:border-roast-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-roast-800 block mb-1">
                Kota Lokasi
              </label>
              <input
                type="text"
                value={outletCity}
                onChange={(e) => setOutletCity(e.target.value)}
                placeholder="Contoh: Jakarta Selatan"
                className="w-full text-sm p-2.5 border border-paper-300 rounded-lg focus:outline-hidden focus:border-roast-900"
              />
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                ← Kembali
              </Button>
              <Button variant="primary" size="sm" onClick={handleNextStep2}>
                Lanjut ke Undangan →
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-roast-800 block mb-1">
                Email Pemilik Coffee Shop (Owner) *
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@kopiruang.id"
                className="w-full text-sm p-2.5 border border-paper-300 rounded-lg focus:outline-hidden focus:border-roast-900"
              />
              <p className="text-[11px] text-roast-500 mt-1">
                Undangan aktivasi akan dikirimkan ke email ini untuk masuk ke dashboard Owner.
              </p>
            </div>

            <div className="p-3 bg-paper-100 rounded-lg border border-paper-200 text-xs text-roast-800 space-y-1">
              <div className="font-semibold text-roast-900">Ringkasan Setup:</div>
              <div>Brand: {displayName}</div>
              <div>Workspace: teams.cherryedu.id/{slug}</div>
              <div>Outlet Utama: {outletName} ({outletCity})</div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                ← Kembali
              </Button>
              <Button variant="primary" size="sm" onClick={handleFinish}>
                Aktifkan Workspace
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
