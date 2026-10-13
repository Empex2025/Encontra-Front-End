"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ErrorState } from "@/components/ui/error-state";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { type NotificationPrefs, notifications, type PrefsPatch } from "@/lib/api/me";

import { errMsg, Loading } from "./shared";

const KEY = ["me", "notification-prefs"];

const WHAT: { key: keyof NotificationPrefs["categories"]; label: string; hint?: string }[] = [
  { key: "alerts", label: "Alertas" },
  { key: "offers", label: "Ofertas e cupons" },
  { key: "stores", label: "Novidades de quem segue" },
  { key: "chat", label: "Respostas no chat" },
  { key: "nearby", label: "Acontecendo perto de você", hint: "Resumo semanal. Começa desligado." },
  { key: "security", label: "Segurança" },
];
const WHERE: { key: keyof NotificationPrefs["channels"]; label: string }[] = [
  { key: "site", label: "Na EncontraÊ" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
];
const LOCKED_MSG = "Avisos de segurança ficam sempre ligados para proteger sua conta.";

/** Preferências de aviso: cada chave grava na hora (PATCH), sem botão "Salvar". Usada em Minha Conta e na tela de notificações. */
export function NotificationPrefsForm() {
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: KEY, queryFn: notifications.prefs });
  const save = useMutation({
    mutationFn: notifications.savePrefs,
    onMutate: async (patch: PrefsPatch) => {
      await qc.cancelQueries({ queryKey: KEY });
      const before = qc.getQueryData<NotificationPrefs>(KEY);
      if (before) {
        qc.setQueryData<NotificationPrefs>(KEY, {
          categories: { ...before.categories, ...patch.categories },
          channels: { ...before.channels, ...patch.channels },
          quietHours: patch.quietHours ?? before.quietHours,
        });
      }
      return { before };
    },
    onSuccess: (fresh) => qc.setQueryData(KEY, fresh),
    onError: (e, _p, ctx) => {
      if (ctx?.before) qc.setQueryData(KEY, ctx.before);
      toast(errMsg(e, "Não foi possível salvar."), "info");
    },
  });

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const p = q.data;

  return (
    <div className="flex flex-col gap-5">
      <fieldset className="divide-y divide-border">
        <legend className="mb-1 text-lg font-bold text-text-strong">O que avisar</legend>
        {WHAT.map((w) => (
          <Switch
            key={w.key}
            label={w.label}
            hint={w.hint}
            checked={p.categories[w.key]}
            locked={w.key === "security"}
            onChange={(v) => save.mutate({ categories: { [w.key]: v } })}
          />
        ))}
        <p className="pt-2 text-sm text-text-muted">{LOCKED_MSG}</p>
      </fieldset>
      <fieldset className="divide-y divide-border">
        <legend className="mb-1 text-lg font-bold text-text-strong">Por onde avisar</legend>
        {WHERE.map((w) => (
          <Switch
            key={w.key}
            label={w.label}
            checked={p.channels[w.key]}
            locked={w.key === "site"}
            onChange={(v) => save.mutate({ channels: { [w.key]: v } })}
          />
        ))}
      </fieldset>
      <fieldset>
        <legend className="mb-1 text-lg font-bold text-text-strong">Não perturbe à noite</legend>
        <Switch
          label="Silenciar das 22h às 8h"
          hint="Os avisos esperam e chegam de manhã. Segurança sempre chega."
          checked={p.quietHours}
          onChange={(v) => save.mutate({ quietHours: v })}
        />
      </fieldset>
    </div>
  );
}
