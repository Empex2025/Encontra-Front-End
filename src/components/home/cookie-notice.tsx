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
      className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-border bg-surface p-4 text-text shadow-pop lg:bottom-4 lg:left-auto lg:ml-auto lg:max-w-sm"
    >
      <div className="flex items-start gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
        <div className="flex flex-col gap-1">
          <h2 id="cookies-title" className="text-base font-bold text-text-strong">
            Sua privacidade
          </h2>
          <p className="text-sm text-text-muted">
            Usamos o necessário para o site funcionar e, se você deixar, medimos como ele é usado para
            melhorar a busca. Nunca vendemos seus dados pessoais.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => saveCookieChoice("all")}
          className="h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover"
        >
          Aceitar todos
        </button>
        <button
          type="button"
          onClick={() => saveCookieChoice("necessary")}
          className="h-11 flex-1 rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-2 hover:bg-surface-2"
        >
          Só os necessários
        </button>
      </div>
      <Link
        href={`${routes.institucional}/cookies`}
        className="text-sm font-semibold text-link hover:underline"
      >
        Personalizar ou ler a política de cookies ›
      </Link>
    </section>
  );
}
