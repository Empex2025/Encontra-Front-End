"use client";

import { Cookie } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { readCookieChoice, saveCookieChoice, subscribeCookieChoice } from "@/lib/domain/cookie-consent";
import { routes } from "@/lib/routes";

/** Aviso de cookies na primeira visita; some quando há uma decisão gravada. */
export function CookieNotice() {
  // No servidor e na hidratação não há decisão lida: o aviso só aparece no cliente.
  const choice = useSyncExternalStore(
    subscribeCookieChoice,
    () => readCookieChoice() ?? "none",
    () => "unknown",
  );
  if (choice !== "none") return null;

  return (
    <section
      aria-labelledby="cookies-title"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-[400px] flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-[18px] text-text shadow-pop lg:inset-x-auto lg:top-24 lg:right-6 lg:bottom-auto lg:mx-0 lg:w-[400px]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
          <Cookie className="size-4" aria-hidden />
        </span>
        <h2 id="cookies-title" className="text-[15px] leading-5 font-bold text-text-strong">
          Sua privacidade
        </h2>
      </div>
      <p className="text-[13px] leading-[19px] text-text-muted">
        Usamos cookies para o site funcionar, lembrar suas preferências e entender o que pode melhorar. Você
        escolhe.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => saveCookieChoice("all")}
          className="h-[38px] flex-1 rounded-lg bg-primary px-3 text-[13px] font-bold text-on-primary hover:bg-primary-hover"
        >
          Aceitar todos
        </button>
        <button
          type="button"
          onClick={() => saveCookieChoice("necessary")}
          className="h-[38px] flex-1 rounded-lg border border-primary bg-surface px-3 text-[13px] font-bold text-text-strong hover:bg-surface-2"
        >
          Só os necessários
        </button>
      </div>
      <Link href={`${routes.institucional}/cookies`} className="text-xs font-bold text-link hover:underline">
        Personalizar ou ler a política de cookies ›
      </Link>
    </section>
  );
}
