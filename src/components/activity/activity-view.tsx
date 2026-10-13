"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { WantDialog } from "@/components/search/want-dialog";
import { Stars } from "@/components/catalog/stars";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { TabPanel, Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { activity, type MyCoupon, type MyReview, type Quote, type WantRow } from "@/lib/api/me";
import { createWant } from "@/lib/api/search";
import { clearViewed, readViewed } from "@/lib/domain/recently-viewed";
import { formatDayMonth, formatMoney, formatTimeAgo } from "@/lib/format";
import { avaliarHref, conversaHref, lojaHref, prestadorHref, routes } from "@/lib/routes";

const TABS = ["orcamentos", "promocao", "avaliacoes", "cupons", "vistos"] as const;
type TabId = (typeof TABS)[number];
const SUMMARY = ["me", "activity", "summary"] as const;

export function ActivityView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("aba");
  const tab: TabId = (TABS as readonly string[]).includes(raw ?? "") ? (raw as TabId) : "orcamentos";
  const setTab = (t: string) => router.replace(`${pathname}?aba=${t}`, { scroll: false });
  const summary = useQuery({ queryKey: SUMMARY, queryFn: activity.summary });
  const s = summary.data;
  const [viewedCount] = useState(() => (typeof window === "undefined" ? 0 : readViewed().length));
  const tabs = [
    { id: "orcamentos", label: "Orçamentos", count: s?.quotes ?? null },
    { id: "promocao", label: "Quero em promoção", count: s?.wants ?? null },
    { id: "avaliacoes", label: "Minhas avaliações", count: s?.reviews ?? null },
    { id: "cupons", label: "Meus cupons", count: s?.coupons ?? null },
    { id: "vistos", label: "Vistos recentemente", count: viewedCount },
  ];
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <h1 className="text-2xl font-bold text-text-strong">Minha atividade</h1>
      <Tabs label="Seções da atividade" value={tab} onChange={setTab} tabs={tabs} />
      <TabPanel label={tabs.find((t) => t.id === tab)!.label}>
        {tab === "orcamentos" && <Quotes />}
        {tab === "promocao" && <Wants />}
        {tab === "avaliacoes" && <Reviews />}
        {tab === "cupons" && <Coupons />}
        {tab === "vistos" && <Viewed />}
      </TabPanel>
    </div>
  );
}

function useRefresh() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ["me"] });
}

const Empty = ({ text, href, cta }: { text: string; href?: string; cta?: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-border p-8 text-center">
    <p className="font-bold text-text-strong">{text}</p>
    {href && cta && (
      <Link href={href} className="text-sm font-semibold text-link hover:underline">
        {cta}
      </Link>
    )}
  </div>
);

function Section<T>({
  q,
  render,
  empty,
}: {
  q: {
    isPending: boolean;
    isError: boolean;
    error: Error | null;
    data: T[] | undefined;
    refetch: () => unknown;
  };
  render: (items: T[]) => React.ReactNode;
  empty: React.ReactNode;
}) {
  if (q.isPending) return <p className="text-text-muted">Carregando…</p>;
  if (q.isError) return <ErrorState error={q.error ?? new Error("Erro")} onRetry={() => void q.refetch()} />;
  if (!q.data || q.data.length === 0) return <>{empty}</>;
  return <>{render(q.data)}</>;
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

function Quotes() {
  const toast = useToast();
  const refresh = useRefresh();
  const router = useRouter();
  const q = useQuery({ queryKey: ["me", "quotes"], queryFn: async () => (await activity.quotes()).items });
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
    <Section
      q={q}
      empty={
        <Empty text="Você ainda não pediu orçamentos." href={routes.explorar} cta="Buscar prestadores" />
      }
      render={(items) => (
        <ul className="flex flex-col gap-3">
          {items
            .filter((x) => x.status !== "canceled")
            .map((x) => {
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
                    {x.when ? ` · ${x.when}` : ""} · pedido {formatTimeAgo(x.createdAt)}
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
  );
}

const btn =
  "inline-flex h-10 items-center rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2";
const btnPrimary =
  "inline-flex h-10 items-center rounded-lg bg-primary px-3 text-sm font-bold text-on-primary hover:bg-primary-hover";

/* ---------- Quero em promoção ---------- */
const WANT_STATUS: Record<WantRow["status"], string> = {
  waiting: "Aguardando ofertas",
  found: "1 oferta encontrada",
  expired: "Expirou",
  canceled: "Cancelado",
};
const DEADLINE: Record<WantRow["deadline"], string> = {
  today: "para hoje",
  week: "esta semana",
  month: "sem pressa",
};

function Wants() {
  const { location } = useUserLocation();
  const pathname = usePathname();
  const toast = useToast();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const q = useQuery({
    queryKey: ["me", "wants"],
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
      <p className="text-sm text-text-muted">
        Diga o que você quer em promoção e avisamos as lojas perto. Elas só veem quantas pessoas querem —
        nunca quem é.
      </p>
      <button type="button" onClick={() => setOpen(true)} className={cn(btnPrimary, "self-start")}>
        <Plus className="mr-1 size-4" aria-hidden />
        Novo pedido
      </button>
      <Section
        q={q}
        empty={<Empty text="Você ainda não fez pedidos de promoção." />}
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
                    {w.maxPriceCents !== null ? ` · até ${formatMoney(w.maxPriceCents)}` : ""} · pedido{" "}
                    {formatTimeAgo(w.createdAt)}
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
                        Ver no mapa
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
function Reviews() {
  const refresh = useRefresh();
  const q = useQuery({ queryKey: ["me", "reviews"], queryFn: async () => (await activity.reviews()).items });
  return (
    <Section
      q={q}
      empty={<Empty text="Você ainda não avaliou nada." />}
      render={(items) => (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <ReviewRow key={r.id} r={r} onChanged={refresh} />
          ))}
        </ul>
      )}
    />
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

function Coupons() {
  const toast = useToast();
  const q = useQuery({ queryKey: ["me", "coupons"], queryFn: async () => (await activity.coupons()).items });
  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast("Código copiado.");
    } catch {
      toast(`Código: ${code}`, "info");
    }
  };
  return (
    <Section
      q={q}
      empty={<Empty text="Você ainda não pegou cupons." href={routes.ofertas} cta="Ver ofertas e cupons" />}
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
  );
}

/* ---------- Vistos recentemente (só neste navegador) ---------- */
function Viewed() {
  const [refs, setRefs] = useState(() => (typeof window === "undefined" ? [] : readViewed()));
  const key = refs.map((r) => `${r.type}:${r.slug}`);
  const q = useQuery({
    queryKey: ["recent", key],
    enabled: key.length > 0,
    queryFn: async () => (await activity.recent(key)).items,
  });
  const when = new Map(refs.map((r) => [`${r.type}:${r.slug}`, r.at]));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">Só você vê este histórico, e ele fica apenas neste navegador.</p>
      {refs.length > 0 && (
        <button
          type="button"
          onClick={() => {
            clearViewed();
            setRefs([]);
          }}
          className={cn(btn, "self-start")}
        >
          Limpar histórico
        </button>
      )}
      {refs.length === 0 ? (
        <Empty text="Você ainda não viu nada." href={routes.explorar} cta="Buscar no Explorar" />
      ) : q.isPending ? (
        <p className="text-text-muted">Carregando…</p>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {q.data.map((it) => {
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
