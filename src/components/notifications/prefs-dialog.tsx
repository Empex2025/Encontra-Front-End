"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { type NotificationPrefs, notifications, type PrefsPatch } from "@/lib/api/me";

// Mesma chave da aba "Notificações" de Minha Conta: as duas telas mostram o mesmo estado.
const KEY = ["me", "notification-prefs"];

const WHAT: { key: keyof NotificationPrefs["categories"]; label: string; hint: string; locked?: boolean }[] =
  [
    {
      key: "alerts",
      label: "Alertas inteligentes",
      hint: "Estoque, preço, promoção e novas lojas do que você acompanha",
    },
    { key: "offers", label: "Ofertas e cupons", hint: "Cupons do dia e promoções de lojas que você segue" },
    { key: "stores", label: "Lojas que sigo", hint: "Produtos novos e novidades" },
    { key: "chat", label: "Respostas no chat", hint: "Quando uma loja ou prestador responder" },
    { key: "nearby", label: "Acontecendo perto de você", hint: "Resumo semanal. Começa desligado." },
    {
      key: "security",
      label: "Minha atividade e segurança",
      hint: "Avaliações, respostas e acessos à conta. Segurança fica sempre ligada.",
      locked: true,
    },
  ];
const WHERE: { key: keyof NotificationPrefs["channels"]; label: string }[] = [
  { key: "site", label: "No site" },
  { key: "email", label: "E-mail" },
  { key: "whatsapp", label: "WhatsApp" },
];

/** Preferências de notificação (protótipo › Notificações › Preferências). Cada chave grava na hora. */
export function NotificationPrefsDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: KEY, queryFn: notifications.prefs });
  const save = useMutation({
    mutationFn: notifications.savePrefs,
    onMutate: async (patch: PrefsPatch) => {
      await qc.cancelQueries({ queryKey: KEY });
      const before = qc.getQueryData<NotificationPrefs>(KEY);
      if (before)
        qc.setQueryData<NotificationPrefs>(KEY, {
          categories: { ...before.categories, ...patch.categories },
          channels: { ...before.channels, ...patch.channels },
          quietHours: patch.quietHours ?? before.quietHours,
        });
      return { before };
    },
    onSuccess: (fresh) => qc.setQueryData(KEY, fresh),
    onError: (e, _p, ctx) => {
      if (ctx?.before) qc.setQueryData(KEY, ctx.before);
      toast(e instanceof Error && e.message ? e.message : "Não foi possível salvar.", "info");
    },
  });
  const p = q.data;

  return (
    <Modal title="Preferências de notificação" onClose={onClose} className="w-[min(94vw,560px)]!">
      <p className="-mt-2 text-[13px] text-text-muted">
        Você só recebe avisos do que segue, salvou ou pediu para acompanhar.
      </p>
      {q.isPending ? (
        <p role="status" className="py-8 text-center text-text-muted">
          Carregando…
        </p>
      ) : q.isError ? (
        <ErrorState
          error={q.error}
          onRetry={() => q.refetch()}
          title="Não foi possível carregar suas preferências de aviso"
        />
      ) : (
        <>
          <fieldset className="divide-y divide-surface-2">
            <legend className="sr-only">O que avisar</legend>
            {WHAT.map((w) => (
              <Switch
                key={w.key}
                label={w.label}
                hint={w.hint}
                checked={p!.categories[w.key]}
                locked={w.locked}
                onChange={(v) => save.mutate({ categories: { [w.key]: v } })}
              />
            ))}
          </fieldset>
          <div className="flex items-start gap-4">
            <span className="pt-1.5 text-[13px] font-bold text-text-strong">Avisar por</span>
            <div className="flex flex-wrap gap-2">
              {WHERE.map((w) => {
                const on = p!.channels[w.key];
                const locked = w.key === "site";
                return (
                  <button
                    key={w.key}
                    type="button"
                    aria-pressed={on}
                    disabled={locked}
                    onClick={() => save.mutate({ channels: { [w.key]: !on } })}
                    className={cn(
                      "h-9 rounded-full border px-3.5 text-[13px] font-semibold text-text-strong",
                      on ? "border-primary bg-selected" : "border-border bg-surface hover:bg-surface-2",
                    )}
                  >
                    {on ? "✓ " : ""}
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Switch
            label="Silenciar das 22h às 8h"
            hint="Os avisos esperam e chegam de manhã. Segurança sempre chega."
            checked={p!.quietHours}
            onChange={(v) => save.mutate({ quietHours: v })}
          />
        </>
      )}
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-lg border border-border bg-surface text-sm font-semibold text-text hover:bg-surface-2"
      >
        Fechar
      </button>
    </Modal>
  );
}
