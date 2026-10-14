"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bell,
  Bookmark,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
  MapPin,
  Heart,
  Activity,
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
import { btnDanger, btnOutline, btnPrimary, Card, errMsg, Loading } from "./shared";
import { TabConfig } from "./tab-config";
import { TabEnderecos } from "./tab-enderecos";
import { TabInteresses } from "./tab-interesses";
import { TabPerfil } from "./tab-perfil";
import { TabPrivacidade, useLeave } from "./tab-privacidade";

const TABS = [
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "enderecos", label: "Endereços", icon: MapPin },
  { id: "interesses", label: "Interesses", icon: Heart },
  { id: "notif", label: "Notificações", icon: Bell },
  { id: "priv", label: "Privacidade e segurança", icon: ShieldCheck },
  { id: "config", label: "Configurações", icon: Settings },
] as const;
type TabId = (typeof TABS)[number]["id"];

const since = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">Minha Conta</h1>

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

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <section className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-5 text-center">
            <span
              aria-hidden
              className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-on-primary"
            >
              {initials(p?.name ?? me?.name ?? "")}
            </span>
            <p className="text-lg font-bold text-text-strong">{p?.name ?? me?.name ?? "—"}</p>
            <p className="text-sm text-text-muted">
              {p ? `Na EncontraÊ desde ${since(p.createdAt)}` : "Data de cadastro indisponível"}
            </p>
            <ul className="mt-2 grid w-full grid-cols-3 gap-2 text-center text-sm">
              {[
                ["Favoritos", counters?.favorites, "itens"],
                ["Seguindo", counters?.following, "lojas"],
                ["Alertas", counters?.alerts, "alertas"],
              ].map(([l, n, aba]) => (
                <li key={l as string}>
                  <Link
                    href={`${routes.favoritos}?aba=${aba}`}
                    className="flex min-h-14 flex-col items-center justify-center rounded-lg hover:bg-surface-2"
                  >
                    <span className="text-lg font-bold text-text-strong">{n ?? "—"}</span>
                    <span className="text-text-muted">{l}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <nav aria-label="Seções da conta" className="rounded-2xl border border-border bg-surface p-2">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col">
              {TABS.map((t) => {
                const Icon = t.icon;
                const on = t.id === tab;
                return (
                  <li key={t.id} className="shrink-0">
                    <button
                      type="button"
                      aria-current={on ? "page" : undefined}
                      onClick={() => go(t.id)}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold whitespace-nowrap",
                        on ? "bg-selected text-text-strong" : "text-text-2 hover:bg-surface-2",
                      )}
                    >
                      <Icon className="size-4" aria-hidden /> {t.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <ul className="flex flex-col rounded-2xl border border-border bg-surface p-2 text-sm font-semibold text-text-2">
            <li>
              <Link
                href={routes.atividade}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-surface-2"
              >
                <Activity className="size-4" aria-hidden /> Minha atividade
              </Link>
            </li>
            <li>
              <Link
                href={routes.favoritos}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-surface-2"
              >
                <Bookmark className="size-4" aria-hidden /> Favoritos
              </Link>
            </li>
            <li>
              <Link
                href={routes.ajuda}
                className="flex min-h-11 items-center gap-2 rounded-lg px-3 hover:bg-surface-2"
              >
                <HelpCircle className="size-4" aria-hidden /> Central de Ajuda
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-danger-text hover:bg-surface-2"
              >
                <LogOut className="size-4" aria-hidden /> Sair
              </button>
            </li>
          </ul>

          <section className="flex items-start gap-3 rounded-2xl border border-border bg-accent-soft p-4">
            <Store className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
            <div>
              <p className="font-bold text-text-strong">Tem um negócio?</p>
              <p className="text-sm text-text-muted">
                Esta é a conta de quem procura produtos e serviços. Para falar sobre a sua loja ou os seus
                serviços,{" "}
                <Link
                  href={`${routes.ajuda}?aba=contato`}
                  className="font-semibold text-link hover:underline"
                >
                  fale com a gente
                </Link>
                .
              </p>
            </div>
          </section>
        </aside>

        <div id={`aba-${tab}`} role="region" aria-label={TABS.find((t) => t.id === tab)?.label}>
          {tab === "notif" ? (
            <Card title="Notificações">
              <NotificationPrefsForm />
            </Card>
          ) : tab === "interesses" ? (
            <TabInteresses />
          ) : tab === "enderecos" ? (
            <TabEnderecos />
          ) : tab === "priv" ? (
            <TabPrivacidade profile={q.data} profileState={profileState} />
          ) : tab === "config" ? (
            <TabConfig profile={q.data} profileState={profileState} />
          ) : q.isPending ? (
            <Card title="Seus dados">
              <Loading />
            </Card>
          ) : q.isError ? (
            <Card title="Seus dados">
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
          <p className="mb-4 text-text-muted">
            Seus favoritos e alertas continuam salvos para quando você voltar.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={btnDanger}
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Saindo…" : "Sair"}
            </button>
            <button type="button" className={btnOutline} onClick={() => setLogoutOpen(false)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
