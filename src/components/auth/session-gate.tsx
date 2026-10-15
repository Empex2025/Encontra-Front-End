"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Lock, RotateCw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { ListSkeleton } from "@/components/ui/list-states";
import { useSession } from "@/hooks/use-session";
import { queryKeys } from "@/lib/api/endpoints";
import { LOCKED_AREAS, type LockedArea } from "@/lib/domain/auth-actions";
import { routes } from "@/lib/routes";

/** Situação da pessoa diante de uma área da conta. `unconfirmed` = o servidor não respondeu sobre a sessão. */
export type Access = "loading" | "member" | "guest" | "unconfirmed";

const noopSubscribe = () => () => {};

export function useAccess(): Access {
  const s = useSession();
  // Na hidratação a tela tem de sair igual à do servidor ("carregando"); a sessão real entra logo depois.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!hydrated || s.isLoading) return "loading";
  if (s.me) return "member";
  // Servidor fora do ar: sem confirmar sessão, a tela se comporta como visitante (sem aviso alarmante).
  return "guest";
}

/**
 * Miolo de uma área da conta quando a pessoa ainda não pode ver os dados.
 * A página mantém título, abas e filtros; só o miolo troca por esqueleto, convite para entrar
 * (visitante) ou aviso de sessão não confirmada com "Tentar de novo".
 */
export function LockedBody({
  access,
  area,
  hint,
}: {
  access: Exclude<Access, "member">;
  area: LockedArea;
  hint?: string;
}) {
  const pathname = usePathname();
  const qc = useQueryClient();
  if (access === "loading") return <ListSkeleton label="Carregando…" />;
  if (access === "unconfirmed")
    return (
      <section
        role="alert"
        className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-10 text-center"
      >
        <h2 className="text-xl font-bold text-text-strong">Não foi possível confirmar sua sessão</h2>
        <p className="max-w-md text-text-muted">
          Não conseguimos falar com o servidor agora, por isso não sabemos se você está com a conta conectada.
          Nada foi apagado. Tente de novo em alguns segundos.
        </p>
        <button
          type="button"
          onClick={() => void qc.invalidateQueries({ queryKey: queryKeys.me, exact: true })}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-primary px-5 text-sm font-bold text-text-strong hover:bg-surface-2"
        >
          <RotateCw className="size-4" aria-hidden />
          Tentar de novo
        </button>
      </section>
    );
  const back = encodeURIComponent(pathname + (typeof window === "undefined" ? "" : window.location.search));
  return (
    <section
      aria-label="Convite para entrar"
      className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-10 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-selected text-link">
        <Lock className="size-7" aria-hidden />
      </span>
      <h2 className="text-xl font-bold text-text-strong">Entre para {LOCKED_AREAS[area]}</h2>
      <p className="max-w-md text-text-muted">
        {hint ?? "Com uma conta grátis você salva, segue e conversa com as lojas."}
      </p>
      <div className="flex w-full max-w-sm flex-col gap-3">
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
      </div>
    </section>
  );
}
