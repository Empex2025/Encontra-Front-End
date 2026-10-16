"use client";

import { useState, useSyncExternalStore } from "react";

import { btnPrimary } from "@/components/account/shared";
import { cn } from "@/components/ui/cn";
import { Switch } from "@/components/ui/switch";
import { readCookieChoice, saveCookieChoice, subscribeCookieChoice } from "@/lib/domain/cookie-consent";

const ROWS = [
  {
    key: "necessary",
    title: "Necessários",
    text: "Mantêm você conectado, guardam o bairro escolhido e protegem contra fraudes. Sem eles o site não funciona.",
  },
  {
    key: "performance",
    title: "Desempenho",
    text: "Medem, de forma anônima, quais páginas carregam devagar ou dão erro, para melhorarmos a EncontraÊ.",
  },
  {
    key: "personalization",
    title: "Personalização",
    text: "Lembram suas buscas e interesses para sugerir lojas e ofertas mais próximas do que você gosta.",
  },
] as const;

/**
 * Controles reais da página de Cookies. A escolha é a mesma do aviso da Home (encontrae_cookies):
 * "all" liga desempenho e personalização; "necessary" deixa só os necessários.
 * Hoje o app tem uma única chave de medição, então Desempenho e Personalização andam juntos.
 */
export function CookieControls() {
  const choice = useSyncExternalStore(subscribeCookieChoice, readCookieChoice, () => null);
  const [draft, setDraft] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const on = draft ?? choice === "all";
  const dirty = draft !== null && draft !== (choice === "all");

  const save = () => {
    saveCookieChoice(on ? "all" : "necessary");
    setDraft(null);
    setSaved(true);
  };
  const change = (v: boolean) => {
    setSaved(false);
    setDraft(v);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col border-t border-border">
        {ROWS.map((r) => (
          <div key={r.key} className="flex items-start gap-5 border-b border-surface-3 py-[18px]">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center gap-2 text-base leading-6 font-bold text-text-strong">
                {r.title}
                {r.key === "necessary" && (
                  <span className="inline-flex h-5 items-center rounded-full bg-success-soft px-2 text-[11px] font-bold text-success-text">
                    Sempre ligado
                  </span>
                )}
              </span>
              <span className="text-[15px] leading-6 text-text-muted">{r.text}</span>
            </div>
            <Switch
              bare
              label={r.title}
              checked={r.key === "necessary" ? true : on}
              locked={r.key === "necessary"}
              onChange={change}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className={cn(btnPrimary, "px-[22px]")} onClick={save}>
          Salvar preferências
        </button>
        <span
          role="status"
          className={cn("text-[13px] leading-5", dirty ? "text-accent-text" : "text-text-subtle")}
        >
          {dirty
            ? "Você tem alterações não salvas."
            : saved
              ? "Preferências salvas neste navegador."
              : choice === null
                ? "Você ainda não escolheu. Só os necessários estão ligados."
                : "Preferências salvas neste navegador."}
        </span>
      </div>
    </div>
  );
}
