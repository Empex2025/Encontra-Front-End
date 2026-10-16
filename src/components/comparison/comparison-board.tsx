"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bookmark,
  Info,
  MessageCircle,
  Plus,
  RotateCw,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { useResumeAction } from "@/hooks/use-resume-action";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import { ApiError } from "@/lib/api/client";
import { me } from "@/lib/api/me";
import { type Cell, type ComparedItem, type Criterion, fetchComparison } from "@/lib/api/comparison";
import {
  computeWinners,
  DIFFERS_ID,
  isEqualRow,
  MAX_COMPARE,
  MAX_PRIORITIES,
  MIN_COMPARE,
  orderCriteria,
  togglePriority,
} from "@/lib/domain/comparison";
import { defaultComparisonName } from "@/lib/domain/saved-comparison";
import { conversaHref, lojaHref, prestadorHref, produtoHref, routes } from "@/lib/routes";

import { SelectableCard, TypeTag } from "./selectable-card";

const itemHref = (it: ComparedItem) =>
  it.type === "product"
    ? produtoHref(it.slug)
    : it.profile
      ? it.profile.kind === "provider"
        ? prestadorHref(it.profile.slug)
        : lojaHref(it.profile.slug)
      : routes.explorar;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** "Conversar" com a loja ou o prestador do item (chat próprio, pede conta). */
function ChatButton({ item }: { item: ComparedItem }) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const profile = item.profile;
  const chat = useMutation({
    mutationFn: () =>
      actions.startConversation({
        profileId: profile?.id ?? "",
        productId: item.type === "product" ? item.id : undefined,
        serviceId: item.type === "service" ? item.id : undefined,
      }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  useResumeAction("chat", profile?.id, () => chat.mutate());
  return (
    <button
      type="button"
      disabled={!profile || chat.isPending}
      aria-label={profile ? `Conversar com ${profile.name}` : "Conversar indisponível"}
      onClick={() => {
        if (!profile || !requireAuth("chat", profile.id)) return;
        chat.mutate();
      }}
      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
    >
      <MessageCircle className="size-4" aria-hidden />
      {chat.isPending ? "Abrindo…" : "Conversar"}
    </button>
  );
}

/** Uma informação do quadro (preço, avaliação…) em cartão. Prioridade: fundo e borda âmbar; vencedor: selo. */
function Tile({
  criterion,
  cell,
  priority,
  best,
}: {
  criterion: Criterion;
  cell: Cell | undefined;
  priority: boolean;
  best: boolean;
}) {
  const known = !!cell && cell.text !== null;
  const bool = criterion.kind === "boolean";
  return (
    <div
      className={cn(
        "flex min-h-[92px] flex-col gap-[3px] rounded-lg px-3 py-2.5",
        priority ? "bg-accent-soft shadow-[inset_3px_0_0_var(--accent)]" : "bg-bg",
      )}
    >
      <span
        className={cn(
          "text-[11px] leading-4 font-bold tracking-[.3px] uppercase",
          priority ? "text-accent-text" : "text-text-subtle",
        )}
      >
        {criterion.label}
      </span>
      {known ? (
        <>
          <span
            className={cn(
              "text-sm leading-5 font-semibold",
              bool ? (cell.value === true ? "text-success-text" : "text-text-subtle") : "text-text",
              criterion.id === DIFFERS_ID && "text-text-strong",
            )}
          >
            {cell.text}
          </span>
          {cell.detail && <span className="text-xs leading-4 text-text-subtle">{cell.detail}</span>}
        </>
      ) : (
        <span className="text-sm leading-5 text-text-subtle">Não informado</span>
      )}
      {best && criterion.priority && (
        <span className="inline-flex h-[22px] items-center gap-1 self-start rounded border border-accent-border bg-accent-soft px-2 text-[11px] leading-4 font-bold text-accent-text">
          <Star className="size-3 fill-current" aria-hidden />
          {criterion.priority.badge}
        </span>
      )}
    </div>
  );
}

/** Cartão enxuto quando o servidor não trouxe o cartão completo do item: só o que o quadro já tem. */
function LeanCard({ item, onRemove }: { item: ComparedItem; onRemove: () => void }) {
  return (
    <article className="card flex min-w-0 flex-col gap-3 rounded-2xl bg-surface p-2 pb-3 shadow-raised">
      <div className="relative flex h-[200px] items-center justify-center overflow-hidden rounded-lg bg-primary text-sm font-extrabold text-white/90">
        {initials(item.title)}
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <Link href={itemHref(item)} aria-label={`Ver ${item.title}`} className="absolute inset-0 z-[1]" />
        <span className="absolute top-2.5 left-2.5 z-[2]">
          <RemoveButton title={item.title} onRemove={onRemove} />
        </span>
        <span className="absolute top-2.5 right-2.5 z-[2]">
          <TypeTag type={item.type} />
        </span>
      </div>
      <div className="flex flex-col gap-2 px-1">
        <Link
          href={itemHref(item)}
          className="truncate text-sm leading-5 font-medium text-text hover:underline"
        >
          {item.title}
        </Link>
        {item.profile && (
          <p className="truncate text-xs font-semibold text-text">
            {item.profile.name} <span className="font-bold text-link">›</span>
          </p>
        )}
      </div>
    </article>
  );
}

function RemoveButton({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Tirar ${title} da comparação`}
      title="Remover da comparação"
      className="flex size-[30px] items-center justify-center rounded-full bg-white/90 text-navy shadow-card hover:bg-white"
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}

/** Quadro "Comparar lado a lado" (artboard CompararE1). Rota `/comparar/quadro`. */
export function ComparisonBoard() {
  const { list, remove, clear } = useComparisonSelection();
  const { location } = useUserLocation();
  const [priorities, setPriorities] = useState<string[]>([]);
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [notice, setNotice] = useState("");
  const requireAuth = useRequireAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const refs = list.map((e) => e.ref);
  const enough = refs.length >= MIN_COMPARE;
  const view = useQuery({
    queryKey: ["comparison", refs, location.lat, location.lng],
    queryFn: () => fetchComparison(refs, { lat: location.lat, lng: location.lng }),
    enabled: enough,
    retry: (n, e) => !(e instanceof ApiError && e.status === 422) && n < 2,
  });

  // Itens que deixaram de existir saem da lista.
  const missing = view.data?.missing;
  useEffect(() => {
    missing?.forEach((r) => remove(r));
  }, [missing, remove]);

  const data = view.data;
  const save = useMutation({
    mutationFn: () =>
      me.saveComparison({
        name: defaultComparisonName(
          (view.data?.items ?? []).map((i) => i.title),
          view.data?.group.label ?? "",
        ),
        items: (view.data?.items ?? []).map((i) => i.ref),
      }),
    onSuccess: () => {
      toast("Comparação salva em Favoritos › Listas.");
      void qc.invalidateQueries({ queryKey: ["me", "comparisons"] });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível salvar a comparação.", "info"),
  });
  // quem entrou na conta depois de tocar em "Salvar": a seleção continua no navegador, então salva sozinho
  const [wantSave, setWantSave] = useState(false);
  useResumeAction("saveComparison", undefined, () => setWantSave(true));
  const ready = !!view.data && view.data.items.length >= MIN_COMPARE;
  const { mutate: saveNow } = save;
  useEffect(() => {
    if (!wantSave || !ready) return;
    saveNow();
    queueMicrotask(() => setWantSave(false));
  }, [wantSave, ready, saveNow]);

  const items = data?.items ?? [];
  const criteria = data?.criteria ?? [];
  const selectable = criteria.filter((c) => c.priority);
  const validPriorities = priorities.filter((id) => selectable.some((c) => c.id === id));
  const winners = computeWinners(criteria, items, validPriorities);
  const rows = orderCriteria(criteria, validPriorities).filter(
    (c) => !onlyDiff || c.id === DIFFERS_ID || !isEqualRow(c, items),
  );
  const groupLabel = data?.group.label ?? list[0]?.group.label ?? "";

  const back = (
    <Link
      href={routes.comparar}
      className="inline-flex h-11 items-center gap-1 text-sm font-semibold text-link hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Voltar à pesquisa
    </Link>
  );

  const tooFew = !enough || (!!data && items.length < MIN_COMPARE);
  const n = tooFew ? Math.min(list.length, MAX_COMPARE) : items.length;
  const pending = enough && view.isPending;
  const failed = enough && !pending && (view.isError || !data);
  const mixed = view.error instanceof ApiError && view.error.code === "COMPARISON_MIXED_GROUP";

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <div>{back}</div>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] leading-9 font-bold text-text-strong lg:text-[32px] lg:leading-10">
            {groupLabel ? `Comparar ${groupLabel.toLowerCase()}` : "Comparar lado a lado"}
          </h1>
          <p className="text-base leading-6 text-text-muted">
            {n} {n === 1 ? "opção salva" : "opções salvas"}
            {groupLabel && ` · categoria ${groupLabel}`}
            {data?.group.kind === "product" && " · pode misturar lojas diferentes ou da mesma loja"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!ready || save.isPending || save.isSuccess}
            onClick={() => {
              if (!requireAuth("saveComparison")) return;
              save.mutate();
            }}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-primary bg-surface px-4 text-[13px] font-bold text-text-strong hover:bg-surface-2 disabled:opacity-60"
          >
            <Bookmark className="size-4" aria-hidden />
            {save.isSuccess ? "Comparação salva" : save.isPending ? "Salvando…" : "Salvar comparação"}
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={onlyDiff}
            onClick={() => setOnlyDiff((v) => !v)}
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold text-text-strong",
              onlyDiff ? "border-primary bg-selected" : "border-border bg-surface",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "relative inline-block h-4 w-7 rounded-full transition-colors",
                onlyDiff ? "bg-primary" : "bg-border-strong",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-3 rounded-full bg-white transition-[left]",
                  onlyDiff ? "left-3.5" : "left-0.5",
                )}
              />
            </span>
            Mostrar só o que é diferente
          </button>
        </div>
      </div>

      <section
        aria-label="Prioridades"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl bg-surface px-5 py-4 shadow-card"
      >
        <h2 className="mr-1 inline-flex items-center gap-2 text-base leading-6 font-bold text-text-strong">
          <SlidersHorizontal className="size-[18px]" aria-hidden />O que é mais importante para você?
        </h2>
        {selectable.map((c) => {
          const idx = validPriorities.indexOf(c.id);
          const on = idx >= 0;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                const r = togglePriority(validPriorities, c.id);
                setPriorities(r.list);
                setNotice(r.limitReached ? `Escolha até ${MAX_PRIORITIES} prioridades.` : "");
              }}
              className={cn(
                "fchip inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap",
                on
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border bg-surface text-text-2 hover:border-navy-300",
              )}
            >
              {on ? `${idx + 1}. ` : ""}
              {c.label}
            </button>
          );
        })}
        {selectable.length === 0 && (
          <span className="text-[13px] text-text-subtle">
            {pending ? "Carregando os critérios…" : "Os critérios aparecem quando a comparação carrega."}
          </span>
        )}
        {validPriorities.length > 0 && (
          <button
            type="button"
            onClick={() => setPriorities([])}
            className="h-9 px-1 text-[13px] font-semibold text-link hover:underline"
          >
            Limpar
          </button>
        )}
        <p role="status" className="basis-full text-xs leading-4 text-text-subtle">
          {notice ||
            `Escolha até ${MAX_PRIORITIES}. Essas informações sobem para o topo e mostram quem se destaca nelas.`}
        </p>
      </section>

      {tooFew && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-accent-border bg-accent-soft p-4 text-sm text-text-2 sm:flex-row sm:items-center"
        >
          <span className="flex-1">
            {list.length === 0
              ? "Nenhuma opção escolhida ainda. A comparação precisa de pelo menos 2 opções da mesma categoria."
              : `A comparação precisa de pelo menos ${MIN_COMPARE} opções.`}
          </span>
          <Link
            href={routes.comparar}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover"
          >
            Voltar à pesquisa
          </Link>
        </div>
      )}

      {pending && (
        <div
          role="status"
          aria-label="Montando a comparação"
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {Array.from({ length: Math.max(MIN_COMPARE, Math.min(list.length, MAX_COMPARE)) }, (_, i) => (
            <div key={i} aria-hidden className="h-[560px] animate-pulse rounded-2xl bg-surface-2" />
          ))}
        </div>
      )}

      {failed && (
        <section
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-6"
        >
          <h2 className="text-lg font-bold text-text-strong">
            {mixed ? "Essas opções não são da mesma categoria." : "Não foi possível montar a comparação."}
          </h2>
          <p className="text-sm text-text-muted">
            {view.error instanceof ApiError ? view.error.message : "Tente de novo em alguns segundos."}
          </p>
          {mixed ? (
            <button
              type="button"
              onClick={clear}
              className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              Começar nova comparação
            </button>
          ) : (
            <button
              type="button"
              onClick={() => view.refetch()}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover"
            >
              <RotateCw className="size-4" aria-hidden />
              Tentar de novo
            </button>
          )}
        </section>
      )}

      {!tooFew && data && (
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {items.map((it) => {
            const onRemove = () => {
              remove(it.ref);
              setNotice(`${it.title} saiu da comparação.`);
            };
            return (
              <div key={it.ref} className="fade flex min-w-0 flex-col gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs leading-4 text-text-subtle">
                  <Bookmark className="size-3.5 text-success" aria-hidden />
                  {it.profile ? `Salvo da ${it.profile.name}` : "Salvo"}
                </span>
                {it.card ? (
                  <SelectableCard
                    item={it.card}
                    imageHeight={200}
                    topLeft={<RemoveButton title={it.title} onRemove={onRemove} />}
                    topRight={<TypeTag type={it.card.type} />}
                  />
                ) : (
                  <LeanCard item={it} onRemove={onRemove} />
                )}
                <div className="flex flex-col gap-1.5 rounded-2xl bg-surface p-3 shadow-card">
                  {rows.map((c) => (
                    <Tile
                      key={c.id}
                      criterion={c}
                      cell={it.cells[c.id]}
                      priority={validPriorities.includes(c.id)}
                      best={(winners[c.id] ?? []).includes(it.ref)}
                    />
                  ))}
                  <div className="flex gap-2 pt-1.5">
                    <ChatButton item={it} />
                    <Link
                      href={itemHref(it)}
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border-[1.5px] border-primary px-3 text-sm font-bold text-text-strong hover:bg-selected"
                    >
                      {it.type === "product" ? "Ver produto" : "Ver perfil"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {items.length < MAX_COMPARE && (
            <Link
              href={routes.comparar}
              className="addtile mt-0 flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border-strong p-4 text-center text-sm font-bold text-text-strong hover:bg-surface md:mt-7 md:min-h-[460px]"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-selected">
                <Plus className="size-6" aria-hidden />
              </span>
              Adicionar opção
              <span className="max-w-[200px] text-xs font-normal text-text-subtle">
                Volte à pesquisa e salve mais {MAX_COMPARE - items.length} de {groupLabel.toLowerCase()}
              </span>
            </Link>
          )}
        </div>
      )}

      <p className="flex items-start gap-2.5 rounded-lg bg-selected px-4 py-3.5 text-[13px] leading-5 text-text-2">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          A EncontraÊ <b>não escolhe por você</b>: os destaques aparecem só no que você marcou como
          importante. Preços, horários e estoque são informados por cada loja ou prestador.
        </span>
      </p>
    </div>
  );
}
