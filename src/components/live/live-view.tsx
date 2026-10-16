"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  BadgeCheck,
  Bell,
  Clock,
  Eye,
  Flag,
  Heart,
  Navigation,
  Pin,
  Play,
  Send,
  VideoOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { ShareButton } from "@/components/catalog/share-button";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { InlineError, ListSkeleton } from "@/components/ui/inline-state";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import { ApiError } from "@/lib/api/client";
import { discover, type Live, type LiveMessage } from "@/lib/api/discover";
import { formatCount, formatKm, formatMoney } from "@/lib/format";
import {
  formatElapsed,
  HEART_MS,
  initials,
  LIVE_MESSAGE_MAX,
  MAX_HEARTS,
  mergeMessages,
} from "@/lib/domain/discover";
import { saveTextDraft, takeTextDraft } from "@/lib/domain/text-draft";
import {
  conversaHref,
  denunciarHref,
  liveHref,
  lojaHref,
  prestadorHref,
  produtoHref,
  routes,
} from "@/lib/routes";

const CHAT_POLL_MS = 3000;
const LIVE_POLL_MS = 10_000;

type LiveProduct = Live["products"][number];

const card = "rounded-2xl bg-surface shadow-card";
const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-accent font-extrabold text-on-accent hover:bg-accent-hover disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-lg border-[1.5px] border-primary bg-surface font-bold text-primary hover:bg-surface-2";
const overVideo =
  "inline-flex h-[34px] items-center gap-1.5 rounded-full bg-black/45 px-3 text-[13px] font-semibold text-white hover:bg-black/60";

export function LiveView({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["live", id],
    queryFn: () => discover.live(id),
    refetchInterval: (query) => (query.state.data?.status === "live" ? LIVE_POLL_MS : false),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const notFound = q.error instanceof ApiError && q.error.status === 404;

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
      <Link
        href={routes.home}
        className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-link hover:underline lg:min-h-[30px]"
      >
        <ChevronLeft className="size-4" aria-hidden /> Voltar ao início
      </Link>
      {q.isPending ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando live"
          className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
        >
          <div className="aspect-video animate-pulse rounded-2xl bg-surface-2" />
          <div className="h-[620px] animate-pulse rounded-2xl bg-surface-2" />
        </div>
      ) : notFound ? (
        <section className="flex flex-col items-center gap-3 py-16 text-center">
          <h1 className="text-2xl font-bold text-text-strong">Live não encontrada</h1>
          <p className="text-text-muted">Ela pode ter acabado há muito tempo ou o link está errado.</p>
          <Link href={routes.explorar} className={cn(btnPrimary, "h-11 px-5")}>
            Ver o que está perto de mim
          </Link>
        </section>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <Content live={q.data} />
      )}
    </div>
  );
}

function Content({ live }: { live: Live }) {
  const router = useRouter();
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const ended = live.status === "ended";
  const profileHref =
    live.profile.kind === "provider" ? prestadorHref(live.profile.slug) : lojaHref(live.profile.slug);
  const pinned = live.products.find((p) => p.pinned) ?? live.products[0] ?? null;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (ended) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [ended]);
  const elapsed =
    ((live.endedAt ? new Date(live.endedAt).getTime() : now) - new Date(live.startedAt).getTime()) / 1000;

  const [following, setFollowing] = useState<boolean | null>(null);
  const isFollowing = following ?? live.profile.following;
  const follow = useMutation({
    mutationFn: (on: boolean) => actions.follow(live.profile.id, on),
    onMutate: (on) => setFollowing(on),
    onSuccess: (_r, on) =>
      toast(on ? `Agora você segue ${live.profile.name}.` : `Você deixou de seguir ${live.profile.name}.`),
    onError: (e, on) => {
      setFollowing(!on);
      toast(e instanceof Error ? e.message : "Não foi possível atualizar.", "info");
    },
  });
  const toggleFollow = () => requireAuth("follow", live.profile.id) && follow.mutate(!isFollowing);

  const [reminder, setReminder] = useState<boolean | null>(null);
  const hasReminder = reminder ?? live.reminder;
  const remind = useMutation({
    mutationFn: (on: boolean) => actions.liveReminder(live.id, on),
    onMutate: (on) => setReminder(on),
    onSuccess: (_r, on) => toast(on ? "Pronto! Avisaremos na próxima live." : "Lembrete desligado."),
    onError: (e, on) => {
      setReminder(!on);
      toast(e instanceof Error ? e.message : "Não foi possível atualizar.", "info");
    },
  });
  useResumeAction("reminder", live.id, () => {
    if (!hasReminder) remind.mutate(true);
  });

  const [extraLikes, setExtraLikes] = useState(0);
  const [hearts, setHearts] = useState<number[]>([]);
  const nextHeart = useRef(1);
  const like = useMutation({
    mutationFn: () => discover.likeLive(live.id),
    onError: () => setExtraLikes((n) => Math.max(0, n - 1)),
  });
  const tapLike = () => {
    if (ended || !requireAuth("like", live.id)) return;
    setExtraLikes((n) => n + 1);
    const h = nextHeart.current++;
    setHearts((l) => [...l.slice(-(MAX_HEARTS - 1)), h]);
    window.setTimeout(() => setHearts((l) => l.filter((x) => x !== h)), HEART_MS);
    like.mutate();
  };
  useResumeAction("like", live.id, tapLike);

  const chat = useMutation({
    mutationFn: (p: LiveProduct | null) =>
      actions.startConversation({
        profileId: live.profile.id,
        productId: p?.id,
        draft: p ? `Quero comprar ${p.title}. Ainda tem?` : undefined,
        origin: { kind: "live", id: live.id },
      }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  const buy = (p: LiveProduct | null) => requireAuth("chat", live.profile.id) && chat.mutate(p);

  const route =
    live.lat !== null && live.lng !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${live.lat},${live.lng}`
      : live.place
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${live.profile.name} ${live.place}`)}`
        : null;

  const streaming = !!live.streamUrl && !ended;
  const chip = "inline-flex h-[26px] items-center gap-1.5 rounded-md bg-black/45 px-2.5 text-xs font-bold";

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section
            aria-label="Vídeo da live"
            className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-900 text-white sm:aspect-video"
          >
            {streaming ? (
              <video
                src={live.streamUrl as string}
                poster={live.coverUrl ?? undefined}
                controls
                autoPlay
                muted
                playsInline
                className="absolute inset-0 size-full object-contain"
              />
            ) : live.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={live.coverUrl}
                alt={ended ? "" : `Transmissão ao vivo de ${live.profile.name}`}
                className={cn("absolute inset-0 size-full object-cover", ended && "opacity-40")}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                <VideoOff className="size-12 text-white/40" />
              </span>
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_28%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.7)_100%)]"
            />

            {!live.streamUrl && !ended && (
              <p
                role="note"
                className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-lg bg-black/55 px-3 py-2 text-center text-xs text-white/90 sm:mx-auto sm:max-w-md sm:text-sm"
              >
                Vídeo da transmissão: serviço de streaming ainda não conectado. O chat e as ofertas ao lado
                funcionam normalmente.
              </p>
            )}

            <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap items-center gap-1.5 sm:top-4 sm:left-4 sm:gap-2">
              <span
                className={cn(
                  "inline-flex h-[26px] items-center gap-1.5 rounded-md px-2.5 text-xs font-extrabold tracking-[0.5px]",
                  ended ? "bg-neutral-700" : "bg-danger",
                )}
              >
                {!ended && <span className="size-2 animate-pulse rounded-full bg-white" aria-hidden />}
                {ended ? "ENCERRADA" : "AO VIVO"}
              </span>
              <span className={chip}>
                <Eye className="size-3.5" aria-hidden />
                {formatCount(live.viewers)} assistindo
              </span>
              <span className={cn(chip, "tabular-nums")} aria-label="Tempo de transmissão">
                <Clock className="size-3.5" aria-hidden />
                {formatElapsed(elapsed)}
              </span>
            </div>

            <div className="absolute top-3 right-3 hidden gap-2 sm:top-4 sm:right-4 sm:flex">
              <ShareButton
                path={liveHref(live.id)}
                title={live.title}
                noun="live"
                report={denunciarHref("live", live.id)}
                className={overVideo}
              />
              <Link href={denunciarHref("live", live.id)} className={overVideo}>
                <Flag className="size-4" aria-hidden /> Denunciar
              </Link>
            </div>

            <div className="pointer-events-none absolute right-[30px] bottom-[76px] h-40 w-10" aria-hidden>
              {hearts.map((h) => (
                <Heart
                  key={h}
                  className="absolute bottom-0 size-6 animate-[floatup_1.7s_ease-out_forwards] fill-danger text-danger"
                  style={{ left: `${(h * 17) % 40}px` }}
                />
              ))}
            </div>

            {ended ? (
              <div className="absolute inset-0 flex animate-[fadein_0.25s_ease-out_both] flex-col items-center justify-center gap-3.5 p-6 text-center">
                <span
                  className="flex size-16 items-center justify-center rounded-full bg-white/12"
                  aria-hidden
                >
                  <VideoOff className="size-7" />
                </span>
                <h1 className="text-xl leading-8 font-bold sm:text-2xl">A live terminou: {live.title}</h1>
                <p className="max-w-[420px] text-[15px] leading-[22px] text-white/80">
                  {live.profile.name} encerrou a transmissão. As ofertas da live continuam valendo na loja.
                </p>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <Link href={`${profileHref}?aba=ofertas`} className={cn(btnPrimary, "h-10 px-4 text-sm")}>
                    Ver ofertas da loja
                  </Link>
                  <button
                    type="button"
                    disabled={follow.isPending}
                    onClick={toggleFollow}
                    className="h-10 rounded-lg border-[1.5px] border-white px-4 text-sm font-bold"
                  >
                    {isFollowing ? "Seguindo · vamos avisar você" : "Seguir para ser avisado da próxima"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-4 flex flex-col gap-3 sm:inset-x-5",
                  streaming ? "bottom-14" : "bottom-4 sm:bottom-[18px]",
                )}
              >
                <h1 className="line-clamp-2 text-base leading-6 font-bold [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] sm:text-xl sm:leading-7">
                  {live.title}
                </h1>
                <div className="pointer-events-auto flex items-center gap-3">
                  <Link href={profileHref} className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-amber text-[15px] font-extrabold text-navy">
                      {initials(live.profile.name)}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1 text-[15px] font-bold">
                        <span className="truncate">{live.profile.name}</span>
                        {live.profile.verified && (
                          <BadgeCheck
                            className="size-4 shrink-0"
                            aria-label="Identidade verificada"
                            role="img"
                          />
                        )}
                      </span>
                      <span className="truncate text-xs text-white/85">
                        {live.place ?? "Local não informado"}
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    disabled={follow.isPending}
                    aria-pressed={isFollowing}
                    onClick={toggleFollow}
                    className={cn(
                      "h-[34px] shrink-0 rounded-full border-[1.5px] border-white px-4 text-[13px] font-bold",
                      isFollowing ? "bg-white/20 text-white" : "bg-white text-navy",
                    )}
                  >
                    {isFollowing ? "Seguindo" : "Seguir"}
                  </button>
                  <button
                    type="button"
                    aria-label="Curtir"
                    onClick={tapLike}
                    className="ml-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-black/45 px-4 text-sm font-bold hover:bg-black/60"
                  >
                    <Heart
                      className={cn("size-5", extraLikes > 0 && "fill-danger text-danger")}
                      aria-hidden
                    />
                    {formatCount(live.likes + extraLikes)}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* celular: compartilhar e denunciar saem do vídeo e ficam logo abaixo */}
          <div className="flex gap-2 sm:hidden">
            <ShareButton
              path={liveHref(live.id)}
              title={live.title}
              noun="live"
              report={denunciarHref("live", live.id)}
            />
            <Link
              href={denunciarHref("live", live.id)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-danger-text hover:bg-surface-2"
            >
              <Flag className="size-4" aria-hidden /> Denunciar
            </Link>
          </div>

          {!ended && (
            <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
              <Featured pinned={pinned} onBuy={() => buy(pinned)} pending={chat.isPending} />
              <section aria-label="Mais opções" className={cn(card, "flex flex-col overflow-hidden")}>
                {route ? (
                  <a
                    href={route}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center gap-3 border-b border-surface-3 px-4 py-3.5 hover:bg-surface-2"
                  >
                    <OptionIcon>
                      <Navigation className="size-5" aria-hidden />
                    </OptionIcon>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-bold text-text">Como chegar</span>
                      <span className="truncate text-xs text-text-subtle">
                        {live.place ?? "Local não informado"}
                      </span>
                    </span>
                  </a>
                ) : (
                  <div className="flex flex-1 items-center gap-3 border-b border-surface-3 px-4 py-3.5">
                    <OptionIcon>
                      <Navigation className="size-5" aria-hidden />
                    </OptionIcon>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-bold text-text">Como chegar</span>
                      <span className="text-xs text-text-subtle">Local não informado pela loja</span>
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={hasReminder}
                  disabled={remind.isPending}
                  onClick={() => requireAuth("reminder", live.id) && remind.mutate(!hasReminder)}
                  className="flex flex-1 items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2 disabled:opacity-60"
                >
                  <OptionIcon>
                    <Bell className="size-5" aria-hidden />
                  </OptionIcon>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm leading-[18px] font-bold text-text">
                      Lembrar das próximas lives
                    </span>
                    <span className="text-xs text-text-subtle">
                      {hasReminder
                        ? `Avisaremos quando ${live.profile.name} entrar ao vivo`
                        : "Receba um aviso no início"}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                      hasReminder ? "bg-success" : "bg-border-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-[3px] left-[3px] size-[18px] rounded-full bg-white transition-transform",
                        hasReminder && "translate-x-4",
                      )}
                    />
                  </span>
                </button>
              </section>
            </div>
          )}
        </div>

        <SidePanel live={live} ended={ended} requireAuth={requireAuth} onBuy={buy} />
      </div>
      <OtherLives id={live.id} />
    </>
  );
}

function OptionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-selected text-text-strong">
      {children}
    </span>
  );
}

function Featured({
  pinned,
  onBuy,
  pending,
}: {
  pinned: LiveProduct | null;
  onBuy: () => void;
  pending: boolean;
}) {
  return (
    <section aria-label="Em destaque agora" className={cn(card, "flex gap-4 p-4")}>
      {pinned ? (
        <>
          <span className="size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:size-32">
            {pinned.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pinned.imageUrl} alt={pinned.title} className="size-full object-cover" />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-text">
              <Pin className="size-3.5" aria-hidden />
              Em destaque agora
            </span>
            <span className="text-[17px] leading-6 font-bold text-text">{pinned.title}</span>
            <span className="flex flex-wrap items-baseline gap-2">
              {pinned.priceCents !== null && (
                <span className="text-xl font-extrabold text-text-strong">
                  {formatMoney(pinned.priceCents)}
                </span>
              )}
              {pinned.oldPriceCents !== null && (
                <s className="text-[13px] text-text-subtle">{formatMoney(pinned.oldPriceCents)}</s>
              )}
              {pinned.tag && (
                <span className="inline-flex h-[22px] items-center rounded bg-success-soft px-2 text-[11px] font-bold text-success-text">
                  {pinned.tag}
                </span>
              )}
            </span>
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={onBuy}
                className={cn(btnPrimary, "h-10 px-4 text-sm")}
              >
                Quero comprar
              </button>
              <Link href={produtoHref(pinned.slug)} className={cn(btnOutline, "h-10 px-4 text-sm")}>
                Ver produto
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col justify-center gap-1">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-text">
            <Pin className="size-3.5" aria-hidden />
            Em destaque agora
          </span>
          <p className="text-sm text-text-muted">A loja ainda não destacou nenhum produto nesta live.</p>
        </div>
      )}
    </section>
  );
}

function SidePanel({
  live,
  ended,
  requireAuth,
  onBuy,
}: {
  live: Live;
  ended: boolean;
  requireAuth: ReturnType<typeof useRequireAuth>;
  onBuy: (p: LiveProduct) => void;
}) {
  const [tab, setTab] = useState<"chat" | "produtos">("chat");
  return (
    <aside
      aria-label="Chat e produtos"
      className={cn(card, "flex h-[560px] min-w-0 flex-col overflow-hidden lg:h-[620px]")}
    >
      <div role="tablist" aria-label="Painel da live" className="flex gap-1 border-b border-surface-3 p-1.5">
        {(
          [
            ["chat", "Chat"],
            ["produtos", `Produtos (${live.products.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "h-10 flex-1 rounded-[10px] text-sm font-bold",
              tab === id ? "bg-primary text-on-primary" : "text-text-muted hover:bg-surface-2",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "chat" ? (
        <Chat live={live} ended={ended} requireAuth={requireAuth} />
      ) : (
        <ul className="flex min-h-0 flex-1 animate-[fadein_0.25s_ease-out_both] flex-col gap-2.5 overflow-y-auto p-3">
          {live.products.length === 0 && (
            <li className="rounded-lg bg-surface-2 px-3 py-4 text-center text-sm text-text-muted">
              Nenhum produto marcado nesta live.
            </li>
          )}
          {live.products.map((p) => (
            <li
              key={p.id}
              className={cn(
                "flex gap-3 rounded-xl border bg-surface p-3",
                p.pinned ? "border-amber" : "border-surface-3",
              )}
            >
              <span className="size-[72px] shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.title} className="size-full object-cover" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {p.pinned && (
                  <span className="text-[11px] font-bold text-accent-text">Em destaque agora</span>
                )}
                <span className="text-sm font-bold text-text">{p.title}</span>
                <span className="flex items-baseline gap-1.5">
                  {p.priceCents !== null && (
                    <span className="text-[15px] font-extrabold text-text-strong">
                      {formatMoney(p.priceCents)}
                    </span>
                  )}
                  {p.oldPriceCents !== null && (
                    <s className="text-xs text-text-subtle">{formatMoney(p.oldPriceCents)}</s>
                  )}
                </span>
                <div className="mt-1 flex gap-1.5">
                  {!ended && (
                    <button
                      type="button"
                      onClick={() => onBuy(p)}
                      className={cn(btnPrimary, "h-8 px-3 text-xs")}
                    >
                      Quero comprar
                    </button>
                  )}
                  <Link
                    href={produtoHref(p.slug)}
                    className="inline-flex h-8 items-center rounded-lg border border-primary px-3 text-xs font-bold text-primary hover:bg-surface-2"
                  >
                    Ver produto
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function Chat({
  live,
  ended,
  requireAuth,
}: {
  live: Live;
  ended: boolean;
  requireAuth: ReturnType<typeof useRequireAuth>;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const key = ["live", live.id, "messages"];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const prev = qc.getQueryData<LiveMessage[]>(key) ?? [];
      const fresh = await discover.liveMessages(live.id, prev.at(-1)?.id);
      return mergeMessages(prev, fresh.items);
    },
    refetchInterval: ended ? false : CHAT_POLL_MS,
    staleTime: 0,
  });
  const [text, setText] = useState("");
  const send = useMutation({
    mutationFn: (t: string) => discover.sendLiveMessage(live.id, t),
    onSuccess: (m) => {
      qc.setQueryData<LiveMessage[]>(key, (old) => mergeMessages(old ?? [], [m]));
      setText("");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível enviar.", "info"),
  });
  // Depois do login, o comentário digitado volta pronto no campo; a pessoa confere e envia.
  useResumeAction("comment", live.id, () => {
    const t = takeTextDraft(`live:${live.id}`, LIVE_MESSAGE_MAX);
    if (t) setText(t);
  });
  const listRef = useRef<HTMLUListElement>(null);
  const last = q.data?.at(-1)?.id;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [last]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul
        ref={listRef}
        aria-live="polite"
        aria-label="Mensagens do chat"
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3"
      >
        {q.isPending && (
          <li>
            <ListSkeleton rows={4} label="Carregando mensagens" />
          </li>
        )}
        {!q.isPending && !q.isError && (q.data ?? []).length === 0 && (
          <li className="rounded-lg bg-surface-2 px-3 py-4 text-center text-sm text-text-muted">
            Nenhuma mensagem ainda.{" "}
            {ended ? "O chat foi encerrado com a live." : "Seja a primeira pessoa a escrever."}
          </li>
        )}
        {(q.data ?? []).map((m) => (
          <li
            key={m.id}
            className={cn(
              "flex animate-[fadein_0.25s_ease-out_both] gap-2.5 rounded-[10px] px-2.5 py-2",
              m.fromStore ? "bg-accent-soft" : m.mine ? "bg-selected" : "",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-[30px] shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold",
                m.fromStore
                  ? "bg-amber text-navy"
                  : m.mine
                    ? "bg-primary text-on-primary"
                    : "bg-surface-3 text-text-muted",
              )}
            >
              {m.fromStore ? initials(live.profile.name) : initials(m.mine ? "Você" : m.author)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-text-2">{m.mine ? "Você" : m.author}</span>
                {m.fromStore && (
                  <span className="inline-flex h-[18px] items-center rounded bg-amber px-1.5 text-[10px] font-extrabold text-navy">
                    Loja
                  </span>
                )}
              </span>
              <span className="text-sm leading-5 [overflow-wrap:anywhere] text-text">{m.text}</span>
            </span>
          </li>
        ))}
      </ul>
      {q.isError && (
        <InlineError
          className="mx-3 mb-2"
          message="Não foi possível atualizar o chat agora."
          onRetry={() => void q.refetch()}
          retrying={q.isFetching}
        />
      )}
      {ended ? (
        <p className="border-t border-surface-3 px-4 py-3.5 text-center text-[13px] text-text-subtle">
          O chat foi encerrado com a live.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = text.trim();
            if (!t || t.length > LIVE_MESSAGE_MAX || send.isPending) return;
            if (!requireAuth("comment", live.id)) {
              saveTextDraft(`live:${live.id}`, t);
              return;
            }
            send.mutate(t);
          }}
          className="flex items-center gap-2 border-t border-surface-3 p-3"
        >
          <label htmlFor="live-chat" className="sr-only">
            Escreva no chat
          </label>
          <input
            id="live-chat"
            value={text}
            maxLength={LIVE_MESSAGE_MAX}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva no chat…"
            className="h-11 min-w-0 flex-1 rounded-full border border-border-strong bg-surface px-3.5 text-sm text-text"
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            disabled={!text.trim() || send.isPending}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-40"
          >
            <Send className="size-5" aria-hidden />
          </button>
        </form>
      )}
    </div>
  );
}

function OtherLives({ id }: { id: string }) {
  const { location, isLoading } = useUserLocation();
  const q = useQuery({
    queryKey: ["lives", "others", id, location.lat, location.lng, location.radiusKm],
    queryFn: () =>
      discover.otherLives({ lat: location.lat, lng: location.lng, radiusKm: location.radiusKm, exclude: id }),
    enabled: !isLoading,
    retry: false,
  });
  const items = q.data?.items ?? [];
  return (
    <section aria-label="Outras lives agora" className="flex flex-col gap-3">
      <h2 className="text-xl leading-7 font-bold text-text-strong">Outras lives agora</h2>
      {q.isError ? (
        <InlineError
          message="Não foi possível carregar as outras lives."
          onRetry={() => void q.refetch()}
          retrying={q.isFetching}
        />
      ) : q.isPending ? (
        <ListSkeleton rows={2} label="Carregando outras lives" />
      ) : items.length === 0 ? (
        <p className={cn(card, "p-4 text-sm text-text-muted")}>
          Nenhuma outra live acontecendo perto de você agora. Volte mais tarde ou ligue o lembrete da loja.
        </p>
      ) : null}
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2">
        {items.map((l) => (
          <li key={l.id}>
            <Link href={liveHref(l.id)} className={cn(card, "group flex gap-3.5 p-3 hover:shadow-raised")}>
              <span className="relative h-[88px] w-32 shrink-0 overflow-hidden rounded-xl bg-navy-900 sm:h-[104px] sm:w-44">
                {l.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.coverUrl} alt="" className="size-full object-cover" />
                )}
                <span className="absolute top-2 left-2 inline-flex h-5 items-center gap-1 rounded bg-danger px-1.5 text-[10px] font-extrabold text-white">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden />
                  AO VIVO
                </span>
                <span className="absolute bottom-2 left-2 inline-flex h-5 items-center rounded bg-black/55 px-1.5 text-[11px] font-bold text-white">
                  {formatCount(l.viewers)} assistindo
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1 py-1">
                <span className="truncate text-[13px] font-bold text-text-subtle">
                  {l.profileName}
                  {l.place ? ` · ${l.place}` : ""}
                  {l.distanceKm != null ? ` · ${formatKm(l.distanceKm)}` : ""}
                </span>
                <span className="line-clamp-2 text-[15px] leading-[22px] font-bold text-text">{l.title}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold text-link">
                  <Play className="size-3.5" aria-hidden />
                  Assistir
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
