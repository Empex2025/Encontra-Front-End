"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Settings2, ShieldAlert, Store, Ticket, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { NotificationPrefsForm } from "@/components/account/notification-prefs";
import { AlertsPanel } from "@/components/alerts/alerts-panel";
import { LockedBody, useAccess } from "@/components/auth/session-gate";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState, ListSkeleton } from "@/components/ui/list-states";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { queryKeys } from "@/lib/api/endpoints";
import { me, type Notification, notifications, type NotificationType } from "@/lib/api/me";
import { groupNotifications, safeInternalHref } from "@/lib/domain/notification-groups";
import { formatTimeAgo } from "@/lib/format";

const TABS = [
  { id: "todas", label: "Todas", type: undefined },
  { id: "alertas", label: "Alertas", type: "alert" },
  { id: "cupons", label: "Ofertas e cupons", type: "coupon" },
  { id: "lojas", label: "Lojas que sigo", type: "store" },
  { id: "atividade", label: "Minha atividade", type: "activity" },
] as const;
type TabId = (typeof TABS)[number]["id"] | "gerenciar";

const TYPE_META: Record<NotificationType, { label: string; icon: typeof Bell }> = {
  alert: { label: "Alerta", icon: Bell },
  coupon: { label: "Cupom", icon: Ticket },
  store: { label: "Loja", icon: Store },
  activity: { label: "Atividade", icon: CheckCheck },
  security: { label: "Segurança", icon: ShieldAlert },
};

export function NotificationsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("aba");
  const tab: TabId =
    raw === "alertas-gerenciar" || raw === "gerenciar"
      ? "gerenciar"
      : (TABS.find((t) => t.id === raw)?.id ?? "todas");
  const setTab = (t: TabId) => router.replace(`${pathname}?aba=${t}`, { scroll: false });
  const access = useAccess();
  const member = access === "member";
  const [prefsOpen, setPrefsOpen] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const type = TABS.find((t) => t.id === tab)?.type;

  const q = useInfiniteQuery({
    queryKey: ["notifications", type ?? "all"],
    enabled: member && tab !== "gerenciar",
    queryFn: ({ pageParam }) => notifications.list(type, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
  });
  // Os contadores vêm de qualquer consulta de lista; usa a "Todas" para as bolhas.
  const all = useQuery({
    queryKey: ["notifications", "all", "counts"],
    queryFn: () => notifications.list(undefined, 1),
    enabled: member,
  });
  const alertsTotal = useQuery({ queryKey: ["me", "alerts"], queryFn: me.alerts, enabled: member });
  const unread = all.data?.unread;

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["notifications"] });
    void qc.invalidateQueries({ queryKey: queryKeys.unread });
  };
  const markRead = useMutation({ mutationFn: notifications.read, onSuccess: refresh });
  const markAll = useMutation({
    mutationFn: () => notifications.readAll(type),
    onSuccess: () => {
      toast("Tudo marcado como lido.");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível marcar como lidas.", "info"),
  });
  const remove = useMutation({
    mutationFn: notifications.remove,
    onSuccess: refresh,
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível remover.", "info"),
  });

  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  // Sem resposta do servidor o total é desconhecido: nunca vira “tudo em dia”.
  const total = unread ? unread.all : null;
  const bubble = (id: TabId) =>
    unread
      ? ({
          todas: unread.all,
          alertas: unread.alert,
          cupons: unread.coupon,
          lojas: unread.store,
          atividade: unread.activity,
          gerenciar: 0,
        }[id] ?? 0)
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-strong">Notificações</h1>
          <p className="text-sm text-text-muted" aria-live="polite">
            {!member
              ? "Seus avisos aparecem aqui depois que você entrar."
              : total === null
                ? "— notificações não lidas"
                : total === 0
                  ? "Tudo em dia ✓"
                  : total === 1
                    ? "1 notificação não lida"
                    : `${total} notificações não lidas`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!total || markAll.isPending}
            onClick={() => markAll.mutate()}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
          >
            <CheckCheck className="size-4" aria-hidden />
            Marcar todas como lidas
          </button>
          <button
            type="button"
            disabled={!member}
            onClick={() => setPrefsOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50"
          >
            <Settings2 className="size-4" aria-hidden />
            Preferências
          </button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Filtros de notificações"
        className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {[
          ...TABS,
          {
            id: "gerenciar" as const,
            label: `Gerenciar alertas (${alertsTotal.data ? alertsTotal.data.items.length : "—"})`,
          },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold",
              tab === t.id
                ? "border-primary bg-primary text-on-primary"
                : "border-border bg-surface text-text hover:bg-surface-2",
            )}
          >
            {t.label}
            {bubble(t.id) > 0 && (
              <span className="rounded-full bg-danger px-1.5 text-xs font-bold text-white">
                {bubble(t.id)}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "gerenciar" ? (
        <AlertsPanel access={access} />
      ) : !member ? (
        <LockedBody
          access={access}
          area="notificacoes"
          hint="Avisos de preço, cupons e novidades de quem você segue chegam aqui."
        />
      ) : q.isPending ? (
        <ListSkeleton label="Carregando notificações…" />
      ) : q.isError ? (
        <ErrorState
          title="Não foi possível carregar suas notificações"
          error={q.error}
          onRetry={() => q.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-8 text-text-subtle" aria-hidden />}
          title="Nenhuma notificação por aqui."
          hint="Quando um preço baixar, um cupom chegar ou alguém que você segue publicar algo, avisamos aqui."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {groupNotifications(items).map((g) => (
            <section key={g.id} aria-label={g.label} className="flex flex-col gap-2">
              <h2 className="text-sm font-bold tracking-wide text-text-subtle uppercase">{g.label}</h2>
              <ul className="flex flex-col gap-2">
                {g.items.map((n) => (
                  <Row
                    key={n.id}
                    n={n}
                    onRead={() => !n.read && markRead.mutate(n.id)}
                    onRemove={() => remove.mutate(n.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
          {q.hasNextPage && (
            <button
              type="button"
              disabled={q.isFetchingNextPage}
              onClick={() => q.fetchNextPage()}
              className="self-center rounded-lg border border-border-strong px-5 py-2.5 text-sm font-bold"
            >
              {q.isFetchingNextPage ? "Carregando…" : "Ver mais"}
            </button>
          )}
        </div>
      )}
      {prefsOpen && <PrefsDialog onClose={() => setPrefsOpen(false)} />}
    </div>
  );
}

function Row({ n, onRead, onRemove }: { n: Notification; onRead: () => void; onRemove: () => void }) {
  const meta = TYPE_META[n.type];
  const Icon = meta.icon;
  const href = safeInternalHref(n.action?.href);
  return (
    <li
      className={cn(
        "relative flex gap-3 rounded-2xl border p-4",
        n.read ? "border-border bg-surface" : "border-primary/40 bg-surface-2",
      )}
    >
      <button
        type="button"
        onClick={onRead}
        aria-label={n.read ? n.title : `${n.title} (marcar como lida)`}
        className="flex min-w-0 flex-1 gap-3 text-left"
      >
        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-2 text-text-2">
          {n.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <Icon className="size-5" aria-hidden />
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-xs text-text-subtle">
            {[meta.label, formatTimeAgo(n.createdAt)].filter(Boolean).join(" · ")}
          </span>
          <span className={cn("text-text-strong", !n.read && "font-bold")}>{n.title}</span>
          {n.text && <span className="text-sm text-text-muted">{n.text}</span>}
        </span>
      </button>
      <div className="flex shrink-0 flex-col items-end justify-between gap-2">
        <span className="flex items-center gap-1">
          {!n.read && <span className="bg-info size-2.5 rounded-full" role="img" aria-label="Não lida" />}
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover notificação: ${n.title}`}
            className="flex size-9 items-center justify-center rounded-full text-text-subtle hover:bg-surface-2"
          >
            <X className="size-4" aria-hidden />
          </button>
        </span>
        {n.action && href && (
          <Link href={href} onClick={onRead} className="text-sm font-semibold text-link hover:underline">
            {n.action.label} ›
          </Link>
        )}
      </div>
    </li>
  );
}

function PrefsDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Preferências de notificação" onClose={onClose}>
      <NotificationPrefsForm />
      <button
        type="button"
        onClick={onClose}
        className="mt-4 h-11 w-full rounded-lg border border-border-strong font-semibold hover:bg-surface-2"
      >
        Fechar
      </button>
    </Modal>
  );
}
