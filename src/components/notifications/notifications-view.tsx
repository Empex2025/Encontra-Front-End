"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Lock, Settings, Star, Store, Ticket, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AlertsPanel } from "@/components/alerts/alerts-panel";
import { LockedBody, useAccess } from "@/components/auth/session-gate";
import { NotificationPrefsDialog } from "@/components/notifications/prefs-dialog";
import { cn } from "@/components/ui/cn";
import { EmptyCard } from "@/components/ui/empty-card";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/list-states";
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

/** Rótulo, ícone e cores de cada tipo (protótipo › Notificações: etiqueta colorida + ícone no quadrado). */
const TYPE_META: Record<NotificationType, { label: string; icon: typeof Bell; tile: string; chip: string }> =
  {
    alert: {
      label: "Alertas",
      icon: Bell,
      tile: "bg-accent-soft text-accent-text",
      chip: "bg-accent-soft text-accent-text",
    },
    coupon: {
      label: "Ofertas e cupons",
      icon: Ticket,
      tile: "bg-success-soft text-success-text",
      chip: "bg-success-soft text-success-text",
    },
    store: {
      label: "Lojas que sigo",
      icon: Store,
      tile: "bg-selected text-link",
      chip: "bg-selected text-link",
    },
    activity: {
      label: "Minha atividade",
      icon: Star,
      tile: "bg-[color-mix(in_srgb,var(--cat-esporte)_14%,transparent)] text-[color:var(--cat-esporte)]",
      chip: "bg-[color-mix(in_srgb,var(--cat-esporte)_14%,transparent)] text-[color:var(--cat-esporte)]",
    },
    security: {
      label: "Segurança",
      icon: Lock,
      tile: "bg-surface-2 text-text-muted",
      chip: "bg-surface-2 text-text-muted",
    },
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
      toast("Todas marcadas como lidas.");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível marcar como lidas.", "info"),
  });
  const remove = useMutation({
    mutationFn: notifications.remove,
    onSuccess: () => {
      toast("Notificação removida.");
      refresh();
    },
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
  const manage = tab === "gerenciar";

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] leading-10 font-bold text-text-strong">Notificações</h1>
          <p className="text-base text-text-muted" aria-live="polite">
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
            className="h-10 rounded-lg border border-border bg-surface px-3.5 text-[13px] font-semibold text-text-strong hover:bg-surface-2 disabled:opacity-50"
          >
            ✓ Marcar todas como lidas
          </button>
          <button
            type="button"
            disabled={!member}
            onClick={() => setPrefsOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 text-[13px] font-semibold text-text-strong hover:bg-surface-2 disabled:opacity-50"
          >
            <Settings className="size-4 shrink-0" aria-hidden />
            Preferências
          </button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Filtrar notificações"
        className="flex flex-wrap items-center gap-2 border-b border-surface-3 pb-3"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold",
              tab === t.id
                ? "border-primary bg-primary text-on-primary"
                : "border-border bg-surface text-text-2 hover:bg-surface-2",
            )}
          >
            <span>{t.label}</span>
            {bubble(t.id) > 0 && (
              <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-[5px] text-[11px] text-white">
                {bubble(t.id)}
              </span>
            )}
          </button>
        ))}
        <span className="flex-1" />
        <button
          role="tab"
          type="button"
          aria-selected={manage}
          onClick={() => setTab("gerenciar")}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-accent-hover px-4 text-[13px] font-extrabold text-text-strong",
            manage ? "bg-accent-soft" : "bg-surface hover:bg-accent-soft/60",
          )}
        >
          <Bell className="size-4 shrink-0" aria-hidden />
          Gerenciar alertas ({alertsTotal.data ? alertsTotal.data.items.length : "—"})
        </button>
      </div>

      {manage ? (
        <AlertsPanel access={access} variant="notificacoes" />
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
        <EmptyCard
          icon={<Bell className="size-8 text-text-subtle" aria-hidden />}
          title="Nada por aqui ainda."
          hint="Quando algo acontecer com o que você segue ou pediu para acompanhar, aparece aqui."
          className="py-12"
        />
      ) : (
        <>
          {groupNotifications(items).map((g) => (
            <section key={g.id} aria-label={g.label} className="flex flex-col gap-2">
              <h2 className="mt-2 text-[13px] leading-5 font-bold tracking-[.5px] text-text-subtle uppercase">
                {g.label}
              </h2>
              <ul className="flex flex-col overflow-hidden rounded-2xl bg-surface shadow-card">
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
              className="self-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-bold text-text-strong hover:bg-surface-2"
            >
              {q.isFetchingNextPage ? "Carregando…" : "Ver mais"}
            </button>
          )}
        </>
      )}
      {prefsOpen && <NotificationPrefsDialog onClose={() => setPrefsOpen(false)} />}
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
        "flex items-start gap-3.5 border-b border-surface-2 px-5 py-4 last:border-b-0",
        !n.read && "bg-selected/40",
      )}
    >
      <button
        type="button"
        onClick={onRead}
        aria-label={n.read ? n.title : `${n.title} (marcar como lida)`}
        className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
      >
        <span
          className={cn(
            "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl",
            meta.tile,
          )}
        >
          <Icon className="size-[22px]" aria-hidden />
          {n.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={n.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-5 items-center rounded px-2 text-[11px] font-bold whitespace-nowrap",
                meta.chip,
              )}
            >
              {meta.label}
            </span>
            <span className="text-xs text-text-subtle">{formatTimeAgo(n.createdAt)}</span>
          </span>
          <span className={cn("text-[15px] leading-[22px] text-text", n.read ? "font-medium" : "font-bold")}>
            {n.title}
          </span>
          {n.text && <span className="text-[13px] leading-5 text-text-muted">{n.text}</span>}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-2.5 max-sm:flex-col-reverse max-sm:items-end">
        {n.action && href && (
          <Link
            href={href}
            onClick={onRead}
            className="inline-flex h-9 items-center rounded-lg border border-primary bg-surface px-3.5 text-[13px] font-bold whitespace-nowrap text-text-strong hover:bg-surface-2"
          >
            {n.action.label}
          </Link>
        )}
        <span className="flex items-center gap-2.5">
          {!n.read && <span className="size-2.5 rounded-full bg-danger" role="img" aria-label="Não lida" />}
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover notificação: ${n.title}`}
            title="Remover"
            className="flex size-8 items-center justify-center rounded-full text-text-subtle hover:bg-surface-2"
          >
            <X className="size-[18px]" aria-hidden />
          </button>
        </span>
      </div>
    </li>
  );
}
