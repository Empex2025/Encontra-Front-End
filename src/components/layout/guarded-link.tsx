"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { useSession } from "@/hooks/use-session";
import { type AuthActionType } from "@/lib/domain/auth-actions";

/**
 * Link de uma área que pede conta. Para visitante, o clique abre o convite para entrar (e depois do login a pessoa
 * vai direto para o destino). Enquanto a sessão carrega, o link funciona normal: a própria página trata o visitante.
 */
export function GuardedLink({
  guard,
  href,
  onClick,
  ...rest
}: ComponentProps<typeof Link> & { guard?: AuthActionType; href: string }) {
  const { isGuest } = useSession();
  const requireAuth = useRequireAuth();
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (guard && isGuest && !requireAuth(guard, undefined, href)) e.preventDefault();
      }}
      {...rest}
    />
  );
}
