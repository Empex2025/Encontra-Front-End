"use client";

import { Search } from "lucide-react";
import Link from "next/link";

import { cn } from "./cn";

/** Esqueleto de lista: aparece enquanto carrega (diferente de "vazio" e de "erro"). */
export function ListSkeleton({
  label,
  rows = 3,
  className,
}: {
  label: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-busy="true" className={cn("flex flex-col gap-3", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden className="h-20 animate-pulse rounded-2xl bg-surface-2" />
      ))}
    </div>
  );
}

/** Estado vazio com orientação: diz o que fazer para a lista deixar de estar vazia. */
export function EmptyState({
  title,
  hint,
  href,
  cta,
  icon,
}: {
  title: string;
  hint?: string;
  href?: string;
  cta?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border p-8 text-center">
      {icon}
      <p className="font-bold text-text-strong">{title}</p>
      {hint && <p className="max-w-md text-sm text-text-muted">{hint}</p>}
      {href && cta && (
        <Link href={href} className="text-sm font-semibold text-link hover:underline">
          {cta}
        </Link>
      )}
    </div>
  );
}

/** Campo de busca que filtra a lista já carregada (não chama o servidor). */
export function SearchField({
  value,
  onChange,
  label,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className="h-11 w-full rounded-lg border border-border-strong bg-surface pr-3 pl-9 text-text disabled:opacity-60"
      />
    </label>
  );
}
