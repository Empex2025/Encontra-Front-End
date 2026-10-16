"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { type NotificationPrefs, notifications, type PrefsPatch } from "@/lib/api/me";
import { routes } from "@/lib/routes";

import { Card, errMsg, Loading, SettingRow } from "./shared";

const KEY = ["me", "notification-prefs"];

const WHAT: { key: keyof NotificationPrefs["categories"]; label: string; hint: string }[] = [
  {
    key: "alerts",
    label: "Alertas que você criou",
    hint: "Preço baixou, voltou ao estoque, entrou em promoção, loja nova vende.",
  },
  { key: "offers", label: "Ofertas e cupons das lojas que você segue", hint: "No máximo 1 por dia de cada loja." },
  {
    key: "stores",
    label: "Novidades das lojas e prestadores que você segue",
    hint: "Produtos novos, horários livres e stories.",
  },
  { key: "chat", label: "Respostas no chat", hint: "Quando uma loja ou prestador responde." },
  {
    key: "nearby",
    label: "Acontecendo perto de você",
    hint: "Uma seleção semanal: lojas novas, menores preços e ofertas do bairro.",
  },
  { key: "security", label: "Segurança da conta", hint: "Novo acesso, troca de senha ou de celular." },
];
const WHERE: { key: keyof NotificationPrefs["channels"]; label: string; hint: string }[] = [
  { key: "site", label: "Na EncontraÊ", hint: "O sino no topo e a tela Notificações." },
  { key: "whatsapp", label: "WhatsApp", hint: "Para alertas e respostas no chat." },
  { key: "email", label: "E-mail", hint: "Resumo semanal e segurança." },
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

  if (q.isPending)
    return (
      <Card title="O que avisar">
        <Loading />
      </Card>
    );
  if (q.isError)
    return (
      <Card title="O que avisar">
        <ErrorState
          error={q.error}
          onRetry={() => q.refetch()}
          title="Não foi possível carregar suas preferências de aviso"
        />
      </Card>
    );
  const p = q.data;

  return (
    <>
      <Card
        title="O que avisar"
        aside={
          <Link href={routes.notificacoes} className="font-bold text-link hover:underline">
            Ver minhas notificações ›
          </Link>
        }
      >
        <div className="flex flex-col">
          {WHAT.map((w) => (
            <SettingRow key={w.key} title={w.label} hint={w.hint}>
              <Switch
                bare
                label={w.label}
                checked={p.categories[w.key]}
                locked={w.key === "security"}
                onLocked={() => toast(LOCKED_MSG, "info")}
                onChange={(v) => save.mutate({ categories: { [w.key]: v } })}
              />
            </SettingRow>
          ))}
        </div>
      </Card>
      <Card title="Por onde avisar">
        <div className="flex flex-col">
          {WHERE.map((w) => (
            <SettingRow key={w.key} title={w.label} hint={w.hint}>
              <Switch
                bare
                label={w.label}
                checked={p.channels[w.key]}
                locked={w.key === "site"}
                onLocked={() => toast(LOCKED_MSG, "info")}
                onChange={(v) => save.mutate({ channels: { [w.key]: v } })}
              />
            </SettingRow>
          ))}
          <SettingRow
            title="Não perturbe à noite"
            hint="Sem avisos por WhatsApp e e-mail das 22h às 8h. Segurança continua chegando."
          >
            <Switch
              bare
              label="Não perturbe à noite"
              checked={p.quietHours}
              onChange={(v) => save.mutate({ quietHours: v })}
            />
          </SettingRow>
        </div>
      </Card>
    </>
  );
}
