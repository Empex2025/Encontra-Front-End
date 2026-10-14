"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ErrorState } from "@/components/ui/error-state";
import { useSession } from "@/hooks/use-session";
import { LOCKED_AREAS, type LockedArea } from "@/lib/domain/auth-actions";
import { routes } from "@/lib/routes";

/** Área da conta: mostra o conteúdo para quem tem sessão e "Entre para {motivo}" para visitante. */
export function AuthGate({ area, children }: { area: LockedArea; children: React.ReactNode }) {
  const { me, isLoading, isError, error, refetch } = useSession();
  const pathname = usePathname();
  if (isLoading)
    return (
      <p role="status" className="py-16 text-center text-text-muted">
        Carregando…
      </p>
    );
  if (me) return <>{children}</>;
  // Servidor fora do ar: não dá para saber se há sessão, então não pedimos login nem mostramos a área vazia.
  if (isError)
    return (
      <div className="mx-auto max-w-xl py-10">
        <ErrorState
          error={error ?? new Error()}
          onRetry={refetch}
          title="Não foi possível confirmar sua sessão"
          description="Sem essa confirmação não dá para abrir esta área. Tente de novo em alguns segundos."
        />
      </div>
    );
  const back = encodeURIComponent(pathname + (typeof window === "undefined" ? "" : window.location.search));
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-selected text-link">
        <Lock className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold text-text-strong">Entre para {LOCKED_AREAS[area]}</h1>
      <p className="text-base text-text-muted">
        Com uma conta grátis você salva, segue e conversa com as lojas.
      </p>
      <div className="flex w-full flex-col gap-3">
        <Link
          href={`${routes.cadastro}?voltar=${back}`}
          className="flex h-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-on-primary hover:bg-primary-hover"
        >
          Criar conta grátis
        </Link>
        <Link
          href={`${routes.entrar}?voltar=${back}`}
          className="flex h-12 items-center justify-center rounded-lg border border-border-strong text-base font-semibold text-text-2 hover:bg-surface-2"
        >
          Já tenho conta · Entrar
        </Link>
        <Link
          href={routes.home}
          className="inline-flex h-11 items-center justify-center text-sm font-semibold text-link hover:underline"
        >
          Voltar para o início
        </Link>
      </div>
    </section>
  );
}
