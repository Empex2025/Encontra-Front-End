"use client";

import { useEffect, useRef } from "react";

import { useSession } from "@/hooks/use-session";
import { type AuthActionType, readPendingAction, takePendingAction } from "@/lib/domain/auth-actions";

/**
 * Conclui, uma única vez, a ação que o visitante tentou antes de entrar (favoritar, seguir, conversar…).
 * Só roda se a ação pendente for deste tipo e deste alvo, e se já houver sessão.
 */
export function useResumeAction(type: AuthActionType, targetId: string | undefined, run: () => void) {
  const { me } = useSession();
  const latest = useRef(run);
  useEffect(() => {
    latest.current = run;
  });
  const done = useRef(false);
  useEffect(() => {
    if (!me || done.current) return;
    const p = readPendingAction();
    if (!p || p.type !== type || (targetId !== undefined && p.targetId !== targetId)) return;
    if (!takePendingAction(type)) return;
    done.current = true;
    queueMicrotask(() => latest.current());
  }, [me, type, targetId]);
}
