"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Bell, Flag, Heart, Navigation, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { ShareButton } from "@/components/catalog/share-button";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import { ApiError } from "@/lib/api/client";
import { discover, type Live, type LiveMessage } from "@/lib/api/discover";
import { formatCount, formatMoney } from "@/lib/format";
import { formatElapsed, HEART_MS, LIVE_MESSAGE_MAX, MAX_HEARTS, mergeMessages } from "@/lib/domain/discover";
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

export function LiveView({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["live", id],
    queryFn: () => discover.live(id),
    refetchInterval: (query) => (query.state.data?.status === "live" ? LIVE_POLL_MS : false),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const notFound = q.error instanceof ApiError && q.error.status === 404;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <Link
        href={routes.home}
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Voltar ao início
      </Link>
      {q.isPending ? (
        <p role="status" className="py-16 text-center text-text-muted">
          Carregando live…
        </p>
      ) : notFound ? (
        <section className="flex flex-col items-center gap-3 py-16 text-center">
          <h1 className="text-2xl font-bold text-text-strong">Live não encontrada</h1>
          <p className="text-text-muted">Ela pode ter acabado há muito tempo ou o link está errado.</p>
          <Link
            href={routes.explorar}
            className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-bold text-on-primary"
          >
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
    mutationFn: () =>
      actions.startConversation({
        profileId: live.profile.id,
        productId: pinned?.id,
        draft: pinned ? `Quero comprar ${pinned.title}. Ainda tem?` : undefined,
        origin: { kind: "live", id: live.id },
      }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });

  const route =
    live.lat !== null && live.lng !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${live.lat},${live.lng}`
      : live.place
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${live.profile.name} ${live.place}`)}`
        : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <section className="relative aspect-video overflow-hidden rounded-2xl bg-black text-white">
          {live.streamUrl && !ended ? (
            <video
              src={live.streamUrl}
              poster={live.coverUrl ?? undefined}
              controls
              autoPlay
              muted
              playsInline
              className="size-full object-contain"
            />
          ) : live.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={live.coverUrl} alt="" className={cn("size-full object-cover", ended && "opacity-50")} />
          ) : null}
          {!live.streamUrl && !ended && (
            <p className="absolute inset-x-0 bottom-14 text-center text-sm text-white/80">
              O vídeo ainda não está disponível. Você pode acompanhar pelo chat.
            </p>
          )}
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className={cn("rounded-full px-2.5 py-1", ended ? "bg-neutral-700" : "bg-red-600")}>
              {ended ? "ENCERRADA" : "AO VIVO"}
            </span>
            <span className="rounded-full bg-black/60 px-2.5 py-1">
              {formatCount(live.viewers)} assistindo
            </span>
            <span
              className="rounded-full bg-black/60 px-2.5 py-1 tabular-nums"
              aria-label="Tempo de transmissão"
            >
              {formatElapsed(elapsed)}
            </span>
          </div>
          <div className="pointer-events-none absolute right-4 bottom-4 h-40 w-16" aria-hidden>
            {hearts.map((h) => (
              <Heart
                key={h}
                className="absolute bottom-0 size-6 animate-[floatup_1.7s_ease-out_forwards] fill-red-500 text-red-500"
                style={{ left: `${(h * 17) % 40}px` }}
              />
            ))}
          </div>
        </section>

        {ended ? (
          <section role="status" className="rounded-2xl border border-border bg-surface p-5">
            <h1 className="text-xl font-bold text-text-strong">A live terminou: {live.title}</h1>
            <p className="mt-1 text-text-muted">
              {live.profile.name} encerrou a transmissão. As ofertas da live continuam valendo na loja.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`${profileHref}?aba=ofertas`}
                className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-bold text-on-primary"
              >
                Ver ofertas da loja
              </Link>
              <button
                type="button"
                disabled={follow.isPending}
                onClick={() => requireAuth("follow", live.profile.id) && follow.mutate(!isFollowing)}
                className="h-11 rounded-lg border border-border-strong px-5 text-sm font-semibold text-text-2 hover:bg-surface-2"
              >
                {isFollowing ? "Seguindo · vamos avisar você" : "Seguir para ser avisado da próxima"}
              </button>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            <h1 className="text-xl font-bold text-text-strong sm:text-2xl">{live.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={profileHref}
                className="inline-flex items-center gap-1 font-semibold text-link hover:underline"
              >
                {live.profile.name}
                {live.profile.verified && (
                  <BadgeCheck className="size-4" aria-label="Identidade verificada" />
                )}
              </Link>
              {live.place && <span className="text-sm text-text-muted">{live.place}</span>}
              <button
                type="button"
                disabled={follow.isPending}
                onClick={() => requireAuth("follow", live.profile.id) && follow.mutate(!isFollowing)}
                className="h-9 rounded-full border border-border-strong px-4 text-sm font-bold text-text-2 hover:bg-surface-2"
              >
                {isFollowing ? "Seguindo" : "Seguir"}
              </button>
              <button
                type="button"
                aria-label="Curtir"
                onClick={tapLike}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong px-4 text-sm font-bold text-text-2 hover:bg-surface-2"
              >
                <Heart className="size-4" aria-hidden /> {formatCount(live.likes + extraLikes)}
              </button>
              <div className="ml-auto flex items-center gap-2">
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
            </div>
          </section>
        )}

        {pinned && !ended && (
          <section
            aria-label="Em destaque agora"
            className="flex flex-col gap-3 rounded-2xl border-2 border-amber bg-surface p-4 sm:flex-row sm:items-center"
          >
            <span className="size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
              {pinned.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pinned.imageUrl} alt="" className="size-full object-cover" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-accent-text">Em destaque agora</p>
              <p className="truncate font-bold text-text-strong">{pinned.title}</p>
              <p className="text-text-strong">
                {pinned.priceCents !== null && (
                  <span className="font-bold">{formatMoney(pinned.priceCents)}</span>
                )}
                {pinned.oldPriceCents !== null && (
                  <span className="ml-2 text-sm text-text-muted line-through">
                    {formatMoney(pinned.oldPriceCents)}
                  </span>
                )}
                {pinned.tag && (
                  <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-text">
                    {pinned.tag}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={chat.isPending}
                onClick={() => requireAuth("chat", live.profile.id) && chat.mutate()}
                className="h-11 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
              >
                Quero comprar
              </button>
              <Link
                href={produtoHref(pinned.slug)}
                className="inline-flex h-11 items-center rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-2 hover:bg-surface-2"
              >
                Ver produto
              </Link>
            </div>
          </section>
        )}

        {!ended && (
          <section className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4">
            <h2 className="font-bold text-text-strong">Mais opções</h2>
            {route && (
              <a
                href={route}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline"
              >
                <Navigation className="size-4" aria-hidden /> Como chegar
                {live.place ? ` · ${live.place}` : ""}
              </a>
            )}
            <Switch
              label="Lembrar das próximas lives"
              hint={`Receba um aviso quando ${live.profile.name} entrar ao vivo`}
              checked={hasReminder}
              disabled={remind.isPending}
              onChange={(v) => requireAuth("reminder", live.id) && remind.mutate(v)}
            />
          </section>
        )}
      </div>

      <aside className="flex min-w-0 flex-col gap-4">
        <SidePanel live={live} ended={ended} requireAuth={requireAuth} />
        <OtherLives id={live.id} />
      </aside>
    </div>
  );
}

function SidePanel({
  live,
  ended,
  requireAuth,
}: {
  live: Live;
  ended: boolean;
  requireAuth: ReturnType<typeof useRequireAuth>;
}) {
  const [tab, setTab] = useState<"chat" | "produtos">("chat");
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <div role="tablist" aria-label="Painel da live" className="flex border-b border-border">
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
              "h-11 flex-1 text-sm font-bold",
              tab === id ? "border-b-2 border-primary text-text-strong" : "text-text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "chat" ? (
        <Chat live={live} ended={ended} requireAuth={requireAuth} />
      ) : (
        <ul className="flex max-h-[420px] flex-col divide-y divide-border overflow-y-auto">
          {live.products.length === 0 && (
            <li className="p-4 text-sm text-text-muted">Nenhum produto marcado nesta live.</li>
          )}
          {live.products.map((p) => (
            <li key={p.id} className={cn("flex items-center gap-3 p-3", p.pinned && "bg-accent-soft")}>
              <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="size-full object-cover" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={produtoHref(p.slug)}
                  className="block truncate font-semibold text-text-strong hover:underline"
                >
                  {p.title}
                </Link>
                {p.priceCents !== null && (
                  <p className="text-sm text-text-muted">{formatMoney(p.priceCents)}</p>
                )}
              </div>
              {p.pinned && (
                <span className="rounded-full bg-amber px-2 py-0.5 text-[11px] font-bold text-black">
                  Em destaque
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
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
    <div className="flex flex-col">
      <ul
        ref={listRef}
        aria-live="polite"
        aria-label="Mensagens do chat"
        className="flex h-[340px] flex-col gap-2 overflow-y-auto p-3"
      >
        {q.isError && <li className="text-sm text-text-muted">Não foi possível atualizar o chat agora.</li>}
        {(q.data ?? []).map((m) => (
          <li
            key={m.id}
            className={cn("rounded-lg px-3 py-2 text-sm", m.fromStore ? "bg-accent-soft" : "bg-surface-2")}
          >
            <span className="font-bold text-text-strong">
              {m.mine ? "Você" : m.author}
              {m.fromStore && (
                <span className="ml-1.5 rounded-full bg-amber px-1.5 py-0.5 text-[10px] font-bold text-black">
                  Loja
                </span>
              )}
            </span>{" "}
            <span className="text-text">{m.text}</span>
          </li>
        ))}
      </ul>
      {ended ? (
        <p className="border-t border-border p-3 text-sm text-text-muted">O chat foi encerrado com a live.</p>
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
          className="flex items-center gap-2 border-t border-border p-3"
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
            className="h-11 min-w-0 flex-1 rounded-full border border-border-strong bg-surface px-4 text-sm text-text"
          />
          <button
            type="submit"
            aria-label="Enviar mensagem"
            disabled={!text.trim() || send.isPending}
            className="flex size-11 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40"
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
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <h2 className="flex items-center gap-2 font-bold text-text-strong">
        <Bell className="size-4" aria-hidden /> Outras lives agora
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((l) => (
          <li key={l.id} className="flex items-center gap-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
              {l.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={l.coverUrl} alt="" className="size-full object-cover" />
              )}
              <span className="absolute bottom-0.5 left-0.5 rounded bg-red-600 px-1 text-[9px] font-bold text-white">
                AO VIVO
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-strong">{l.title}</p>
              <p className="truncate text-xs text-text-muted">
                {l.profileName}
                {l.place ? ` · ${l.place}` : ""} · {formatCount(l.viewers)} assistindo
              </p>
            </div>
            <Link
              href={liveHref(l.id)}
              className="inline-flex h-9 items-center rounded-lg border border-border-strong px-3 text-sm font-semibold text-text-2 hover:bg-surface-2"
            >
              Assistir
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
