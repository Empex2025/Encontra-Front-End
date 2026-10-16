"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";

import { ApiError } from "@/lib/api/client";

/**
 * Peças dos estados de uma seção (carregando × erro × vazio). A seção nunca some:
 * o título fica sempre e só o corpo muda. Erro não se disfarça de vazio.
 */

/** Título + descrição curta + ação opcional ("Ver todos") e o corpo da seção. */
export function Section({
  id,
  title,
  description,
  action,
  level = 2,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  level?: 2 | 3;
  children: React.ReactNode;
}) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={`${id}-t`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col gap-0.5">
          <H
            id={`${id}-t`}
            className={
              level === 2 ? "text-xl font-bold text-text-strong" : "text-lg font-bold text-text-strong"
            }
          >
            {title}
          </H>
          {description && <p className="text-sm text-text-muted">{description}</p>}
        </div>
        {action && (
          <Link href={action.href} className="py-2 text-sm font-semibold text-link hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Texto do erro conforme a causa: sem rede, lentidão ou resposta de erro do servidor. */
export function errorExplanation(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "TIMEOUT") return "Está demorando mais que o normal.";
    if (error.status === 0) return "Sem conexão com o servidor.";
    if (error.status >= 500) return `O servidor respondeu com erro (código ${error.status}).`;
    if (error.status === 404) return "Esta informação não está disponível agora.";
  }
  return "Não conseguimos ler a resposta.";
}

/** Erro de uma seção: mensagem clara, aviso de fonte não conectada e "Tentar de novo". */
export function SectionError({
  what,
  error,
  onRetry,
}: {
  /** O que não carregou, em minúsculas: "as avaliações", "os produtos relacionados". */
  what: string;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface p-4"
    >
      <p className="font-bold text-text-strong">Não foi possível carregar {what}.</p>
      <p className="text-sm text-text-muted">{errorExplanation(error)} Tente de novo em instantes.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary px-4 text-sm font-bold text-text-strong hover:bg-surface-2"
      >
        <RotateCw className="size-4" aria-hidden />
        Tentar de novo
      </button>
    </div>
  );
}

/** Vazio com orientação: diz o que não há e o que a pessoa pode fazer. */
export function EmptyNote({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-dashed border-border-strong bg-surface-2 p-4">
      <p className="font-semibold text-text">{title}</p>
      {children && <div className="text-sm text-text-muted">{children}</div>}
    </div>
  );
}

/** Esqueleto de lista de cards. */
export function CardsSkeleton({ count = 4, label }: { count?: number; label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="grid animate-pulse grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-56 rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}

/** Esqueleto de bloco de texto/lista. */
export function BlockSkeleton({ label, rows = 2 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" aria-label={label} className="flex animate-pulse flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-20 rounded-xl bg-surface-2" />
      ))}
    </div>
  );
}

/** Página inteira que não carregou (erro ≠ "não encontrado" ≠ carregando). */
export function PageError({
  what,
  error,
  onRetry,
  backHref,
  backLabel,
}: {
  what: string;
  error: unknown;
  onRetry: () => void;
  backHref: string;
  backLabel: string;
}) {
  return (
    <section
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-12 text-center"
    >
      <h1 className="text-2xl font-bold text-text-strong">Não foi possível carregar {what}</h1>
      <p className="text-text-muted">
        {errorExplanation(error)} Isso não quer dizer que {what} não exista. Tente de novo em instantes.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
        >
          <RotateCw className="size-4" aria-hidden />
          Tentar de novo
        </button>
        <Link
          href={backHref}
          className="inline-flex h-11 items-center rounded-lg border border-border-strong px-5 text-sm font-bold text-text-strong hover:bg-surface-2"
        >
          {backLabel}
        </Link>
      </div>
    </section>
  );
}
