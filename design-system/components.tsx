'use client';

import React from 'react';

// -------------------------------------------------------------------------
// 1. Button Component (Touch target >= 44px, no glow, crisp typography)
// -------------------------------------------------------------------------

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium transition-colors select-none rounded-lg focus:outline-hidden focus:ring-2 focus:ring-roast-400 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'min-h-[36px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[44px] px-4 py-2.5 text-sm', // standard 44px mobile touch target
    lg: 'min-h-[48px] px-5 py-3 text-base',
  }[size];

  const variantStyles = {
    primary:
      'bg-cherry-700 hover:bg-cherry-800 active:bg-cherry-900 text-white shadow-xs',
    secondary:
      'bg-roast-900 hover:bg-roast-800 active:bg-roast-950 text-paper-50 shadow-xs',
    outline:
      'bg-white hover:bg-paper-100 text-roast-900 border border-paper-300 active:bg-paper-200',
    ghost:
      'bg-transparent hover:bg-paper-100 text-roast-800 active:bg-paper-200',
    danger:
      'bg-cherry-50 hover:bg-cherry-100 text-cherry-800 border border-cherry-300',
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Memproses...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// -------------------------------------------------------------------------
// 2. Card Container (Minimalist, subtle border, no nested card bloat)
// -------------------------------------------------------------------------

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  }[padding];

  return (
    <div
      className={`bg-white border border-paper-200 rounded-xl ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// -------------------------------------------------------------------------
// 3. Status Tag (Functional, moderate radius, NOT decorative pill)
// -------------------------------------------------------------------------

export interface StatusTagProps {
  label: string;
  variant?: 'success' | 'pending' | 'attention' | 'danger' | 'neutral';
  className?: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({
  label,
  variant = 'neutral',
  className = '',
}) => {
  const styles = {
    success: 'bg-olive-50 text-olive-800 border-olive-200',
    pending: 'bg-crema-50 text-crema-800 border-crema-300',
    attention: 'bg-paper-100 text-roast-800 border-paper-400',
    danger: 'bg-cherry-50 text-cherry-800 border-cherry-200',
    neutral: 'bg-paper-50 text-roast-700 border-paper-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${styles} ${className}`}
    >
      {label}
    </span>
  );
};

// -------------------------------------------------------------------------
// 4. Offline / Sync Banner (Explicit sync state, calm tone)
// -------------------------------------------------------------------------

export interface SyncBannerProps {
  isOnline: boolean;
  pendingCount?: number;
  onRetrySync?: () => void;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({
  isOnline,
  pendingCount = 0,
  onRetrySync,
}) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="bg-paper-100 border-b border-paper-300 px-4 py-2.5 flex items-center justify-between text-xs text-roast-800">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            !isOnline ? 'bg-cherry-600' : 'bg-crema-600'
          }`}
        />
        <span>
          {!isOnline
            ? 'Koneksi terputus. Penilaian disimpan lokal di perangkat ini.'
            : `${pendingCount} penilaian menunggu sinkronisasi ke server.`}
        </span>
      </div>
      {isOnline && pendingCount > 0 && onRetrySync && (
        <button
          onClick={onRetrySync}
          className="font-medium text-cherry-700 hover:text-cherry-800 underline ml-3"
        >
          Sinkronkan Sekarang
        </button>
      )}
    </div>
  );
};

// -------------------------------------------------------------------------
// 5. Empty State (Natural copy, single relevant action)
// -------------------------------------------------------------------------

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="py-10 px-4 text-center max-w-sm mx-auto">
      <h3 className="font-serif font-bold text-lg text-roast-900 mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-roast-600 leading-relaxed mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
