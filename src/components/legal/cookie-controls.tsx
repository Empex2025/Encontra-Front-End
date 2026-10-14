"use client";

import { useState, useSyncExternalStore } from "react";

import { btnOutline, btnPrimary, Card } from "@/components/account/shared";
import { Switch } from "@/components/ui/switch";
import { readCookieChoice, saveCookieChoice, subscribeCookieChoice } from "@/lib/domain/cookie-consent";

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

  const save = (all: boolean) => {
    saveCookieChoice(all ? "all" : "necessary");
    setDraft(null);
    setSaved(true);
  };

  return (
    <Card title="Seus cookies">
      <div className="divide-y divide-border">
        <Switch
          label="Necessários"
          hint="Mantêm você conectado e o site funcionando."
          checked
          locked
          onChange={() => {}}
        />
        <Switch
          label="Desempenho"
          hint="Nos ajudam a entender o que funciona e o que não."
          checked={on}
          onChange={(v) => {
            setSaved(false);
            setDraft(v);
          }}
        />
        <Switch
          label="Personalização"
          hint="Mostram o que combina mais com você."
          checked={on}
          onChange={(v) => {
            setSaved(false);
            setDraft(v);
          }}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} onClick={() => save(on)}>
          Salvar escolha
        </button>
        <button type="button" className={btnOutline} onClick={() => save(true)}>
          Aceitar todos
        </button>
        <button type="button" className={btnOutline} onClick={() => save(false)}>
          Só os necessários
        </button>
      </div>
      <p role="status" className="text-sm text-text-muted">
        {saved
          ? on
            ? "Escolha salva: todos os cookies liberados."
            : "Escolha salva: só os cookies necessários."
          : choice === null
            ? "Você ainda não escolheu."
            : choice === "all"
              ? "Hoje: todos os cookies liberados."
              : "Hoje: só os cookies necessários."}
      </p>
    </Card>
  );
}
