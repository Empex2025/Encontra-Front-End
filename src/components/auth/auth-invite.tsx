"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useState } from "react";

import { useSession } from "@/hooks/use-session";
import { type AuthActionType, savePendingAction } from "@/lib/domain/auth-actions";

import { InviteDialog } from "./invite-dialog";

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

  return (
    <AuthInviteContext.Provider value={{ requireAuth }}>
      {children}
      {action && (
        <InviteDialog action={action} backTo={target ?? returnTo()} onClose={() => setAction(null)} />
      )}
    </AuthInviteContext.Provider>
  );
}
