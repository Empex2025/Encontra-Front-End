"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { type Access, LockedBody, useAccess } from "@/components/auth/session-gate";
import { Stars } from "@/components/catalog/stars";
import { WantDialog } from "@/components/search/want-dialog";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState, ListSkeleton, SearchField } from "@/components/ui/list-states";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { activity, type MyCoupon, type MyReview, type Quote, type WantRow } from "@/lib/api/me";
import { createWant } from "@/lib/api/search";
import { clearViewed, readViewed, type ViewedRef } from "@/lib/domain/recently-viewed";
import { matches } from "@/lib/domain/text-match";
import { formatDayMonth, formatMoney, formatTimeAgo } from "@/lib/format";
import { avaliarHref, conversaHref, lojaHref, prestadorHref, routes } from "@/lib/routes";

const TABS = ["orcamentos", "promocao", "avaliacoes", "cupons", "vistos"] as const;
type TabId = (typeof TABS)[number];
const SUMMARY = ["me", "activity", "summary"] as const;

/** Contador que nunca vira 0 por falta de dado: sem resposta do servidor aparece "—". */
const fmt = (n: number | null | undefined) => (typeof n === "number" ? n : "—");

export function ActivityView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const access = useAccess();
  const member = access === "member";
  const raw = params.get("aba");
  const tab: TabId = (TABS as readonly string[]).includes(raw ?? "") ? (raw as TabId) : "orcamentos";
  const setTab = (t: string) => router.replace(`${pathname}?aba=${t}`, { scroll: false });
  const summary = useQuery({ queryKey: SUMMARY, queryFn: activity.summary, enabled: member });
  const s = summary.data;
  // Histórico guardado só neste navegador: lido depois de montar para não divergir do servidor.
  const [viewed, setViewed] = useState<ViewedRef[] | null>(null);
  useEffect(() => {
    queueMicrotask(() => setViewed(readViewed()));
  }, []);
  const tabs = [
    { id: "orcamentos", label: "Orçamentos", count: fmt(s?.quotes) },
    { id: "promocao", label: "Quero em promoção", count: fmt(s?.wants) },
    { id: "avaliacoes", label: "Minhas avaliações", count: fmt(s?.reviews) },
    { id: "cupons", label: "Meus cupons", count: fmt(s?.coupons) },
    { id: "vistos", label: "Vistos recentemente", count: fmt(viewed?.length) },
  ];
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-strong">Minha atividade</h1>
        <p className="text-text-muted">
          Seus pedidos de orçamento, pedidos em promoção, avaliações e cupons em um só lugar.
        </p>
      </header>
      <Tabs label="Seções da atividade" value={tab} onChange={setTab} tabs={tabs} />
      <TabPanel label={tabs.find((t) => t.id === tab)!.label}>
        {tab === "orcamentos" && <Quotes access={access} />}
        {tab === "promocao" && <Wants access={access} />}
        {tab === "avaliacoes" && <Reviews access={access} />}
        {tab === "cupons" && <Coupons access={access} />}
        {tab === "vistos" && <Viewed refs={viewed} setRefs={setViewed} />}
      </TabPanel>
    </div>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["me"] });
}

/** Cabeçalho de cada aba: título, explicação e (quando há lista) a busca, sempre visível. */
function TabHead({
  title,
  text,
  term,
  onTerm,
  searchLabel,
  locked,
  children,
}: {
  title: string;
  text: string;
  term?: string;
  onTerm?: (v: string) => void;
  searchLabel?: string;
  locked: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold text-text-strong">{title}</h2>
        <p className="text-sm text-text-muted">{text}</p>
      </div>
      {children}
      {onTerm && (
        <SearchField
          value={term ?? ""}
          onChange={onTerm}
          disabled={locked}
          label={searchLabel ?? "Buscar"}
          className="sm:max-w-sm"
        />
      )}
    </div>
  );
}

/** Corpo de uma lista da atividade: convite (visitante), esqueleto, erro com retry, vazio ou itens. */
function Section<T>({
  q,
  access,
  area,
  loading,
  errorTitle,
  term,
  render,
  empty,
  match,
}: {
  q: {
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    data: T[] | undefined;
    refetch: () => unknown;
  };
  access: Access;
  area: "atividade";
  loading: string;
  errorTitle: string;
  term: string;
  render: (items: T[]) => React.ReactNode;
  empty: React.ReactNode;
  match: (item: T, term: string) => boolean;
}) {
  if (access !== "member") return <LockedBody access={access} area={area} />;
  if (q.isPending) return <ListSkeleton label={loading} />;
  if (q.isError)
    return (
      <ErrorState title={errorTitle} error={q.error ?? new Error("Erro")} onRetry={() => void q.refetch()} />
    );
  if (!q.data || q.data.length === 0) return <>{empty}</>;
  const shown = q.data.filter((x) => match(x, term));
  if (shown.length === 0)
    return <EmptyState title="Nenhum registro encontrado" hint={`Nada combina com “${term.trim()}”.`} />;
  return <>{render(shown)}</>;
}

/* ---------- Orçamentos ---------- */
const QUOTE_LABEL: Record<Quote["status"], { text: string; cls: string }> = {
  waiting: { text: "Aguardando resposta", cls: "bg-accent-soft text-accent-text" },
  answered: { text: "Respondido", cls: "bg-success-bg text-success-text" },
  accepted: { text: "Aceito · aguardando visita", cls: "bg-success-bg text-success-text" },
  done: { text: "Concluído", cls: "bg-info-bg text-info-text" },
  declined: { text: "Recusado", cls: "bg-danger-bg text-danger-text" },
  canceled: { text: "Cancelado", cls: "bg-surface-2 text-text-muted" },
};

type QuoteFilter = "all" | "open" | "done";
const QUOTE_FILTERS: { id: QuoteFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Em andamento" },
  { id: "done", label: "Concluídos" },
];

function Quotes({ access }: { access: Access }) {
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<QuoteFilter>("all");
  const toast = useToast();
  const refresh = useRefresh();
  const router = useRouter();
  const q = useQuery({
    queryKey: ["me", "quotes"],
    enabled: access === "member",
    queryFn: async () => (await activity.quotes()).items.filter((x) => x.status !== "canceled"),
  });
  const act = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "accept" | "cancel" }) =>
      kind === "accept" ? activity.acceptQuote(id) : activity.cancelQuote(id),
    onSuccess: (_d, v) => {
      toast(v.kind === "accept" ? "Orçamento aceito. Avisamos o prestador pelo chat." : "Pedido cancelado.");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível concluir.", "info"),
  });
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        title="Orçamentos"
        text="Os pedidos que você fez a prestadores e as respostas deles."
        term={term}
        onTerm={setTerm}
        searchLabel="Buscar nos orçamentos"
        locked={access !== "member"}
      >
        <ul className="flex flex-wrap gap-2" aria-label="Mostrar orçamentos">
          {QUOTE_FILTERS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                aria-pressed={filter === f.id}
                disabled={access !== "member"}
                onClick={() => setFilter(f.id)}
                className={chipCls(filter === f.id)}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      </TabHead>
      <Section
        q={q}
        access={access}
        area="atividade"
        loading="Carregando orçamentos…"
        errorTitle="Não foi possível carregar seus orçamentos"
        term={term}
        match={(x, t) =>
          (filter === "all" ||
            (filter === "done"
              ? x.status === "done"
              : ["waiting", "answered", "accepted"].includes(x.status))) &&
          matches(t, x.profile?.name, x.service, x.note)
        }
        empty={
          <EmptyState
            title="Você ainda não pediu orçamentos."
            hint="Abra o perfil de um prestador e use “Pedir orçamento”."
            href={routes.explorar}
            cta="Buscar prestadores"
          />
        }
        render={(items) => (
          <ul className="flex flex-col gap-3">
            {items.map((x) => {
              const st = QUOTE_LABEL[x.status];
              return (
                <li key={x.id} className="flex flex-col gap-2 rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-text-strong">{x.profile?.name ?? "Prestador"}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", st.cls)}>
                      {st.text}
                    </span>
                  </div>
                  <p className="text-sm text-text">
                    {x.service}
                    {x.when ? ` · ${x.when}` : ""}
                    {formatTimeAgo(x.createdAt) ? ` · pedido ${formatTimeAgo(x.createdAt)}` : ""}
                  </p>
                  {x.priceCents !== null && (
                    <p className="text-sm font-bold text-text-strong">{formatMoney(x.priceCents)}</p>
                  )}
                  {x.note && <p className="text-sm text-text-muted">{x.note}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {x.profile && (
                      <Link
                        href={
                          x.profile.kind === "provider"
                            ? prestadorHref(x.profile.slug)
                            : lojaHref(x.profile.slug)
                        }
                        className={btn}
                      >
                        Ver perfil
                      </Link>
                    )}
                    {x.conversationId && (
                      <button
                        type="button"
                        onClick={() => router.push(conversaHref(x.conversationId!))}
                        className={btn}
                      >
                        Abrir conversa
                      </button>
                    )}
                    {x.status === "answered" && (
                      <button
                        type="button"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ id: x.id, kind: "accept" })}
                        className={btnPrimary}
                      >
                        Aceitar orçamento
                      </button>
                    )}
                    {x.status === "waiting" && (
                      <button
                        type="button"
                        disabled={act.isPending}
                        onClick={() => act.mutate({ id: x.id, kind: "cancel" })}
                        className={btn}
                      >
                        Cancelar pedido
                      </button>
                    )}
                    {x.status === "done" && x.profile && (
                      <Link href={avaliarHref("prestador", x.profile.slug)} className={btnPrimary}>
                        Avaliar atendimento
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      />
    </div>
  );
}

const chipCls = (on: boolean) =>
  cn(
    "h-10 rounded-full border px-4 text-sm font-semibold disabled:opacity-60",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text hover:bg-surface-2",
  );

const btn =
  "inline-flex h-10 items-center rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2";
const btnPrimary =
  "inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-bold text-on-primary hover:bg-primary-hover";

/* ---------- Quero em promoção ---------- */
const WANT_STATUS: Record<WantRow["status"], string> = {
  waiting: "Aguardando ofertas",
  found: "Ofertas encontradas",
  expired: "Expirou",
  canceled: "Cancelado",
};
const DEADLINE: Record<WantRow["deadline"], string> = {
  today: "para hoje",
  week: "esta semana",
  month: "sem pressa",
};

function Wants({ access }: { access: Access }) {
  const [term, setTerm] = useState("");
  const { location } = useUserLocation();
  const pathname = usePathname();
  const toast = useToast();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["me", "wants"],
    enabled: access === "member",
    queryFn: async () => (await activity.wants()).items.filter((w) => w.status !== "canceled"),
  });
  const cancel = useMutation({
    mutationFn: activity.cancelWant,
    onSuccess: () => {
      toast("Pedido cancelado.");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível cancelar.", "info"),
  });
  const again = useMutation({
    mutationFn: (w: WantRow) =>
      createWant({
        term: w.term,
        radiusKm: w.radiusKm,
        deadline: w.deadline,
        maxPriceCents: w.maxPriceCents,
      }),
    onSuccess: () => {
      toast("Pedido enviado de novo.");
      refresh();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível pedir de novo.", "info"),
  });
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        title="Quero em promoção"
        text="Diga o que você quer em promoção e avisamos as lojas perto. Elas só veem quantas pessoas querem — nunca quem é."
        term={term}
        onTerm={setTerm}
        searchLabel="Buscar nos pedidos"
        locked={access !== "member"}
      >
        <button
          type="button"
          disabled={access !== "member"}
          onClick={() => setOpen(true)}
          className={cn(btnPrimary, "self-start disabled:opacity-60")}
        >
          <Plus className="mr-1 size-4" aria-hidden />
          Novo pedido
        </button>
      </TabHead>
      <Section
        q={q}
        access={access}
        area="atividade"
        loading="Carregando pedidos…"
        errorTitle="Não foi possível carregar seus pedidos"
        term={term}
        match={(w, t) => matches(t, w.term)}
        empty={
          <EmptyState
            title="Você ainda não fez pedidos de promoção."
            hint="Toque em “Novo pedido” e conte o que você quer encontrar em promoção."
          />
        }
        render={(items) => (
          <ul className="flex flex-col gap-3">
            {[...items]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((w) => (
                <li
                  key={w.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border border-border p-4",
                    w.status === "expired" && "opacity-60",
                  )}
                >
                  <p className="font-bold text-text-strong">“{w.term}” em promoção</p>
                  <p className="text-sm text-text-muted">
                    até {w.radiusKm} km · {DEADLINE[w.deadline]}
                    {w.maxPriceCents !== null ? ` · até ${formatMoney(w.maxPriceCents)}` : ""}
                    {formatTimeAgo(w.createdAt) ? ` · pedido ${formatTimeAgo(w.createdAt)}` : ""}
                  </p>
                  <p className="text-sm font-semibold text-text">{WANT_STATUS[w.status]}</p>
                  <p className="text-sm text-text-muted">
                    {w.people} {w.people === 1 ? "pessoa perto quer" : "pessoas perto querem"} isso ·{" "}
                    {w.profilesNotified} lojas e prestadores avisados
                  </p>
                  {w.found && (
                    <p className="bg-success-bg rounded-lg px-3 py-2 text-sm font-semibold text-success-text">
                      ENCONTRAMOS {w.found.count} {w.found.count === 1 ? "oferta" : "ofertas"} ·{" "}
                      <Link href={w.found.href} className="underline">
                        Ver ofertas
                      </Link>
                    </p>
                  )}
                  <div className="flex gap-2">
                    {w.status === "expired" ? (
                      <button
                        type="button"
                        disabled={again.isPending}
                        onClick={() => again.mutate(w)}
                        className={btn}
                      >
                        Pedir de novo
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={cancel.isPending}
                        onClick={() => cancel.mutate(w.id)}
                        className={btn}
                      >
                        Cancelar pedido
                      </button>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      />
      {open && (
        <WantDialog
          initialTerm=""
          radiusKm={location.radiusKm}
          returnTo={`${pathname}?aba=promocao`}
          onClose={() => {
            setOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

/* ---------- Minhas avaliações ---------- */
function Reviews({ access }: { access: Access }) {
  const [term, setTerm] = useState("");
  const refresh = useRefresh();
  const q = useQuery({
    queryKey: ["me", "reviews"],
    enabled: access === "member",
    queryFn: async () => (await activity.reviews()).items,
  });
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        title="Minhas avaliações"
        text="O que você avaliou. Você pode editar ou excluir quando quiser."
        term={term}
        onTerm={setTerm}
        searchLabel="Buscar nas avaliações"
        locked={access !== "member"}
      />
      <Section
        q={q}
        access={access}
        area="atividade"
        loading="Carregando avaliações…"
        errorTitle="Não foi possível carregar suas avaliações"
        term={term}
        match={(r, t) => matches(t, r.targetTitle, r.text)}
        empty={
          <EmptyState
            title="Você ainda não avaliou nada."
            hint="Depois de comprar ou contratar, avalie a loja ou o prestador para ajudar outras pessoas."
          />
        }
        render={(items) => (
          <ul className="flex flex-col gap-3">
            {items.map((r) => (
              <ReviewRow key={r.id} r={r} onChanged={refresh} />
            ))}
          </ul>
        )}
      />
    </div>
  );
}

function ReviewRow({ r, onChanged }: { r: MyReview; onChanged: () => void }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(r.rating);
  const [text, setText] = useState(r.text ?? "");
  const [confirm, setConfirm] = useState(false);
  const save = useMutation({
    mutationFn: () => activity.editReview(r.id, { rating, text: text.trim() }),
    onSuccess: () => {
      toast("Avaliação atualizada.");
      setEditing(false);
      onChanged();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível salvar.", "info"),
  });
  const del = useMutation({
    mutationFn: () => activity.deleteReview(r.id),
    onSuccess: () => {
      toast("Avaliação excluída.");
      onChanged();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível excluir.", "info"),
  });
  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        {r.targetHref ? (
          <Link href={r.targetHref} className="font-bold text-text-strong hover:underline">
            {r.targetTitle}
          </Link>
        ) : (
          <p className="font-bold text-text-strong">{r.targetTitle}</p>
        )}
        {r.status === "pending" && (
          <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold text-accent-text">
            Em análise
          </span>
        )}
      </div>
      <p className="text-xs text-text-subtle">
        {formatDayMonth(r.createdAt)} · {r.photoCount} {r.photoCount === 1 ? "foto" : "fotos"}
      </p>
      {editing ? (
        <div className="flex flex-col gap-2">
          <div role="radiogroup" aria-label="Nota" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                onClick={() => setRating(n)}
                className="flex size-10 items-center justify-center"
              >
                <Star
                  className={cn("size-6", n <= rating ? "fill-accent text-accent" : "text-border-strong")}
                  aria-hidden
                />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            maxLength={1500}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            aria-label="Comentário"
            className="rounded-lg border border-border-strong bg-surface p-3 text-text"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate()}
              className={btnPrimary}
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setRating(r.rating);
                setText(r.text ?? "");
              }}
              className={btn}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <Stars value={r.rating} />
          {r.text && <p className="text-text">{r.text}</p>}
          {r.reply && (
            <p className="rounded-lg bg-surface-2 p-3 text-sm text-text-muted">Resposta: {r.reply}</p>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(true)} className={btn}>
              Editar
            </button>
            {confirm ? (
              <button
                type="button"
                disabled={del.isPending}
                onClick={() => del.mutate()}
                className={cn(btn, "border-danger text-danger-text")}
              >
                Confirmar exclusão
              </button>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className={cn(btn, "text-danger-text")}>
                <Trash2 className="mr-1 size-4" aria-hidden />
                Excluir
              </button>
            )}
          </div>
        </>
      )}
    </li>
  );
}

/* ---------- Cupons ---------- */
const COUPON_STATUS: Record<MyCoupon["status"], { text: string; cls: string }> = {
  active: { text: "Ativo", cls: "bg-success-bg text-success-text" },
  used: { text: "Usado", cls: "bg-surface-2 text-text-muted" },
  expired: { text: "Vencido", cls: "bg-surface-2 text-text-muted" },
};

function Coupons({ access }: { access: Access }) {
  const [term, setTerm] = useState("");
  const toast = useToast();
  const q = useQuery({
    queryKey: ["me", "coupons"],
    enabled: access === "member",
    queryFn: async () => (await activity.coupons()).items,
  });
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Código copiado.");
    } catch {
      toast(`Código: ${code}`, "info");
    }
  };
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        title="Meus cupons"
        text="Os cupons que você pegou. Mostre o código na loja para usar."
        term={term}
        onTerm={setTerm}
        searchLabel="Buscar nos cupons"
        locked={access !== "member"}
      />
      <Section
        q={q}
        access={access}
        area="atividade"
        loading="Carregando cupons…"
        errorTitle="Não foi possível carregar seus cupons"
        term={term}
        match={(c, t) => matches(t, c.code, c.benefit, c.profile.name)}
        empty={
          <EmptyState
            title="Você ainda não pegou cupons."
            hint="Cupons aparecem em Ofertas e nos perfis das lojas."
            href={routes.ofertas}
            cta="Ver ofertas e cupons"
          />
        }
        render={(items) => (
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((c) => {
              const st = COUPON_STATUS[c.status];
              return (
                <li
                  key={c.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-2xl border border-border p-4",
                    c.status !== "active" && "opacity-70",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-lg font-bold text-text-strong">CÓDIGO {c.code}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", st.cls)}>
                      {st.text}
                    </span>
                  </div>
                  <p className="text-sm text-text">{c.benefit}</p>
                  <p className="text-sm text-text-muted">
                    {c.profile.name} · válido até {formatDayMonth(c.validUntil)}
                  </p>
                  <div className="flex gap-2">
                    {c.status === "active" && (
                      <button type="button" onClick={() => void copy(c.code)} className={btn}>
                        <Copy className="mr-1 size-4" aria-hidden />
                        Copiar código
                      </button>
                    )}
                    <Link href={lojaHref(c.profile.slug)} className={btn}>
                      Ver loja ›
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      />
    </div>
  );
}

/* ---------- Vistos recentemente (só neste navegador) ---------- */
function Viewed({ refs, setRefs }: { refs: ViewedRef[] | null; setRefs: (r: ViewedRef[]) => void }) {
  const [term, setTerm] = useState("");
  const list = refs ?? [];
  const key = list.map((r) => `${r.type}:${r.slug}`);
  const q = useQuery({
    queryKey: ["recent", key],
    enabled: key.length > 0,
    queryFn: async () => (await activity.recent(key)).items,
  });
  const when = new Map(list.map((r) => [`${r.type}:${r.slug}`, r.at]));
  const shown = q.data?.filter((it) => matches(term, it.title)) ?? [];
  return (
    <div className="flex flex-col gap-4">
      <TabHead
        title="Vistos recentemente"
        text="Só você vê este histórico, e ele fica apenas neste navegador."
        term={term}
        onTerm={setTerm}
        searchLabel="Buscar nos vistos"
        locked={false}
      >
        <button
          type="button"
          disabled={list.length === 0}
          onClick={() => {
            clearViewed();
            setRefs([]);
          }}
          className={cn(btn, "self-start disabled:opacity-60")}
        >
          Limpar histórico
        </button>
      </TabHead>
      {refs === null ? (
        <ListSkeleton label="Carregando histórico…" rows={2} />
      ) : list.length === 0 ? (
        <EmptyState
          title="Você ainda não viu nada."
          hint="Os produtos e lojas que você abrir aparecem aqui."
          href={routes.explorar}
          cta="Buscar no Explorar"
        />
      ) : q.isPending ? (
        <ListSkeleton label="Carregando itens vistos…" rows={2} />
      ) : q.isError ? (
        <ErrorState
          title="Não foi possível carregar os itens vistos"
          error={q.error}
          onRetry={() => q.refetch()}
        />
      ) : q.data.length === 0 ? (
        <EmptyState
          title="Esses itens não estão mais disponíveis."
          hint="Quando você abrir outros produtos ou lojas, eles aparecem aqui."
        />
      ) : shown.length === 0 ? (
        <EmptyState title="Nenhum registro encontrado" hint={`Nada combina com “${term.trim()}”.`} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {shown.map((it) => {
            const at = when.get(`${it.type}:${it.slug}`);
            return (
              <li key={`${it.type}:${it.slug}`}>
                <Link
                  href={it.href}
                  className="flex flex-col gap-1.5 rounded-xl border border-border p-2 hover:bg-surface-2"
                >
                  <span className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-2">
                    {it.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </span>
                  <span className="truncate text-sm font-semibold text-text-strong">{it.title}</span>
                  {at && <span className="text-xs text-text-subtle">Visto {viewedWhen(at)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Regra do Documento: < 2 min "agora", < 60 min "há N min", < 24 h "há N h", 1 dia "ontem", depois "há N dias". */
function viewedWhen(iso: string, now = new Date()) {
  const min = Math.floor((now.getTime() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(min) || min < 2) return "agora";
  if (min < 60) return `há ${min} min`;
  if (min < 1440) return `há ${Math.floor(min / 60)} h`;
  const d = Math.floor(min / 1440);
  return d === 1 ? "ontem" : `há ${d} dias`;
}
