"use client";

import {
  Bell,
  CalendarCheck,
  Heart,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  Scale,
  Star,
  Tag,
  ThumbsUp,
  User,
  UserPlus,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { AUTH_ACTIONS, type AuthActionType } from "@/lib/domain/auth-actions";
import { routes } from "@/lib/routes";

import { linkCls, primaryBtnCls } from "./auth-card";
import { cn } from "@/components/ui/cn";
import { SocialButtons } from "./social-buttons";

/** Ícone de cada convite (artboard Visitante: cada ação tem o seu). */
const ICONS: Record<AuthActionType, LucideIcon> = {
  favorite: Heart,
  follow: UserPlus,
  chat: MessageCircle,
  review: Star,
  alert: Bell,
  coupon: Tag,
  quote: FileText,
  saveComparison: Scale,
  want: Megaphone,
  reserve: CalendarCheck,
  like: Heart,
  helpful: ThumbsUp,
  comment: MessageCircle,
  attend: CalendarCheck,
  interest: Star,
  reminder: Bell,
  openChats: MessageCircle,
  openNotifications: Bell,
  openFavorites: Heart,
  openAccount: User,
};

/**
 * Pop-up "Entre para…" do protótipo: 460 px, ícone de 72 px, título 22/30, botão "Criar conta grátis",
 * Google/Apple, "Já tem conta? Entrar" e "Agora não". Esc, clique fora e "Agora não" fecham.
 */
export function InviteDialog({
  action,
  backTo,
  onClose,
}: {
  action: AuthActionType;
  /** Para onde voltar depois de entrar ou criar a conta. */
  backTo: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const info = AUTH_ACTIONS[action];
  const Icon = ICONS[action];
  const back = encodeURIComponent(backTo);

  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/45 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        className="anim-rise flex max-h-full w-full max-w-[460px] flex-col items-center gap-3.5 overflow-y-auto rounded-[20px] bg-surface p-6 text-center text-text shadow-[0px_8px_24px_rgba(0,0,0,0.25)] sm:p-8"
      >
        <span className="flex size-[72px] items-center justify-center rounded-3xl bg-navy text-amber">
          <Icon className="size-8" aria-hidden />
        </span>
        <h2 id="invite-title" className="text-[22px] leading-[30px] font-extrabold text-text-strong">
          {info.title}
        </h2>
        <p className="text-sm leading-[21px] text-text-muted">{info.text}</p>
        <div className="mt-1.5 flex w-full flex-col gap-2.5">
          <Link
            href={`${routes.cadastro}?voltar=${back}`}
            onClick={onClose}
            className={cn(primaryBtnCls, "h-[46px] w-full text-[15px] font-bold")}
          >
            Criar conta grátis
          </Link>
          <SocialButtons compact />
          <span className="text-[13px] text-text-muted">
            Já tem conta?{" "}
            <Link href={`${routes.entrar}?voltar=${back}`} onClick={onClose} className={linkCls}>
              Entrar
            </Link>
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-11 items-center text-[13px] font-semibold text-text-subtle hover:underline"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
