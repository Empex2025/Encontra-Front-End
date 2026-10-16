"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  Home,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/hooks/use-session";
import { account } from "@/lib/api/account";
import { initials } from "@/lib/domain/account";
import { routes } from "@/lib/routes";

import { NotificationPrefsForm } from "./notification-prefs";
import { btnDanger, btnLineMuted, btnPrimary, Card, errMsg, Loading } from "./shared";
import { TabConfig } from "./tab-config";
import { TabEnderecos } from "./tab-enderecos";
import { TabInteresses } from "./tab-interesses";
import { TabPerfil } from "./tab-perfil";
import { TabPrivacidade, useLeave } from "./tab-privacidade";

const TABS = [
  { id: "perfil", label: "Meu perfil", icon: UserRound },
  { id: "enderecos", label: "Endereços e localização", icon: Home },
  { id: "interesses", label: "Interesses", icon: Sparkles },
  { id: "notif", label: "Notificações", icon: Bell },
  { id: "priv", label: "Privacidade e segurança", icon: ShieldCheck },
  { id: "config", label: "Configurações", icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];

const since = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

const itemCls =
  "flex h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm whitespace-nowrap hover:bg-surface-2";

export function AccountView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const toast = useToast();
  const { me } = useSession();
  const raw = params.get("aba");
  const tab: TabId = TABS.some((t) => t.id === raw) ? (raw as TabId) : "perfil";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const leave = useLeave();
  const q = useQuery({ queryKey: ["me", "profile"], queryFn: account.profile });
  const logout = useMutation({
    mutationFn: () => account.logout(false),
    onSuccess: leave,
    onError: (e) => toast(errMsg(e), "info"),
  });
  const cancelDeletion = useMutation({
    mutationFn: account.cancelDeletion,
    onSuccess: () => {
      void q.refetch();
      toast("Exclusão cancelada. Que bom que você ficou!");
    },
    onError: (e) => toast(errMsg(e), "info"),
  });

  const go = (t: TabId) => router.replace(`${pathname}?aba=${t}`, { scroll: false });
  const p = q.data;
  const counters = me?.counters;
  const profileState = {
    pending: q.isPending,
    error: q.isError ? q.error : null,
    retry: () => void q.refetch(),
  };
  const name = p?.name ?? me?.name ?? "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-9 font-bold text-text-strong sm:text-[32px] sm:leading-10">
          Minha Conta
        </h1>
        <p className="text-base text-text-muted">
          Seus dados, onde você busca, o que te interessa e como quer ser avisado.
        </p>
      </div>

      {p?.deletionScheduledFor && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-danger bg-danger-soft p-4 text-danger-text"
        >
          <p className="flex-1 font-semibold">
            Sua conta será excluída em{" "}
            {new Date(p.deletionScheduledFor).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
          <button
            type="button"
            className={btnPrimary}
            disabled={cancelDeletion.isPending}
            onClick={() => cancelDeletion.mutate()}
          >
            Cancelar exclusão
          </button>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
        <aside className="contents lg:flex lg:flex-col lg:gap-4">
          <section className="order-1 flex flex-col items-center gap-2 rounded-2xl bg-navy px-4 py-6 text-center lg:order-none">
            <span
              aria-hidden
              className="flex size-[72px] items-center justify-center rounded-full bg-amber text-[26px] font-extrabold text-navy"
            >
              {initials(name)}
            </span>
            <p className="text-lg font-extrabold text-white">{name || "—"}</p>
            <p className="text-xs text-navy-200">
              {p ? `Na EncontraÊ desde ${since(p.createdAt)}` : "Data de cadastro indisponível"}
            </p>
            <ul className="mt-1 grid w-full grid-cols-3 gap-1.5 text-center">
              {[
                ["favoritos", counters?.favorites, "itens"],
                ["seguindo", counters?.following, "lojas"],
                ["alertas", counters?.alerts, "alertas"],
              ].map(([l, n, aba]) => (
                <li key={l as string}>
                  <Link
                    href={`${routes.favoritos}?aba=${aba}`}
                    className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[10px] bg-white/8 px-1 py-2 hover:bg-white/16"
                  >
                    <span className="text-lg leading-6 font-extrabold text-amber">{n ?? "—"}</span>
                    <span className="text-[11px] text-navy-50">{l}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <nav
            aria-label="Seções da conta"
            className="order-2 flex flex-col gap-0.5 rounded-2xl bg-surface p-2 shadow-card lg:order-none"
          >
            <ul className="flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
              {TABS.map((t) => {
                const Icon = t.icon;
                const on = t.id === tab;
                return (
                  <li key={t.id} className="shrink-0 lg:w-full">
                    <button
                      type="button"
                      aria-current={on ? "page" : undefined}
                      onClick={() => go(t.id)}
                      className={cn(
                        itemCls,
                        on ? "bg-selected font-bold text-text-strong" : "font-medium text-text-muted",
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" aria-hidden /> {t.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="hidden flex-col gap-0.5 lg:flex">
              <ExtraLinks onLogout={() => setLogoutOpen(true)} />
            </div>
          </nav>

          <div className="order-4 flex flex-col gap-4 lg:order-none">
            <nav aria-label="Atalhos da conta" className="flex flex-col gap-0.5 rounded-2xl bg-surface p-2 shadow-card lg:hidden">
              <ExtraLinks onLogout={() => setLogoutOpen(true)} plain />
            </nav>
            <section className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-dashed border-border-strong p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-text-strong">
                <Store className="size-[18px] shrink-0" aria-hidden /> Tem um negócio?
              </p>
              <p className="text-[13px] leading-[19px] text-text-muted">
                Cadastre sua loja ou seus serviços e seja encontrado por quem procura perto de você.
              </p>
              <Link
                href={`${routes.ajuda}?aba=contato`}
                className="inline-flex h-[34px] items-center self-start rounded-lg border border-primary bg-surface px-3 text-xs font-bold text-text-strong hover:bg-surface-2"
              >
                Quero cadastrar meu negócio
              </Link>
            </section>
          </div>
        </aside>

        <div
          id={`aba-${tab}`}
          role="region"
          aria-label={TABS.find((t) => t.id === tab)?.label}
          className="order-3 flex min-w-0 flex-col gap-5 lg:order-none"
        >
          {tab === "notif" ? (
            <NotificationPrefsForm />
          ) : tab === "interesses" ? (
            <TabInteresses />
          ) : tab === "enderecos" ? (
            <TabEnderecos />
          ) : tab === "priv" ? (
            <TabPrivacidade profile={q.data} profileState={profileState} />
          ) : tab === "config" ? (
            <TabConfig profile={q.data} profileState={profileState} />
          ) : q.isPending ? (
            <Card title="Meu perfil">
              <Loading />
            </Card>
          ) : q.isError ? (
            <Card title="Meu perfil">
              <ErrorState
                error={q.error}
                onRetry={() => q.refetch()}
                title="Não foi possível carregar seus dados"
                description="Seus dados vêm do nosso servidor e não chegaram agora. Tente de novo em alguns segundos."
              />
            </Card>
          ) : (
            <TabPerfil key={q.dataUpdatedAt} profile={q.data} />
          )}
        </div>
      </div>

      {logoutOpen && (
        <Modal title="Sair da sua conta?" onClose={() => setLogoutOpen(false)}>
          <p className="text-sm text-text-muted">Você pode entrar de novo quando quiser.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnLineMuted} onClick={() => setLogoutOpen(false)}>
              Cancelar
            </button>
            <button type="button" className={btnDanger} disabled={logout.isPending} onClick={() => logout.mutate()}>
              {logout.isPending ? "Saindo…" : "Sair"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/** Minha atividade, Ajuda e Sair (separados das abas por um filete, como no protótipo). */
function ExtraLinks({ onLogout, plain }: { onLogout: () => void; plain?: boolean }) {
  return (
    <>
      {!plain && <span aria-hidden className="mx-2 my-1.5 h-px bg-surface-2" />}
      <Link href={routes.atividade} className={cn(itemCls, "font-medium text-text-2")}>
        <Activity className="size-[18px] shrink-0" aria-hidden />
        Minha atividade
        <span className="ml-auto text-right text-[11px] leading-[13px] text-text-subtle">orçamentos, cupons…</span>
      </Link>
      <Link href={routes.ajuda} className={cn(itemCls, "font-medium text-text-2")}>
        <HelpCircle className="size-[18px] shrink-0" aria-hidden /> Ajuda e suporte
      </Link>
      <button type="button" onClick={onLogout} className={cn(itemCls, "font-semibold text-danger-text")}>
        <LogOut className="size-[18px] shrink-0" aria-hidden /> Sair da conta
      </button>
    </>
  );
}
