"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ListPlus, Lock, Plus, Scale, Share2, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AlertsPanel } from "@/components/alerts/alerts-panel";
import { Avatar } from "@/components/catalog/avatar";
import { ResultCard } from "@/components/search/result-card";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import {
  type Favorite,
  type FavoriteFilter,
  type FavoriteSort,
  FAVORITE_SORTS,
  type ListSummary,
  me,
  type SavedComparison,
} from "@/lib/api/me";
import { listCompareEntries } from "@/lib/domain/list-compare";
import { savedToEntries } from "@/lib/domain/saved-comparison";
import { formatTimeAgo } from "@/lib/format";
import { conversaHref, lojaHref, prestadorHref, routes } from "@/lib/routes";

const TABS = ["itens", "lojas", "listas", "alertas"] as const;
type TabId = (typeof TABS)[number];
const KEYS = { items: ["me", "favorites"], following: ["me", "following"], lists: ["me", "lists"] } as const;

export function FavoritesView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("aba");
  const tab: TabId = (TABS as readonly string[]).includes(raw ?? "") ? (raw as TabId) : "itens";
  const setTab = (t: string) => router.replace(`${pathname}?aba=${t}`, { scroll: false });

  const counts = useQuery({
    queryKey: [...KEYS.items, "counts"],
    queryFn: () => me.favorites({ sort: "recent", lat: null, lng: null }),
  });
  const lists = useQuery({ queryKey: KEYS.lists, queryFn: me.lists });
  const following = useQuery({ queryKey: KEYS.following, queryFn: me.following });
  const alerts = useQuery({ queryKey: ["me", "alerts"], queryFn: me.alerts });
  const activeAlerts = alerts.data?.items.filter((a) => a.active).length ?? null;

  const tabs = [
    { id: "itens", label: "Produtos e serviços", count: counts.data?.counts.all ?? null },
    { id: "lojas", label: "Lojas e prestadores", count: following.data?.items.length ?? null },
    { id: "listas", label: "Listas", count: lists.data?.items.length ?? null },
    { id: "alertas", label: "Alertas", count: activeAlerts },
  ];
  const c = counts.data?.counts;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-strong">Meus Favoritos</h1>
        <p className="text-text-muted">O que você salvou e acompanha. Avisamos quando algo muda.</p>
      </header>

      <section aria-label="Acompanhando agora" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Shortcut onClick={() => setTab("itens")} text={`${c?.priceDrop ?? 0} salvos baixaram de preço`} />
        <CompareChip />
        <Shortcut onClick={() => setTab("alertas")} text={`${activeAlerts ?? 0} alertas ativos`} />
        <Shortcut
          onClick={() => setTab("lojas")}
          text={`${following.data?.items.filter((f) => f.news).length ?? 0} lojas com novidades`}
        />
      </section>

      <Tabs label="Seções de Favoritos" value={tab} onChange={setTab} tabs={tabs} />
      <TabPanel label={tabs.find((t) => t.id === tab)!.label}>
        {tab === "itens" && <FavoriteItems lists={lists.data?.items ?? []} />}
        {tab === "lojas" && <FollowingTab />}
        {tab === "listas" && <ListsTab />}
        {tab === "alertas" && <AlertsPanel />}
      </TabPanel>
    </div>
  );
}

function Shortcut({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-surface p-4 text-left text-sm font-semibold text-text-strong hover:bg-surface-2"
    >
      {text}
    </button>
  );
}

function CompareChip() {
  const { list } = useComparisonSelection();
  return (
    <Link
      href={routes.comparar}
      className="rounded-xl border border-border bg-surface p-4 text-sm font-semibold text-text-strong hover:bg-surface-2"
    >
      {list.length > 0 ? `Comparação de ${list[0].group.label}` : "Nenhuma comparação"}
    </Link>
  );
}

const FILTERS: { id: FavoriteFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "price_drop", label: "Baixaram de preço" },
  { id: "product", label: "Produtos" },
  { id: "service", label: "Serviços" },
];
const SORT_LABEL: Record<FavoriteSort, string> = {
  recent: "Mais recentes",
  price: "Menor preço",
  distance: "Mais perto",
};

function FavoriteItems({ lists }: { lists: ListSummary[] }) {
  const { location } = useUserLocation();
  const [filter, setFilter] = useState<FavoriteFilter>("all");
  const [sort, setSort] = useState<FavoriteSort>("recent");
  const q = useQuery({
    queryKey: [...KEYS.items, filter, sort, location.lat, location.lng],
    queryFn: () =>
      me.favorites({
        kind: filter === "product" || filter === "service" ? filter : undefined,
        filter: filter === "price_drop" ? "price_drop" : undefined,
        sort,
        lat: location.lat,
        lng: location.lng,
      }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-2" aria-label="Mostrar">
          {FILTERS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={chip(filter === f.id)}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          Ordenar
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as FavoriteSort)}
            className="h-11 rounded-lg border border-border-strong bg-surface px-3 text-text"
          >
            {FAVORITE_SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {q.isPending ? (
        <p className="text-text-muted">Carregando…</p>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : q.data.items.length === 0 ? (
        <Empty text={filter === "all" ? "Você ainda não salvou nada." : "Nada com esse filtro."} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {q.data.items.map((f) => (
            <li key={`${f.item.type}:${f.item.id}`}>
              <FavoriteCard fav={f} lists={lists} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
      toast("Removido dos favoritos.");
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível remover.", "info"),
  });
  const saved = formatTimeAgo(fav.savedAt);

  return (
    <div className="flex flex-col gap-2">
      <ResultCard item={fav.item} />
      {fav.change && (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-semibold",
            fav.change.kind === "price_drop"
              ? "bg-success-bg text-success-text"
              : "bg-info-bg text-info-text",
          )}
        >
          {fav.change.text}
        </p>
      )}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          {saved && <span>Salvo {saved}</span>}
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 font-semibold text-text hover:bg-surface-2"
          >
            <ListPlus className="size-4" aria-hidden />
            {(fav.listCount ?? 0) > 0
              ? `Em ${fav.listCount ?? 0} ${fav.listCount === 1 ? "lista" : "listas"}`
              : "+ Lista"}
          </button>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.mutate()}
            aria-label={`Remover dos favoritos: ${fav.item.title}`}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-lg px-3 font-semibold text-danger-text hover:bg-surface-2"
          >
            <Heart className="size-4 fill-danger text-danger" aria-hidden />
            Remover
          </button>
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
    <Modal title="Adicionar à lista" onClose={onClose}>
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
}: {
  name: string;
  onName: (v: string) => void;
  onSubmit: (n: string) => void;
  pending: boolean;
  error: string;
  submitLabel: string;
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
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-strong">
        Nome da lista
        <input
          value={name}
          maxLength={40}
          onChange={(e) => {
            onName(e.target.value);
            setLocal("");
          }}
          aria-invalid={!!shown}
          className="h-11 rounded-lg border border-border-strong bg-surface px-3 font-normal text-text"
        />
      </label>
      {shown && (
        <p role="alert" className="text-xs font-semibold text-danger-text">
          {shown}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 self-start rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function FollowingTab() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: KEYS.following, queryFn: me.following });
  const unfollow = useMutation({
    mutationFn: (id: string) => actions.follow(id, false),
    onSuccess: () => {
      toast("Você deixou de seguir.");
      void qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível deixar de seguir.", "info"),
  });
  const chat = useMutation({
    mutationFn: (profileId: string) => actions.startConversation({ profileId }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  if (q.isPending) return <p className="text-text-muted">Carregando…</p>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (q.data.items.length === 0) return <Empty text="Você ainda não segue nenhuma loja ou prestador." />;
  const kindLabel = { store: "Loja", provider: "Prestador", place: "Local" } as const;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {q.data.items.map(({ profile: p, news }) => (
        <li key={p.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={p.name} url={p.avatarUrl} size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-text-strong">{p.name}</p>
              <p className="text-sm text-text-muted">
                {[
                  kindLabel[p.kind],
                  p.typeLabel,
                  p.distanceKm !== null ? `${p.distanceKm.toFixed(1).replace(".", ",")} km` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <button
              type="button"
              disabled={unfollow.isPending}
              onClick={() => unfollow.mutate(p.id)}
              className="h-10 rounded-full border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2"
            >
              Seguindo ✓
            </button>
          </div>
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              news
                ? news.kind === "coupon"
                  ? "bg-accent-soft font-semibold text-accent-text"
                  : "bg-success-bg font-semibold text-success-text"
                : "bg-surface-2 text-text-muted",
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
              className="flex h-10 flex-1 items-center justify-center rounded-lg border border-primary text-sm font-bold text-text-strong hover:bg-surface-2"
            >
              {p.kind === "provider" ? "Ver perfil" : p.kind === "place" ? "Ver no mapa" : "Ver loja"}
            </Link>
            {p.kind !== "place" && (
              <button
                type="button"
                disabled={chat.isPending}
                onClick={() => chat.mutate(p.id)}
                className="h-10 flex-1 rounded-lg bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
              >
                Conversar
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ListsTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const q = useQuery({ queryKey: KEYS.lists, queryFn: me.lists });
  const create = useMutation({
    mutationFn: me.createList,
    onSuccess: () => {
      toast("Lista criada.");
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

  if (openId) return <ListDetail id={openId} onBack={() => setOpenId(null)} />;
  if (q.isPending) return <p className="text-text-muted">Carregando…</p>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return (
    <div className="flex flex-col gap-8">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.data.items.map((l) => (
          <li key={l.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
            <button
              type="button"
              onClick={() => setOpenId(l.id)}
              className="flex flex-col gap-3 text-left"
              aria-label={`Abrir lista ${l.name}`}
            >
              <span className="grid aspect-[2/1] grid-cols-4 gap-1 overflow-hidden rounded-lg bg-surface-2">
                {l.thumbnails.slice(0, 4).map((t, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={t} alt="" className="size-full object-cover" />
                ))}
              </span>
              <span className="flex items-center gap-1.5 font-bold text-text-strong">
                {l.shared ? (
                  <Users className="size-4" aria-label="Compartilhada" />
                ) : (
                  <Lock className="size-4" aria-label="Só você vê" />
                )}
                {l.name}
              </span>
              <span className="text-sm text-text-muted">
                {l.itemCount} {l.itemCount === 1 ? "item" : "itens"} ·{" "}
                {l.shared ? `compartilhada${l.sharedWith ? ` com ${l.sharedWith}` : ""}` : "só você vê"}
              </span>
            </button>
            <button
              type="button"
              disabled={share.isPending}
              onClick={() => share.mutate(l.id)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border-strong text-sm font-semibold hover:bg-surface-2"
            >
              <Share2 className="size-4" aria-hidden />
              Compartilhar
            </button>
          </li>
        ))}
        <li className="rounded-2xl border border-dashed border-border-strong p-4">
          <p className="mb-2 flex items-center gap-1.5 font-bold text-text-strong">
            <Plus className="size-4" aria-hidden />
            Nova lista
          </p>
          <NewListForm
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
      </ul>
      <SavedComparisons />
    </div>
  );
}

/** Comparações que a pessoa salvou na conta (botão "Salvar comparação" em Comparar). */
function SavedComparisons() {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { replace } = useComparisonSelection();
  const q = useQuery({ queryKey: ["me", "comparisons"], queryFn: me.comparisons });
  const del = useMutation({
    mutationFn: me.deleteComparison,
    onSuccess: () => {
      toast("Comparação excluída.");
      void qc.invalidateQueries({ queryKey: ["me", "comparisons"] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível excluir.", "info"),
  });
  if (q.isPending || q.isError || q.data.items.length === 0) return null;
  const open = (c: SavedComparison) => {
    replace(savedToEntries(c));
    router.push(routes.comparar);
  };
  return (
    <section aria-labelledby="comparacoes-salvas" className="flex flex-col gap-3">
      <h2 id="comparacoes-salvas" className="flex items-center gap-2 text-lg font-bold text-text-strong">
        <Scale className="size-5" aria-hidden />
        Comparações salvas
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {q.data.items.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
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
                className="inline-flex size-10 items-center justify-center rounded-lg border border-border-strong text-text-muted hover:bg-surface-2"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ListDetail({ id, onBack }: { id: string; onBack: () => void }) {
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
  if (q.isPending) return <p className="text-text-muted">Carregando…</p>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const list = q.data;
  const entries = listCompareEntries(
    list.items.map((f) => f.item),
    `lista “${list.name}”`,
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack} className="text-sm font-semibold text-link hover:underline">
          ← Todas as listas
        </button>
        <h2 className="text-xl font-bold text-text-strong">{list.name}</h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() => {
              replace(entries);
              router.push(routes.comparar);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-primary px-4 text-sm font-bold text-text-strong hover:bg-surface-2"
          >
            <Scale className="size-4" aria-hidden />
            Comparar {entries.length} desta lista
          </button>
        )}
        <button
          type="button"
          disabled={del.isPending}
          onClick={() => del.mutate()}
          className="ml-auto inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-danger-text hover:underline"
        >
          <Trash2 className="size-4" aria-hidden />
          Excluir lista
        </button>
      </div>
      {list.items.length === 0 ? (
        <Empty text="Esta lista está vazia. Use “+ Lista” em um favorito para adicionar." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {list.items.map((f) => (
            <li key={`${f.item.type}:${f.item.id}`}>
              <FavoriteCard fav={f} readOnly />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border p-8 text-center">
      <p className="font-bold text-text-strong">{text}</p>
      <Link href={routes.explorar} className="text-sm font-semibold text-link hover:underline">
        Buscar no Explorar
      </Link>
    </div>
  );
}

const chip = (on: boolean) =>
  cn(
    "h-10 rounded-full border px-4 text-sm font-semibold",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text hover:bg-surface-2",
  );
