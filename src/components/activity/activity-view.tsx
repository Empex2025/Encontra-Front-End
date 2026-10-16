"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { type Access, LockedBody, useAccess } from "@/components/auth/session-gate";
import { Stars } from "@/components/catalog/stars";
import { WantDialog } from "@/components/search/want-dialog";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyCard } from "@/components/ui/empty-card";
import { ListSkeleton, SearchField } from "@/components/ui/list-states";
import { PillTabPanel, PillTabs } from "@/components/ui/pill-tabs";
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-[32px] leading-10 font-bold text-text-strong">Minha atividade</h1>
        <p className="text-base text-text-muted">
          Acompanhe seus orçamentos, pedidos de promoção, avaliações, cupons e o que você viu.
        </p>
      </header>
      <PillTabs
        idBase="ativ"
        label="Seções da atividade"
        value={tab}
        onChange={setTab}
        tabs={tabs}
        bold={false}
      />
      <PillTabPanel idBase="ativ" active={tab}>
        {tab === "orcamentos" && <Quotes access={access} />}
        {tab === "promocao" && <Wants access={access} />}
        {tab === "avaliacoes" && <Reviews access={access} />}
        {tab === "cupons" && <Coupons access={access} />}
        {tab === "vistos" && <Viewed refs={viewed} setRefs={setViewed} />}
      </PillTabPanel>
    </div>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["me"] });
}

const card = "rounded-2xl bg-surface shadow-card";
const btn =
  "inline-flex h-[38px] items-center rounded-lg border border-border bg-surface px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2 disabled:opacity-60";
const btnOutline =
  "inline-flex h-[38px] items-center rounded-lg border border-primary bg-surface px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2 disabled:opacity-60";
const btnPrimary =
  "inline-flex h-[38px] items-center rounded-lg bg-primary px-4 text-[13px] font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60";
const btnAccent =
  "inline-flex h-[38px] items-center rounded-lg bg-accent px-4 text-[13px] font-extrabold text-on-accent hover:bg-accent-hover disabled:opacity-60";
const btnDanger =
  "inline-flex h-[38px] items-center rounded-lg px-3.5 text-[13px] font-bold text-danger-text hover:bg-danger-soft disabled:opacity-60";

const chipCls = (on: boolean) =>
  cn(
    "h-[34px] rounded-full border px-3 text-[13px] font-semibold disabled:opacity-60",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text-2 hover:border-navy-300",
  );

/** Quadrado de iniciais (protótipo: 48 px, raio 12), com a imagem por cima quando existir. */
function Initials({ name, src }: { name: string; src?: string | null }) {
  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-sm font-extrabold text-on-primary">
      <span aria-hidden>{name.trim().slice(0, 2).toUpperCase()}</span>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}

/** Linha de busca e filtros de cada aba (sempre visível, mesmo sem dados). */
function Toolbar({
  term,
  onTerm,
  label,
  locked,
  children,
}: {
  term: string;
  onTerm: (v: string) => void;
  label: string;
  locked: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchField value={term} onChange={onTerm} disabled={locked} label={label} className="sm:w-72" />
      {children}
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
    return <EmptyCard title="Nenhum registro encontrado" hint={`Nada combina com “${term.trim()}”.`} />;
  return <>{render(shown)}</>;
}

const pillBase = "inline-flex h-[26px] shrink-0 items-center rounded-full border px-2.5 text-xs font-bold";

/* ---------- Orçamentos ---------- */
const QUOTE_LABEL: Record<Quote["status"], { text: string; cls: string }> = {
  waiting: { text: "Aguardando resposta", cls: "border-accent-border bg-accent-soft text-accent-text" },
  answered: { text: "Respondido", cls: "border-success-text/30 bg-success-soft text-success-text" },
  accepted: {
    text: "Aceito · aguardando visita",
    cls: "border-success-text/30 bg-success-soft text-success-text",
  },
  done: { text: "Concluído", cls: "border-border bg-selected text-text-strong" },
  declined: { text: "Recusado", cls: "border-danger/30 bg-danger-soft text-danger-text" },
  canceled: { text: "Cancelado", cls: "border-border bg-surface-2 text-text-muted" },
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
  const locked = access !== "member";
  const q = useQuery({
    queryKey: ["me", "quotes"],
    enabled: !locked,
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
    <section aria-label="Orçamentos" className="flex flex-col gap-3 pt-5">
      <Toolbar term={term} onTerm={setTerm} label="Buscar nos orçamentos" locked={locked}>
        <ul className="flex flex-wrap gap-1.5" aria-label="Mostrar orçamentos">
          {QUOTE_FILTERS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                aria-pressed={filter === f.id}
                disabled={locked}
                onClick={() => setFilter(f.id)}
                className={chipCls(filter === f.id)}
              >
                {f.label}
              </button>
            </li>
          ))}
        </ul>
      </Toolbar>
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
          <EmptyCard
            title="Nenhum pedido de orçamento"
            hint="Peça orçamento a prestadores pelo perfil deles. As respostas aparecem aqui."
            href={routes.explorar}
            cta="Encontrar prestadores"
          />
        }
        render={(items) => (
          <ul className="flex flex-col gap-3">
            {items.map((x) => {
              const st = QUOTE_LABEL[x.status];
              const ago = formatTimeAgo(x.createdAt);
              return (
                <li key={x.id} className={cn("flex flex-col gap-3 px-5 py-[18px]", card)}>
                  <div className="flex flex-wrap items-center gap-3.5">
                    <Initials name={x.profile?.name ?? "Prestador"} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="text-[15px] font-bold text-text">
                        {x.service}
                        {x.when ? ` · ${x.when}` : ""}
                      </p>
                      <p className="text-[13px] text-text-subtle">
                        {x.profile?.name ?? "Prestador"}
                        {ago ? ` · pedido ${ago}` : ""}
                      </p>
                    </div>
                    <span className={cn(pillBase, st.cls)}>{st.text}</span>
                  </div>
                  {(x.priceCents !== null || x.note) && (
                    <div className="flex items-center gap-4 rounded-[10px] bg-surface-2 px-3.5 py-3">
                      {x.priceCents !== null && (
                        <span className="text-xl font-extrabold text-text-strong">
                          {formatMoney(x.priceCents)}
                        </span>
                      )}
                      {x.note && (
                        <span className="flex-1 text-[13px] leading-[19px] text-text-muted">{x.note}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap justify-end gap-2">
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
                        className={btnOutline}
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
                        className={btnDanger}
                      >
                        Cancelar pedido
                      </button>
                    )}
                    {x.status === "done" && x.profile && (
                      <Link href={avaliarHref("prestador", x.profile.slug)} className={btnAccent}>
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
    </section>
  );
}

/* ---------- Quero em promoção ---------- */
const WANT_STATUS: Record<WantRow["status"], { text: string; cls: string }> = {
  waiting: { text: "Aguardando ofertas", cls: "bg-accent-soft text-accent-text" },
  found: { text: "Ofertas encontradas", cls: "bg-success-soft text-success-text" },
  expired: { text: "Expirou", cls: "bg-surface-2 text-text-muted" },
  canceled: { text: "Cancelado", cls: "bg-surface-2 text-text-muted" },
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
  const locked = access !== "member";
  const q = useQuery({
    queryKey: ["me", "wants"],
    enabled: !locked,
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
    <section aria-label="Quero em promoção" className="flex flex-col gap-3 pt-5">
      <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-accent-border bg-accent-soft px-[18px] py-3.5">
        <span className="min-w-[14rem] flex-1 text-sm leading-5 text-text-2">
          Diga o que você quer em promoção e avisamos as lojas perto. Elas só veem quantas pessoas querem —
          nunca quem é.
        </span>
        <button
          type="button"
          disabled={locked}
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-[13px] font-extrabold text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          + Novo pedido
        </button>
      </div>
      <Toolbar term={term} onTerm={setTerm} label="Buscar nos pedidos" locked={locked} />
      <Section
        q={q}
        access={access}
        area="atividade"
        loading="Carregando pedidos…"
        errorTitle="Não foi possível carregar seus pedidos"
        term={term}
        match={(w, t) => matches(t, w.term)}
        empty={
          <EmptyCard
            title="Você ainda não fez pedidos de promoção."
            hint="Toque em “+ Novo pedido” e conte o que você quer encontrar em promoção."
          />
        }
        render={(items) => (
          <ul className="flex flex-col gap-3">
            {[...items]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((w) => {
                const st = WANT_STATUS[w.status];
                const ago = formatTimeAgo(w.createdAt);
                return (
                  <li
                    key={w.id}
                    className={cn(
                      "flex flex-col gap-3 px-5 py-[18px]",
                      card,
                      w.status === "expired" && "opacity-60",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3.5">
                      <span
                        aria-hidden
                        className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-accent-soft text-xl font-extrabold text-accent-text"
                      >
                        %
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <p className="text-base font-bold text-text">“{w.term}” em promoção</p>
                        <p className="text-[13px] text-text-subtle">
                          até {w.radiusKm} km · {DEADLINE[w.deadline]}
                          {w.maxPriceCents !== null ? ` · até ${formatMoney(w.maxPriceCents)}` : ""}
                          {ago ? ` · pedido ${ago}` : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex h-[26px] shrink-0 items-center rounded-full px-2.5 text-xs font-bold",
                          st.cls,
                        )}
                      >
                        {st.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-[10px] bg-surface-2 px-3.5 py-2.5 text-[13px] text-text-muted">
                      <span>
                        <b className="text-base text-text-strong">{w.people}</b>{" "}
                        {w.people === 1 ? "pessoa perto quer isso" : "pessoas perto querem isso"}
                      </span>
                      <span>
                        <b className="text-base text-text-strong">{w.profilesNotified}</b> lojas e prestadores
                        avisados
                      </span>
                    </div>
                    {w.found && (
                      <div className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-success-text bg-success-soft px-3.5 py-3">
                        <span className="text-xs font-extrabold tracking-[0.4px] text-success-text">
                          ENCONTRAMOS
                        </span>
                        <span className="flex-1 text-sm font-bold text-text">
                          {w.found.count} {w.found.count === 1 ? "oferta" : "ofertas"} perto de você
                        </span>
                        <Link
                          href={w.found.href}
                          className="inline-flex h-[38px] items-center rounded-lg bg-success-text px-3.5 text-[13px] font-bold text-surface hover:opacity-90"
                        >
                          Ver ofertas
                        </Link>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      {w.status === "expired" ? (
                        <button
                          type="button"
                          disabled={again.isPending}
                          onClick={() => again.mutate(w)}
                          className={btnOutline}
                        >
                          Pedir de novo
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={cancel.isPending}
                          onClick={() => cancel.mutate(w.id)}
                          className={btnDanger}
                        >
                          Cancelar pedido
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
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
    </section>
  );
}

/* ---------- Minhas avaliações ---------- */
function Reviews({ access }: { access: Access }) {
  const [term, setTerm] = useState("");
  const refresh = useRefresh();
  const locked = access !== "member";
  const q = useQuery({
    queryKey: ["me", "reviews"],
    enabled: !locked,
    queryFn: async () => (await activity.reviews()).items,
  });
  return (
    <section aria-label="Minhas avaliações" className="flex flex-col gap-3 pt-5">
      <Toolbar term={term} onTerm={setTerm} label="Buscar nas avaliações" locked={locked} />
      <Section
        q={q}
        access={access}
        area="atividade"
        loading="Carregando avaliações…"
        errorTitle="Não foi possível carregar suas avaliações"
        term={term}
        match={(r, t) => matches(t, r.targetTitle, r.text)}
        empty={
          <EmptyCard
            title="Você ainda não avaliou ninguém"
            hint="Depois de visitar, comprar ou contratar, conte como foi. Sua opinião ajuda outras pessoas do bairro."
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
    </section>
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
    <li className={cn("flex flex-col gap-2.5 px-5 py-[18px]", card)}>
      <div className="flex flex-wrap items-center gap-3.5">
        <Initials name={r.targetTitle} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {r.targetHref ? (
            <Link href={r.targetHref} className="text-[15px] font-bold text-text hover:underline">
              {r.targetTitle}
            </Link>
          ) : (
            <p className="text-[15px] font-bold text-text">{r.targetTitle}</p>
          )}
          <p className="text-[13px] text-text-subtle">
            {formatDayMonth(r.createdAt)}
            {r.photoCount > 0 ? ` · ${r.photoCount} ${r.photoCount === 1 ? "foto" : "fotos"}` : ""}
            {r.status === "pending" ? " · em análise" : ""}
          </p>
        </div>
        {!editing && <Stars value={r.rating} />}
      </div>
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
                className="flex size-8 items-center justify-center"
              >
                <Star
                  className={cn(
                    "size-[22px]",
                    n <= rating ? "fill-accent text-accent" : "text-border-strong",
                  )}
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
            className="rounded-lg border border-navy-300 bg-surface p-2.5 text-sm leading-5 text-text"
          />
        </div>
      ) : (
        <>
          {r.text && <p className="text-sm leading-[22px] text-text-2">{r.text}</p>}
          {r.reply && (
            <p className="rounded-r-lg border-l-[3px] border-navy-300 bg-surface-2 px-3 py-2.5 text-[13px] leading-[19px] text-text-2">
              <b className="text-text-strong">Resposta:</b> {r.reply}
            </p>
          )}
        </>
      )}
      <div className="flex justify-end gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setRating(r.rating);
                setText(r.text ?? "");
              }}
              className="inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] font-bold text-text-muted hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={save.isPending}
              onClick={() => save.mutate()}
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-[13px] font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
            >
              Salvar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-9 items-center rounded-lg border border-primary bg-surface px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2"
            >
              Editar
            </button>
            <button
              type="button"
              disabled={del.isPending}
              onClick={() => (confirm ? del.mutate() : setConfirm(true))}
              className="inline-flex h-9 items-center rounded-lg px-3.5 text-[13px] font-bold text-danger-text hover:bg-danger-soft disabled:opacity-60"
            >
              {confirm ? "Confirmar exclusão" : "Excluir"}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/* ---------- Cupons ---------- */
const COUPON_STATUS: Record<MyCoupon["status"], { text: string; cls: string }> = {
  active: { text: "Ativo", cls: "bg-success-soft text-success-text" },
  used: { text: "Usado", cls: "bg-surface-2 text-text-muted" },
  expired: { text: "Vencido", cls: "bg-surface-2 text-text-muted" },
};

function Coupons({ access }: { access: Access }) {
  const [term, setTerm] = useState("");
  const toast = useToast();
  const locked = access !== "member";
  const q = useQuery({
    queryKey: ["me", "coupons"],
    enabled: !locked,
    queryFn: async () => (await activity.coupons()).items,
  });
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast(`Código ${code} copiado.`);
    } catch {
      toast(`Código: ${code}`, "info");
    }
  };
  return (
    <section aria-label="Meus cupons" className="flex flex-col gap-3 pt-5">
      <Toolbar term={term} onTerm={setTerm} label="Buscar nos cupons" locked={locked} />
      <Section
        q={q}
        access={access}
        area="atividade"
        loading="Carregando cupons…"
        errorTitle="Não foi possível carregar seus cupons"
        term={term}
        match={(c, t) => matches(t, c.code, c.benefit, c.profile.name)}
        empty={
          <EmptyCard
            title="Você ainda não pegou cupons."
            hint="Cupons aparecem em Ofertas e nos perfis das lojas."
            href={routes.ofertas}
            cta="Ver ofertas e cupons"
          />
        }
        render={(items) => (
          <ul className="grid gap-4 md:grid-cols-2">
            {items.map((c) => {
              const st = COUPON_STATUS[c.status];
              return (
                <li
                  key={c.id}
                  className={cn(
                    "flex items-stretch overflow-hidden",
                    card,
                    c.status !== "active" && "opacity-70",
                  )}
                >
                  <div className="flex w-[132px] shrink-0 flex-col items-center justify-center gap-1 border-r-2 border-dashed border-surface bg-primary p-3 text-center text-accent">
                    <span className="text-[11px] font-bold tracking-[0.5px] text-navy-200">CÓDIGO</span>
                    <span className="text-base font-extrabold tracking-[0.5px] break-all">{c.code}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-text">{c.benefit}</span>
                      <span
                        className={cn(
                          "ml-auto inline-flex h-[22px] shrink-0 items-center rounded px-2 text-[11px] font-bold",
                          st.cls,
                        )}
                      >
                        {st.text}
                      </span>
                    </div>
                    <span className="text-[13px] text-text-muted">{c.profile.name}</span>
                    <span className="text-xs text-text-subtle">
                      válido até {formatDayMonth(c.validUntil)}
                    </span>
                    <div className="mt-1 flex gap-2">
                      {c.status === "active" && (
                        <button
                          type="button"
                          onClick={() => void copy(c.code)}
                          className="inline-flex h-[34px] items-center rounded-lg border border-primary bg-surface px-3 text-xs font-bold text-text-strong hover:bg-surface-2"
                        >
                          Copiar código
                        </button>
                      )}
                      <Link
                        href={lojaHref(c.profile.slug)}
                        className="inline-flex h-[34px] items-center rounded-lg px-3 text-xs font-bold text-link hover:underline"
                      >
                        Ver loja ›
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      />
    </section>
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
    <section aria-label="Vistos recentemente" className="flex flex-col gap-3 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] text-text-muted">
          Só você vê este histórico. Ele ajuda a EncontraÊ a sugerir coisas parecidas.
        </span>
        <button
          type="button"
          disabled={list.length === 0}
          onClick={() => {
            clearViewed();
            setRefs([]);
          }}
          className="inline-flex h-[34px] items-center px-3 text-[13px] font-bold text-danger-text hover:underline disabled:opacity-60"
        >
          Limpar histórico
        </button>
      </div>
      <Toolbar term={term} onTerm={setTerm} label="Buscar nos vistos" locked={false} />
      {refs === null ? (
        <ListSkeleton label="Carregando histórico…" rows={2} />
      ) : list.length === 0 ? (
        <EmptyCard
          title="Histórico vazio"
          hint="O que você abrir na EncontraÊ aparece aqui para você voltar rápido."
          href={routes.explorar}
          cta="Explorar"
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
        <EmptyCard
          title="Esses itens não estão mais disponíveis."
          hint="Quando você abrir outros produtos ou lojas, eles aparecem aqui."
        />
      ) : shown.length === 0 ? (
        <EmptyCard title="Nenhum registro encontrado" hint={`Nada combina com “${term.trim()}”.`} />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((it) => {
            const at = when.get(`${it.type}:${it.slug}`);
            return (
              <li key={`${it.type}:${it.slug}`}>
                <Link
                  href={it.href}
                  className="flex flex-col overflow-hidden rounded-[14px] border border-surface-3 bg-surface hover:border-navy-300"
                >
                  <span className="relative flex h-[140px] items-center justify-center bg-primary text-2xl font-extrabold text-on-primary">
                    <span aria-hidden>{it.title.trim().slice(0, 2).toUpperCase()}</span>
                    {it.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5 px-3 py-2.5">
                    <span className="truncate text-sm font-semibold text-text">{it.title}</span>
                    {at && <span className="text-[11px] text-text-subtle">Visto {viewedWhen(at)}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
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
