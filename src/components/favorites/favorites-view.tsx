"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ChevronLeft,
  Heart,
  List,
  Lock,
  MessageCircle,
  Scale,
  Search,
  Share2,
  Store,
  Trash2,
  TrendingDown,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AlertsPanel } from "@/components/alerts/alerts-panel";
import { type Access, LockedBody, useAccess } from "@/components/auth/session-gate";
import { ResultCard } from "@/components/search/result-card";
import { cn } from "@/components/ui/cn";
import { EmptyCard } from "@/components/ui/empty-card";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/list-states";
import { Modal } from "@/components/ui/modal";
import { PillTabPanel, PillTabs } from "@/components/ui/pill-tabs";
import { useToast } from "@/components/ui/toast";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import {
  type Favorite,
  type FavoriteFilter,
  type FavoriteSort,
  type ListSummary,
  me,
  type SavedComparison,
} from "@/lib/api/me";
import { listCompareEntries } from "@/lib/domain/list-compare";
import { groupOf } from "@/lib/domain/notification-groups";
import { savedToEntries } from "@/lib/domain/saved-comparison";
import { matches } from "@/lib/domain/text-match";
import { formatTimeAgo } from "@/lib/format";
import { conversaHref, lojaHref, prestadorHref, routes } from "@/lib/routes";

const TABS = ["itens", "lojas", "listas", "alertas"] as const;
type TabId = (typeof TABS)[number];
const KEYS = { items: ["me", "favorites"], following: ["me", "following"], lists: ["me", "lists"] } as const;

/** Contador que nunca vira 0 por falta de dado: sem resposta do servidor aparece "—". */
const fmt = (n: number | null | undefined) => (typeof n === "number" ? n : "—");
const plural = (n: number | null, one: string, many: string) => (n === 1 ? one : many);

const card = "rounded-2xl bg-surface shadow-card";

export function FavoritesView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const access = useAccess();
  const member = access === "member";
  const raw = params.get("aba");
  const tab: TabId = (TABS as readonly string[]).includes(raw ?? "") ? (raw as TabId) : "itens";
  const setTab = (t: string) => router.replace(`${pathname}?aba=${t}`, { scroll: false });
  const { list: compareList } = useComparisonSelection();

  const counts = useQuery({
    queryKey: [...KEYS.items, "counts"],
    queryFn: () => me.favorites({ sort: "recent", lat: null, lng: null }),
    enabled: member,
  });
  const lists = useQuery({ queryKey: KEYS.lists, queryFn: me.lists, enabled: member });
  const following = useQuery({ queryKey: KEYS.following, queryFn: me.following, enabled: member });
  const alerts = useQuery({ queryKey: ["me", "alerts"], queryFn: me.alerts, enabled: member });
  const activeAlerts = alerts.data ? alerts.data.items.filter((a) => a.active).length : null;
  const firedToday = alerts.data
    ? alerts.data.items.filter((a) => {
        const g = a.active && a.lastTrigger ? groupOf(a.lastTrigger.at) : null;
        return g === "now" || g === "today";
      }).length
    : null;
  const withNews = following.data ? following.data.items.filter((f) => f.news).length : null;
  const c = counts.data?.counts;

  const tabs = [
    { id: "itens", label: "Produtos e serviços", count: fmt(c?.all) },
    { id: "lojas", label: "Lojas e prestadores", count: fmt(following.data?.items.length) },
    { id: "listas", label: "Listas", count: fmt(lists.data?.items.length) },
    { id: "alertas", label: "Alertas", count: fmt(activeAlerts) },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-[32px] leading-10 font-bold text-text-strong">Meus Favoritos</h1>
        <p className="text-base text-text-muted">O que você salvou e acompanha. Avisamos quando algo muda.</p>
      </header>

      <section aria-label="Acompanhando agora" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          tone="success"
          icon={TrendingDown}
          title={
            c
              ? `${c.priceDrop} ${plural(c.priceDrop, "salvo baixou de preço", "salvos baixaram de preço")}`
              : "Salvos que baixaram de preço"
          }
          sub="Veja quanto você economiza"
          onClick={() => setTab("itens")}
        />
        <Tile
          tone="navy"
          icon={Scale}
          title={
            compareList.length > 0
              ? `Comparação de ${compareList[0].group.label.toLowerCase()}`
              : "Nenhuma comparação"
          }
          sub={
            compareList.length > 0 ? `${compareList.length} de 3 opções salvas` : "Salve opções para comparar"
          }
          href={compareList.length > 0 ? routes.comparar : routes.explorar}
        />
        <Tile
          tone="amber"
          icon={Bell}
          title={
            activeAlerts !== null
              ? `${activeAlerts} ${plural(activeAlerts, "alerta ativo", "alertas ativos")}`
              : "Alertas ativos"
          }
          sub={firedToday ? `${firedToday} disparou hoje` : "Nada novo por enquanto"}
          onClick={() => setTab("alertas")}
        />
        <Tile
          tone="teal"
          icon={Store}
          title={
            withNews !== null
              ? `${withNews} ${plural(withNews, "loja com novidade", "lojas com novidades")}`
              : "Lojas com novidades"
          }
          sub={
            following.data
              ? `Entre as ${following.data.items.length} que você segue`
              : "Entre as que você segue"
          }
          onClick={() => setTab("lojas")}
        />
      </section>

      <PillTabs idBase="fav" label="Favoritos" tabs={tabs} value={tab} onChange={setTab} bordered />
      <PillTabPanel idBase="fav" active={tab}>
        {tab === "itens" && <FavoriteItems lists={lists.data?.items ?? []} access={access} />}
        {tab === "lojas" && <FollowingTab access={access} />}
        {tab === "listas" && <ListsTab access={access} />}
        {tab === "alertas" && <AlertsPanel access={access} variant="favoritos" />}
      </PillTabPanel>
    </div>
  );
}

const TONE = {
  success: "bg-success-soft text-success-text",
  navy: "bg-selected text-text-strong",
  amber: "bg-accent-soft text-accent-text",
  teal: "bg-[color-mix(in_srgb,var(--cat-esporte)_14%,transparent)] text-[color:var(--cat-esporte)]",
} as const;

/** Atalho do topo (protótipo › Favoritos › “Acompanhando agora”): ícone, título, subtítulo e seta. */
function Tile({
  tone,
  icon: Icon,
  title,
  sub,
  onClick,
  href,
}: {
  tone: keyof typeof TONE;
  icon: typeof Bell;
  title: string;
  sub: string;
  onClick?: () => void;
  href?: string;
}) {
  const cls = cn("flex items-center gap-3 p-4 text-left hover:shadow-raised", card);
  const body = (
    <>
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONE[tone])}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[15px] leading-[22px] font-extrabold text-text-strong">{title}</span>
        <span className="truncate text-xs leading-4 text-text-muted">{sub}</span>
      </span>
      <span aria-hidden className="text-lg font-bold text-accent-hover">
        ›
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

const FILTERS: { id: FavoriteFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "price_drop", label: "Baixaram de preço" },
  { id: "product", label: "Produtos" },
  { id: "service", label: "Serviços" },
];
const SORTS: { id: FavoriteSort; label: string }[] = [
  { id: "recent", label: "Mais recentes" },
  { id: "price", label: "Menor preço" },
  { id: "distance", label: "Mais perto" },
];

/** Grade de cartões do protótipo: 4 colunas quando há largura (decide pela largura do bloco, não da tela). */
const GRID =
  "grid grid-cols-1 items-start gap-6 @[500px]:grid-cols-2 @[780px]:grid-cols-3 @[1060px]:grid-cols-4";

function FavoriteItems({ lists, access }: { lists: ListSummary[]; access: Access }) {
  const { location } = useUserLocation();
  const locked = access !== "member";
  const [filter, setFilter] = useState<FavoriteFilter>("all");
  const [sort, setSort] = useState<FavoriteSort>("recent");
  const [term, setTerm] = useState("");
  const q = useQuery({
    queryKey: [...KEYS.items, filter, sort, location.lat, location.lng],
    enabled: !locked,
    queryFn: () =>
      me.favorites({
        kind: filter === "product" || filter === "service" ? filter : undefined,
        filter: filter === "price_drop" ? "price_drop" : undefined,
        sort,
        lat: location.lat,
        lng: location.lng,
      }),
  });
  const shown = q.data?.items.filter((f) => matches(term, f.item.title, f.item.profile?.name)) ?? [];

  return (
    <section aria-label="Produtos e serviços salvos" className="@container flex flex-col gap-4 pt-5">
      <div className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3", card)}>
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="relative mr-2 block">
            <span className="sr-only">Buscar nos favoritos</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={term}
              disabled={locked}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar nos favoritos"
              className="h-[34px] w-48 rounded-full border border-border bg-surface pr-3 pl-8 text-[13px] text-text disabled:opacity-60"
            />
          </label>
          <span className="mr-0.5 text-[13px] font-bold text-text-strong">Mostrar:</span>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              disabled={locked}
              onClick={() => setFilter(f.id)}
              className={pill(filter === f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[13px] font-bold text-text-strong">Ordenar:</span>
          {SORTS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sort === s.id}
              disabled={locked}
              onClick={() => setSort(s.id)}
              className={pill(sort === s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      {locked ? (
        <LockedBody
          access={access}
          area="favoritos"
          hint="Guarde produtos e lugares e receba aviso quando o preço baixar."
        />
      ) : q.isPending ? (
        <ListSkeleton label="Carregando seus favoritos…" rows={3} />
      ) : q.isError ? (
        <ErrorState
          title="Não foi possível carregar seus favoritos"
          error={q.error}
          onRetry={() => q.refetch()}
        />
      ) : q.data.items.length === 0 ? (
        <EmptyCard
          icon={
            <span className="flex size-14 items-center justify-center rounded-full bg-danger-soft">
              <Heart className="size-6 fill-danger text-danger" aria-hidden />
            </span>
          }
          title={filter === "all" ? "Você ainda não salvou nada" : "Nada com esse filtro"}
          hint={
            filter === "all"
              ? "Toque no coração de um produto ou serviço para salvar aqui."
              : "Troque o filtro para ver o restante dos seus favoritos."
          }
          href={routes.explorar}
          cta="Explorar"
        />
      ) : shown.length === 0 ? (
        <EmptyCard title="Nenhum favorito encontrado" hint={`Nada combina com “${term.trim()}”.`} />
      ) : (
        <ul className={GRID}>
          {shown.map((f) => (
            <li key={`${f.item.type}:${f.item.id}`} className="min-w-0">
              <FavoriteCard fav={f} lists={lists} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const pill = (on: boolean) =>
  cn(
    "h-[34px] rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap disabled:opacity-60",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text-2 hover:border-navy-300",
  );

/**
 * Cartão de favorito: o cartão de resultado do app + o que é só de quem salvou
 * (coração para remover, o que mudou, “Salvo há…” e “+ Lista”), tudo dentro do mesmo cartão.
 */
export function FavoriteCard({
  fav,
  lists,
  readOnly = false,
}: {
  fav: Favorite;
  lists?: ListSummary[];
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [listOpen, setListOpen] = useState(false);
  const type = fav.item.type === "service" ? "service" : "product";
  const remove = useMutation({
    mutationFn: () => actions.favorite(type, fav.item.id, false),
    onSuccess: () => {
      toast(`${fav.item.title} saiu dos favoritos.`);
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível remover.", "info"),
  });
  const saved = formatTimeAgo(fav.savedAt);
  const inLists = fav.listCount ?? 0;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl bg-surface shadow-raised [&>article]:rounded-none [&>article]:border-0 [&>article]:shadow-none [&>article:hover]:shadow-none">
      <ResultCard item={fav.item} />
      {!readOnly && (
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
          aria-label={`Remover dos favoritos: ${fav.item.title}`}
          title="Remover dos favoritos"
          className="absolute top-2.5 right-2.5 z-10 flex size-[34px] items-center justify-center rounded-full bg-surface shadow-card hover:scale-105"
        >
          <Heart className="size-4 fill-danger text-danger" aria-hidden />
        </button>
      )}
      {(fav.change || !readOnly) && (
        <div className="flex flex-col gap-2.5 px-3.5 pb-3">
          {fav.change && (
            <p
              className={cn(
                "inline-flex max-w-full items-center gap-1.5 self-start rounded-md px-2 py-1 text-xs leading-4 font-bold",
                fav.change.kind === "price_drop"
                  ? "bg-success-soft text-success-text"
                  : "bg-selected text-text-strong",
              )}
            >
              {fav.change.kind === "price_drop" && (
                <TrendingDown className="size-[13px] shrink-0" aria-hidden />
              )}
              <span className="truncate">{fav.change.text}</span>
            </p>
          )}
          {!readOnly && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] leading-4 text-text-subtle">{saved ? `Salvo ${saved}` : ""}</span>
              <button
                type="button"
                onClick={() => setListOpen(true)}
                className="inline-flex h-[26px] items-center gap-1 rounded-full border border-border bg-surface px-2 text-[11px] font-bold text-text-strong hover:bg-surface-2"
              >
                <List className="size-3" aria-hidden />
                {inLists > 0 ? `Em ${inLists} ${inLists === 1 ? "lista" : "listas"}` : "+ Lista"}
              </button>
            </div>
          )}
        </div>
      )}
      {listOpen && <AddToListDialog item={fav.item} lists={lists ?? []} onClose={() => setListOpen(false)} />}
    </div>
  );
}

function AddToListDialog({
  item,
  lists,
  onClose,
}: {
  item: Favorite["item"];
  lists: ListSummary[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const type = item.type === "service" ? "service" : "product";
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const done = () => void qc.invalidateQueries({ queryKey: ["me"] });
  const add = useMutation({
    mutationFn: (id: string) => me.addToList(id, type, item.id),
    onSuccess: () => {
      toast("Item adicionado à lista.");
      done();
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível adicionar.", "info"),
  });
  const create = useMutation({
    mutationFn: async (n: string) => {
      const l = await me.createList(n);
      await me.addToList(l.id, type, item.id);
    },
    onSuccess: () => {
      toast("Lista criada e item adicionado.");
      done();
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Não foi possível criar a lista."),
  });
  return (
    <Modal title="Salvar na lista" onClose={onClose}>
      <div className="flex flex-col gap-3">
        {lists.length > 0 && (
          <ul className="flex flex-col gap-2">
            {lists.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  disabled={add.isPending}
                  onClick={() => add.mutate(l.id)}
                  className="flex h-12 w-full items-center justify-between rounded-lg border border-border px-4 text-left font-semibold hover:bg-surface-2"
                >
                  {l.name}
                  <span className="text-sm font-normal text-text-muted">
                    {l.itemCount} {l.itemCount === 1 ? "item" : "itens"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <NewListForm
          submitLabel="Criar e adicionar"
          pending={create.isPending}
          error={error}
          name={name}
          onName={(v) => {
            setName(v);
            setError("");
          }}
          onSubmit={(n) => create.mutate(n)}
        />
      </div>
    </Modal>
  );
}

function validListName(name: string) {
  const n = name.trim();
  if (!n) return "Dê um nome para a lista.";
  if (n.length > 40) return "Use até 40 caracteres.";
  return null;
}

function NewListForm({
  name,
  onName,
  onSubmit,
  pending,
  error,
  submitLabel,
  inline,
}: {
  name: string;
  onName: (v: string) => void;
  onSubmit: (n: string) => void;
  pending: boolean;
  error: string;
  submitLabel: string;
  /** Campo e botão na mesma linha (cartão “Nova lista” do protótipo). */
  inline?: boolean;
}) {
  const [local, setLocal] = useState("");
  const shown = error || local;
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const err = validListName(name);
        setLocal(err ?? "");
        if (!err) onSubmit(name.trim());
      }}
      className="flex flex-col gap-2"
    >
      <div className={cn("flex gap-2", !inline && "flex-col")}>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-semibold text-text-strong">
          <span className={cn(inline && "sr-only")}>Nome da lista</span>
          <input
            value={name}
            maxLength={40}
            placeholder={inline ? "Nome da lista" : undefined}
            onChange={(e) => {
              onName(e.target.value);
              setLocal("");
            }}
            aria-invalid={!!shown}
            className={cn(
              "w-full rounded-lg border border-border bg-surface px-3 font-normal text-text",
              inline ? "h-10 text-sm" : "h-11",
            )}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "rounded-lg bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60",
            inline ? "h-10 px-3.5 text-[13px]" : "h-11 self-start px-5",
          )}
        >
          {submitLabel}
        </button>
      </div>
      {shown && (
        <p role="alert" className="text-xs font-semibold text-danger-text">
          {shown}
        </p>
      )}
    </form>
  );
}

const kindLabel = { store: "Loja", provider: "Prestador", place: "Local" } as const;

function FollowingTab({ access }: { access: Access }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const locked = access !== "member";
  const [term, setTerm] = useState("");
  const q = useQuery({ queryKey: KEYS.following, queryFn: me.following, enabled: !locked });
  const unfollow = useMutation({
    mutationFn: (v: { id: string; name: string }) => actions.follow(v.id, false),
    onSuccess: (_d, v) => {
      toast(`Você deixou de seguir ${v.name}.`);
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível deixar de seguir.", "info"),
  });
  const chat = useMutation({
    mutationFn: (profileId: string) => actions.startConversation({ profileId }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  const search = (
    <label className="relative block sm:max-w-sm">
      <span className="sr-only">Buscar entre quem você segue</span>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
        aria-hidden
      />
      <input
        type="search"
        value={term}
        disabled={locked}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar entre quem você segue"
        className="h-11 w-full rounded-full border border-border bg-surface pr-3 pl-9 text-sm text-text disabled:opacity-60"
      />
    </label>
  );
  const wrap = (children: React.ReactNode) => (
    <section aria-label="Lojas e prestadores que sigo" className="flex flex-col gap-4 pt-5">
      {search}
      {children}
    </section>
  );
  if (locked)
    return wrap(
      <LockedBody
        access={access}
        area="favoritos"
        hint="Veja primeiro os stories, lives e ofertas de quem você segue."
      />,
    );
  if (q.isPending) return wrap(<ListSkeleton label="Carregando quem você segue…" />);
  if (q.isError)
    return wrap(
      <ErrorState
        title="Não foi possível carregar quem você segue"
        error={q.error}
        onRetry={() => q.refetch()}
      />,
    );
  if (q.data.items.length === 0)
    return wrap(
      <EmptyCard
        title="Você ainda não segue ninguém"
        hint="Siga lojas e prestadores para receber novidades, cupons e horários livres."
        href={routes.explorar}
        cta="Ver quem está perto de mim"
      />,
    );
  const shown = q.data.items.filter(({ profile: p }) => matches(term, p.name, p.typeLabel));
  return wrap(
    shown.length === 0 ? (
      <EmptyCard title="Ninguém encontrado" hint={`Nada combina com “${term.trim()}”.`} />
    ) : (
      <ul className="grid gap-4 md:grid-cols-2">
        {shown.map(({ profile: p, news }) => (
          <li key={p.id} className={cn("flex flex-col gap-3.5 p-5", card)}>
            <div className="flex items-center gap-3.5">
              <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[17px] font-extrabold text-on-primary">
                <span aria-hidden>{p.name.trim().slice(0, 2).toUpperCase()}</span>
                {p.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
                  <img src={p.avatarUrl} alt="" className="absolute inset-0 size-full object-cover" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-base leading-[22px] font-bold text-text-strong">{p.name}</p>
                <p className="text-[13px] leading-[18px] text-text-subtle">
                  {[kindLabel[p.kind], p.typeLabel].filter(Boolean).join(" · ")}
                </p>
                {p.distanceKm !== null && (
                  <p className="text-xs leading-4 text-text-muted">
                    <span className="font-semibold text-text">
                      {p.distanceKm.toFixed(1).replace(".", ",")} km
                    </span>
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={unfollow.isPending}
                onClick={() => unfollow.mutate({ id: p.id, name: p.name })}
                aria-label={`Deixar de seguir ${p.name}`}
                className="h-[34px] shrink-0 rounded-lg border border-primary bg-surface px-3 text-xs font-bold text-text-strong hover:bg-surface-2"
              >
                Seguindo ✓
              </button>
            </div>
            <p
              className={cn(
                "inline-flex self-start rounded-lg px-2.5 py-1.5 text-[13px] font-bold",
                news
                  ? news.kind === "coupon"
                    ? "bg-accent-soft text-accent-text"
                    : "bg-success-soft text-success-text"
                  : "bg-surface-2 text-text-subtle",
              )}
            >
              {news ? news.text : "Sem novidades esta semana"}
            </p>
            <div className="flex gap-2">
              <Link
                href={
                  p.kind === "provider"
                    ? prestadorHref(p.slug)
                    : p.kind === "place"
                      ? routes.explorar
                      : lojaHref(p.slug)
                }
                className="flex h-10 flex-1 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-on-primary hover:bg-primary-hover"
              >
                {p.kind === "provider" ? "Ver perfil" : p.kind === "place" ? "Ver no Explorar" : "Ver loja"}
              </Link>
              {p.kind !== "place" && (
                <button
                  type="button"
                  disabled={chat.isPending}
                  onClick={() => chat.mutate(p.id)}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary text-[13px] font-bold text-text-strong hover:bg-surface-2 disabled:opacity-60"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  Conversar
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    ),
  );
}

const itemsLabel = (n: number) => `${n} ${n === 1 ? "item" : "itens"}`;

function ListsTab({ access }: { access: Access }) {
  const qc = useQueryClient();
  const toast = useToast();
  const locked = access !== "member";
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [error, setError] = useState("");
  const q = useQuery({ queryKey: KEYS.lists, queryFn: me.lists, enabled: !locked });
  const create = useMutation({
    mutationFn: me.createList,
    onSuccess: (l) => {
      toast(`Lista “${l.name}” criada. Use “+ Lista” nos seus salvos.`);
      setName("");
      void qc.invalidateQueries({ queryKey: KEYS.lists });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Não foi possível criar a lista."),
  });
  const share = useMutation({
    mutationFn: me.shareList,
    onSuccess: async (r) => {
      try {
        await navigator.clipboard.writeText(r.url);
        toast("Link da lista copiado.");
      } catch {
        toast(`Link da lista: ${r.url}`, "info");
      }
      void qc.invalidateQueries({ queryKey: KEYS.lists });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível compartilhar.", "info"),
  });

  if (openId)
    return (
      <ListDetail
        id={openId}
        onBack={() => setOpenId(null)}
        onShare={() => share.mutate(openId)}
        sharing={share.isPending}
      />
    );
  const lists = q.data?.items.filter((l) => matches(term, l.name)) ?? [];

  return (
    <div className="flex flex-col gap-8 pt-5">
      <section aria-label="Listas" className="flex flex-col gap-4">
        <label className="relative block sm:max-w-sm">
          <span className="sr-only">Buscar nas listas</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={term}
            disabled={locked}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar nas listas"
            className="h-11 w-full rounded-full border border-border bg-surface pr-3 pl-9 text-sm text-text disabled:opacity-60"
          />
        </label>
        {locked ? (
          <LockedBody
            access={access}
            area="favoritos"
            hint="Crie listas para organizar o que você salvou e compartilhe por um link."
          />
        ) : q.isPending ? (
          <ListSkeleton label="Carregando suas listas…" />
        ) : q.isError ? (
          <ErrorState
            title="Não foi possível carregar suas listas"
            error={q.error}
            onRetry={() => q.refetch()}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lists.map((l) => (
              <li key={l.id} className={cn("flex flex-col gap-3 p-3", card)}>
                <button
                  type="button"
                  onClick={() => setOpenId(l.id)}
                  aria-label={`Abrir a lista ${l.name}`}
                  className="grid h-40 grid-cols-2 gap-1 overflow-hidden rounded-[10px] bg-surface-2"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="relative bg-surface-3">
                      {l.thumbnails[i] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.thumbnails[i]}
                          alt=""
                          className="absolute inset-0 size-full object-cover"
                        />
                      )}
                    </span>
                  ))}
                </button>
                <div className="flex items-start justify-between gap-2 px-1">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[15px] leading-[22px] font-bold text-text-strong">
                      {l.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-text-subtle">
                      {l.shared ? (
                        <Users className="size-3" aria-label="Compartilhada" />
                      ) : (
                        <Lock className="size-3" aria-label="Só você vê" />
                      )}
                      {itemsLabel(l.itemCount)} ·{" "}
                      {l.shared ? `compartilhada${l.sharedWith ? ` com ${l.sharedWith}` : ""}` : "só você vê"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={share.isPending}
                    onClick={() => share.mutate(l.id)}
                    className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-bold text-text-strong hover:bg-surface-2"
                  >
                    <Share2 className="size-3.5" aria-hidden />
                    Compartilhar
                    <span className="sr-only"> lista {l.name}</span>
                  </button>
                </div>
              </li>
            ))}
            {!locked && (
              <li className="flex flex-col justify-center gap-2.5 rounded-2xl border-[1.5px] border-dashed border-navy-200 p-5">
                <span className="text-[15px] font-bold text-text-strong">Nova lista</span>
                <span className="text-[13px] leading-[19px] text-text-muted">
                  Junte opções para decidir depois ou planejar com alguém. Ex.: “Aniversário”, “Mudança”.
                </span>
                <NewListForm
                  inline
                  name={name}
                  onName={(v) => {
                    setName(v);
                    setError("");
                  }}
                  onSubmit={(n) => create.mutate(n)}
                  pending={create.isPending}
                  error={error}
                  submitLabel="Criar"
                />
              </li>
            )}
            {q.data.items.length > 0 && lists.length === 0 && (
              <li className="sm:col-span-2">
                <EmptyCard title="Nenhuma lista encontrada" hint={`Nada combina com “${term.trim()}”.`} />
              </li>
            )}
          </ul>
        )}
      </section>
      <SavedComparisons access={access} />
    </div>
  );
}

/** Comparações que a pessoa salvou na conta (botão "Salvar comparação" em Comparar). */
function SavedComparisons({ access }: { access: Access }) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const locked = access !== "member";
  const { replace } = useComparisonSelection();
  const q = useQuery({ queryKey: ["me", "comparisons"], queryFn: me.comparisons, enabled: !locked });
  const del = useMutation({
    mutationFn: me.deleteComparison,
    onSuccess: () => {
      toast("Comparação excluída.");
      void qc.invalidateQueries({ queryKey: ["me", "comparisons"] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível excluir.", "info"),
  });
  const open = (c: SavedComparison) => {
    replace(savedToEntries(c));
    router.push(routes.comparar);
  };
  return (
    <section aria-labelledby="comparacoes-salvas" className="flex flex-col gap-3">
      <div>
        <h2 id="comparacoes-salvas" className="flex items-center gap-2 text-lg font-bold text-text-strong">
          <Scale className="size-5" aria-hidden />
          Comparações salvas
        </h2>
        <p className="text-sm text-text-muted">
          Comparações que você guardou na conta para retomar quando quiser.
        </p>
      </div>
      {locked ? (
        <p className={cn("p-4 text-sm text-text-muted", card)}>
          {access === "guest"
            ? "Entre na sua conta para salvar e ver suas comparações."
            : "Suas comparações aparecem aqui quando a sessão for confirmada."}
        </p>
      ) : q.isPending ? (
        <ListSkeleton label="Carregando comparações salvas…" rows={1} />
      ) : q.isError ? (
        <ErrorState
          title="Não foi possível carregar as comparações salvas"
          error={q.error}
          onRetry={() => q.refetch()}
        />
      ) : q.data.items.length === 0 ? (
        <EmptyCard
          title="Você ainda não salvou comparações."
          hint="Em Comparar, monte um quadro com até 3 itens e use “Salvar comparação”."
          href={routes.comparar}
          cta="Ir para Comparar"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.items.map((c) => (
            <li key={c.id} className={cn("flex flex-col gap-3 p-4", card)}>
              <div>
                <p className="font-bold text-text-strong">{c.name}</p>
                <p className="text-sm text-text-muted">
                  {c.items.length} opções · {c.group.label}
                  {formatTimeAgo(c.createdAt) ? ` · ${formatTimeAgo(c.createdAt)}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => open(c)}
                  className="h-10 flex-1 rounded-lg bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover"
                >
                  Abrir
                </button>
                <button
                  type="button"
                  disabled={del.isPending}
                  onClick={() => del.mutate(c.id)}
                  aria-label={`Excluir comparação ${c.name}`}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-text-muted hover:bg-surface-2"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ListDetail({
  id,
  onBack,
  onShare,
  sharing,
}: {
  id: string;
  onBack: () => void;
  onShare: () => void;
  sharing: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { replace } = useComparisonSelection();
  const q = useQuery({ queryKey: [...KEYS.lists, id], queryFn: () => me.list(id) });
  const del = useMutation({
    mutationFn: () => me.deleteList(id),
    onSuccess: () => {
      toast("Lista excluída.");
      void qc.invalidateQueries({ queryKey: KEYS.lists });
      onBack();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível excluir.", "info"),
  });
  const back = (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface pr-3 pl-2 text-[13px] font-bold text-text-strong shadow-card hover:shadow-raised"
    >
      <ChevronLeft className="size-4" aria-hidden />
      Todas as listas
    </button>
  );
  if (q.isPending)
    return (
      <div className="flex flex-col items-start gap-4 pt-5">
        {back}
        <ListSkeleton label="Carregando a lista…" className="w-full" />
      </div>
    );
  if (q.isError)
    return (
      <div className="flex flex-col items-start gap-4 pt-5">
        {back}
        <ErrorState title="Não foi possível carregar a lista" error={q.error} onRetry={() => q.refetch()} />
      </div>
    );
  const list = q.data;
  const entries = listCompareEntries(
    list.items.map((f) => f.item),
    `lista “${list.name}”`,
  );
  return (
    <div className="@container flex flex-col gap-4 pt-5">
      <div className="flex flex-wrap items-center gap-3">
        {back}
        <div className="flex min-w-0 flex-col">
          <h2 className="truncate text-xl leading-7 font-bold text-text-strong">{list.name}</h2>
          <span className="text-xs text-text-subtle">
            {itemsLabel(list.itemCount)} ·{" "}
            {list.shared ? `compartilhada${list.sharedWith ? ` com ${list.sharedWith}` : ""}` : "só você vê"}
          </span>
        </div>
        <button
          type="button"
          disabled={sharing}
          onClick={onShare}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-[13px] font-bold text-text-strong hover:bg-surface-2"
        >
          <Share2 className="size-4" aria-hidden />
          Compartilhar
        </button>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              replace(entries);
              router.push(routes.comparar);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[13px] font-extrabold text-on-accent hover:bg-accent-hover"
          >
            <Scale className="size-4" aria-hidden />
            Comparar {entries.length} desta lista
          </button>
        )}
        <button
          type="button"
          disabled={del.isPending}
          onClick={() => del.mutate()}
          className="ml-auto inline-flex h-9 items-center gap-1.5 text-[13px] font-bold text-danger-text hover:underline"
        >
          <Trash2 className="size-4" aria-hidden />
          Excluir lista
        </button>
      </div>
      {list.items.length === 0 ? (
        <EmptyCard
          title="Lista vazia."
          hint="Nos seus salvos, use “+ Lista” para incluir itens aqui."
          className="py-8"
        />
      ) : (
        <ul className={GRID}>
          {list.items.map((f) => (
            <li key={`${f.item.type}:${f.item.id}`} className="min-w-0">
              <FavoriteCard fav={f} readOnly />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
