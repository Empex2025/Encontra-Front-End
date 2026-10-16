"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { AUTH_ACTIONS, type AuthActionType, savePendingAction } from "@/lib/domain/auth-actions";
import { routes } from "@/lib/routes";

type Ctx = {
  /** true se já há sessão. Para visitante, abre o convite e devolve false. */
  requireAuth: (action: AuthActionType, targetId?: string, returnTo?: string) => boolean;
};
const AuthInviteContext = createContext<Ctx | null>(null);

export function useRequireAuth() {
  const ctx = useContext(AuthInviteContext);
  if (!ctx) throw new Error("useRequireAuth precisa estar dentro de AuthInviteProvider");
  return ctx.requireAuth;
}

/** Convite para entrar: só aparece quando o visitante tenta uma ação que pede conta, nunca ao abrir a página. */
export function AuthInviteProvider({ children }: { children: React.ReactNode }) {
  const { me } = useSession();
  const pathname = usePathname();
  const [action, setAction] = useState<AuthActionType | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const returnTo = () =>
    typeof window === "undefined" ? pathname : `${window.location.pathname}${window.location.search}`;

  const requireAuth = useCallback(
    (type: AuthActionType, targetId?: string, to?: string) => {
      if (me) return true;
      savePendingAction({ type, targetId, returnTo: to ?? returnTo() });
      setTarget(to ?? null);
      setAction(type);
      return false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- returnTo lê o endereço atual na hora do clique
    [me],
  );

  useEffect(() => {
    if (!action) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setAction(null);
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [action]);

  const back = encodeURIComponent(action ? (target ?? returnTo()) : "/");
  const info = action ? AUTH_ACTIONS[action] : null;

  return (
    <AuthInviteContext.Provider value={{ requireAuth }}>
      {children}
      {info && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
            className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-surface p-6 text-text shadow-pop"
          >
            <button
              type="button"
              onClick={() => setAction(null)}
              aria-label="Fechar"
              className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full text-text-subtle hover:bg-surface-2"
            >
              <X className="size-5" aria-hidden />
            </button>
            <div className="flex flex-col gap-1 pr-8">
              <h2 id="invite-title" className="text-xl font-bold text-text-strong">
                {info.title}
              </h2>
              <p className="text-base text-text-muted">{info.text}</p>
            </div>
            <Link
              href={`${routes.cadastro}?voltar=${back}`}
              onClick={() => setAction(null)}
              className="flex h-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-on-primary hover:bg-primary-hover"
            >
              Criar conta grátis
            </Link>
            <Link
              href={`${routes.entrar}?voltar=${back}`}
              onClick={() => setAction(null)}
              className="flex h-12 items-center justify-center rounded-lg border border-border-strong text-base font-semibold text-text-2 hover:bg-surface-2"
            >
              Já tem conta? Entrar
            </Link>
            <button
              type="button"
              onClick={() => setAction(null)}
              className="h-11 text-sm font-semibold text-text-muted hover:underline"
            >
              Agora não
            </button>
          </div>
        </div>
      )}
    </AuthInviteContext.Provider>
  );
}
