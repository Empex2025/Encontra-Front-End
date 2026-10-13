"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheck, Bookmark, Heart, Pause, Play, Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { ShareButton } from "@/components/catalog/share-button";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import { discover, type Story, type StoryGroup } from "@/lib/api/discover";
import {
  nextPos,
  type Pos,
  prevPos,
  REPLY_MAX,
  STORY_SECONDS,
  storiesSubtitle,
  storyMeta,
  validReply,
} from "@/lib/domain/discover";
import { formatCount, formatMoney, formatTimeAgo } from "@/lib/format";
import {
  conversaHref,
  denunciarHref,
  lojaHref,
  prestadorHref,
  produtoHref,
  routes,
  storiesHref,
} from "@/lib/routes";

const TICK_MS = 100;
const TAG_LABEL = { product: "Produto", service: "Serviço", offer: "Oferta", place: "No mapa" } as const;
const TAG_TONE = {
  product: "bg-navy-600 text-white",
  service: "bg-[#8a5a2b] text-white",
  offer: "bg-amber text-black",
  place: "bg-[#146c43] text-white",
} as const;

type Local = { liked?: boolean; likes?: number; saved?: boolean };

export function StoriesViewer() {
  const params = useSearchParams();
  const perfil = params.get("perfil");
  const destaque = params.get("destaque");
  const inicio = params.get("inicio");
  const { location } = useUserLocation();
  const q = useQuery({
    queryKey: ["stories", perfil, destaque, inicio, location.lat, location.lng, location.radiusKm],
    queryFn: () =>
      discover.stories({
        lat: location.lat,
        lng: location.lng,
        radiusKm: location.radiusKm,
        start: inicio,
        profile: perfil,
        highlight: destaque,
      }),
    staleTime: 0,
  });

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-black text-white">
      {q.isPending ? (
        <p role="status" className="flex h-full items-center justify-center text-white/80">
          Carregando stories…
        </p>
      ) : q.isError ? (
        <Centered>
          <p className="text-lg font-bold">Não foi possível carregar os stories</p>
          <button
            type="button"
            onClick={() => q.refetch()}
            className="h-11 rounded-lg bg-white px-5 font-bold text-black"
          >
            Tentar de novo
          </button>
          <CloseLink perfil={null} />
        </Centered>
      ) : q.data.groups.length === 0 ? (
        <Centered>
          <p className="text-lg font-bold">Nenhum story por perto agora</p>
          <p className="text-white/70">Volte mais tarde ou veja o que está perto de você.</p>
          <Link
            href={routes.explorar}
            className="inline-flex h-11 items-center rounded-lg bg-white px-5 font-bold text-black"
          >
            Ver o que está perto de mim
          </Link>
          <CloseLink perfil={null} />
        </Centered>
      ) : (
        <Player
          groups={q.data.groups}
          interests={q.data.interests}
          place={location.label}
          fromProfile={
            perfil
              ? q.data.groups[0].profile.kind === "provider"
                ? prestadorHref(perfil)
                : lojaHref(perfil)
              : null
          }
          single={!!perfil}
        />
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">{children}</div>
  );
}

function CloseLink({ perfil }: { perfil: string | null }) {
  return (
    <Link href={perfil ?? routes.home} className="text-sm font-semibold text-white/80 underline">
      Fechar
    </Link>
  );
}

function Player({
  groups,
  interests,
  place,
  fromProfile,
  single,
}: {
  groups: StoryGroup[];
  interests: string[];
  place: string;
  fromProfile: string | null;
  single: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const sizes = groups.map((g) => g.stories.length);
  const [pos, setPos] = useState<Pos>({ g: 0, s: 0 });
  const [laps, setLaps] = useState(0);
  const [ended, setEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hover, setHover] = useState(false);
  const [progress, setProgress] = useState(0);
  const [local, setLocal] = useState<Record<string, Local>>({});
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [replied, setReplied] = useState<Record<string, string>>({});
  const [reply, setReply] = useState("");
  const [mediaFailed, setMediaFailed] = useState<Record<string, boolean>>({});
  const elapsed = useRef(0);
  const viewed = useRef(new Set<string>());

  const group = groups[pos.g];
  const story = group.stories[pos.s];
  const following = followed[group.profile.id] ?? group.following;
  const st: Local = local[story.id] ?? {};
  const liked = st.liked ?? story.liked;
  const likes = st.likes ?? story.likes;
  const saved = st.saved ?? story.saved;
  const stopped = paused || typing || hover || ended;

  const close = useCallback(() => router.push(fromProfile ?? routes.home), [router, fromProfile]);

  const go = useCallback((p: Pos) => {
    elapsed.current = 0;
    setProgress(0);
    setReply("");
    setPos(p);
  }, []);

  const advance = useCallback(() => {
    const n = nextPos(sizes, pos);
    if (n) return go(n);
    if (single) return close();
    setEnded(true);
  }, [sizes, pos, go, single, close]);

  // Cada story dura 5 s; o tempo para ao pausar, passar o mouse ou digitar a resposta.
  useEffect(() => {
    if (stopped) return;
    const id = window.setInterval(() => {
      elapsed.current += TICK_MS;
      if (elapsed.current >= STORY_SECONDS * 1000) advance();
      else setProgress((elapsed.current / (STORY_SECONDS * 1000)) * 100);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [stopped, advance]);

  // Contagem de visualização: uma vez por story nesta sessão.
  useEffect(() => {
    if (ended || viewed.current.has(story.id)) return;
    viewed.current.add(story.id);
    void discover.view(story.id).catch(() => {});
  }, [story.id, ended]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA")
        return;
      if (e.key === "ArrowRight") advance();
      else if (e.key === "ArrowLeft") go(prevPos(sizes, pos));
      else if (e.key === "Escape") close();
      else if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, go, sizes, pos, close]);

  const patch = (id: string, v: Local) => setLocal((l) => ({ ...l, [id]: { ...l[id], ...v } }));

  const like = useMutation({
    mutationFn: (on: boolean) => discover.like(story.id, on),
    onMutate: (on) => patch(story.id, { liked: on, likes: Math.max(0, likes + (on ? 1 : -1)) }),
    onSuccess: (r) => patch(story.id, { likes: r.likes }),
    onError: (e, on) => {
      patch(story.id, { liked: !on, likes });
      toast(e instanceof Error ? e.message : "Não foi possível curtir.", "info");
    },
  });
  const save = useMutation({
    mutationFn: (on: boolean) => discover.save(story.id, on),
    onMutate: (on) => patch(story.id, { saved: on }),
    onSuccess: (_r, on) =>
      toast(
        on ? (story.tag?.productId ? "Salvo em Meus Favoritos." : "Story salvo.") : "Removido dos salvos.",
      ),
    onError: (e, on) => {
      patch(story.id, { saved: !on });
      toast(e instanceof Error ? e.message : "Não foi possível salvar.", "info");
    },
  });
  const follow = useMutation({
    mutationFn: (on: boolean) => actions.follow(group.profile.id, on),
    onMutate: (on) => setFollowed((f) => ({ ...f, [group.profile.id]: on })),
    onSuccess: (_r, on) =>
      toast(
        on
          ? `Agora você segue ${group.profile.name}. Os stories dele aparecem primeiro.`
          : `Você deixou de seguir ${group.profile.name}.`,
      ),
    onError: (e, on) => {
      setFollowed((f) => ({ ...f, [group.profile.id]: !on }));
      toast(e instanceof Error ? e.message : "Não foi possível atualizar.", "info");
    },
  });
  const chat = useMutation({
    mutationFn: (draft: string) =>
      actions.startConversation({
        profileId: group.profile.id,
        productId: story.tag?.productId ?? undefined,
        draft,
        origin: { kind: "story", id: story.id },
      }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  const sendReply = useMutation({
    mutationFn: (text: string) =>
      actions.startConversation({
        profileId: group.profile.id,
        productId: story.tag?.productId ?? undefined,
        firstMessage: text,
        origin: { kind: "story", id: story.id },
      }),
    onSuccess: (c) => {
      setReplied((r) => ({ ...r, [story.id]: c.id }));
      setReply("");
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível enviar.", "info"),
  });
  const coupon = useMutation({
    mutationFn: (id: string) => actions.claimCoupon(id),
    onSuccess: () => toast("Cupom guardado em Meus cupons."),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível pegar o cupom.", "info"),
  });

  const profileHref =
    group.profile.kind === "provider" ? prestadorHref(group.profile.slug) : lojaHref(group.profile.slug);
  const prev = pos.g > 0 ? groups[pos.g - 1] : null;
  const next = pos.g + 1 < groups.length ? groups[pos.g + 1] : null;
  const replyDone = replied[story.id];

  if (ended) {
    return (
      <Centered>
        <h1 className="text-2xl font-bold">Você viu todos os stories de hoje</h1>
        <p className="max-w-sm text-white/70">
          Siga lojas e prestadores para ver primeiro as novidades deles.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="h-12 rounded-lg bg-white px-6 font-bold text-black"
            onClick={() => {
              setEnded(false);
              setLaps((l) => l + 1);
              go({ g: 0, s: 0 });
            }}
          >
            Ver de novo
          </button>
          <Link
            href={routes.explorar}
            className="inline-flex h-12 items-center rounded-lg border border-white/60 px-6 font-bold"
          >
            Ver o que está perto de mim
          </Link>
        </div>
        <CloseLink perfil={null} />
      </Centered>
    );
  }

  const ago = formatTimeAgo(story.publishedAt);

  return (
    <div
      className="relative flex h-full flex-col"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.mediaUrl}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl"
      />
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 truncate text-sm font-semibold">
          {single ? group.profile.name : storiesSubtitle(place, laps, interests)}
        </p>
        <button
          type="button"
          onClick={close}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-white/15 px-3 text-sm font-bold hover:bg-white/25"
        >
          <X className="size-4" aria-hidden />
          {fromProfile ? "Voltar ao perfil" : "Fechar"}
        </button>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center gap-4 px-2 pb-3 sm:px-6">
        <NeighborButton g={prev} dir="prev" onClick={() => go({ g: pos.g - 1, s: 0 })} />
        <article
          aria-label={`Story de ${group.profile.name}`}
          className="relative flex h-full max-h-[760px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl bg-black"
        >
          <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-2" aria-hidden>
            {group.stories.map((s, i) => (
              <span key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                <span
                  className="block h-full bg-white"
                  style={{ width: i < pos.s ? "100%" : i === pos.s ? `${progress}%` : "0%" }}
                />
              </span>
            ))}
          </div>

          <div className="absolute inset-x-0 top-4 z-20 flex items-center gap-2 px-3 pt-2">
            <Link href={profileHref} className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-bold">
                {group.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.profile.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  group.profile.name[0]
                )}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 truncate text-sm font-bold">
                  {group.profile.name}
                  {group.profile.verified && (
                    <BadgeCheck className="size-4 shrink-0 text-amber" aria-label="Identidade verificada" />
                  )}
                </span>
                <span className="block truncate text-xs text-white/80">
                  {storyMeta(
                    {
                      typeLabel: group.profile.typeLabel,
                      distanceKm: group.distanceKm,
                      highlight: group.highlight,
                    },
                    ago,
                  )}
                </span>
              </span>
            </Link>
            <button
              type="button"
              disabled={follow.isPending}
              onClick={() => requireAuth("follow", group.profile.id) && follow.mutate(!following)}
              className="h-8 rounded-full border border-white/70 px-3 text-xs font-bold"
            >
              {following ? "Seguindo" : "Seguir"}
            </button>
            <button
              type="button"
              aria-label={paused ? "Continuar" : "Pausar"}
              onClick={() => setPaused((p) => !p)}
              className="flex size-9 items-center justify-center rounded-full bg-white/15"
            >
              {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
            </button>
          </div>

          <div className="relative min-h-0 flex-1 bg-neutral-900">
            {mediaFailed[story.id] ? (
              <p
                role="alert"
                className="flex h-full items-center justify-center px-6 text-center text-white/80"
              >
                Não foi possível carregar esta mídia.
              </p>
            ) : story.mediaType === "video" ? (
              <video
                key={story.id}
                src={story.mediaUrl}
                autoPlay
                muted
                playsInline
                loop
                className="size-full object-cover"
                onError={() => setMediaFailed((m) => ({ ...m, [story.id]: true }))}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={story.id}
                src={story.mediaUrl}
                alt={story.caption ?? ""}
                className="size-full object-cover"
                onError={() => setMediaFailed((m) => ({ ...m, [story.id]: true }))}
              />
            )}
            {/* zonas de toque: esquerda volta, direita avança */}
            <button
              type="button"
              aria-label="Story anterior"
              className="absolute inset-y-24 left-0 w-1/3"
              onClick={() => go(prevPos(sizes, pos))}
            />
            <button
              type="button"
              aria-label="Próximo story"
              className="absolute inset-y-24 right-0 w-1/3"
              onClick={advance}
            />
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-16">
            {story.caption && <p className="text-sm">{story.caption}</p>}
            {story.tag && (
              <TagCard
                story={story}
                tag={story.tag}
                group={group}
                chat={(d) => requireAuth("chat", group.profile.id) && chat.mutate(d)}
                claim={(id) => requireAuth("coupon", id) && coupon.mutate(id)}
              />
            )}

            {replyDone ? (
              <p role="status" className="text-sm font-semibold">
                Mensagem enviada para {group.profile.name} ✓ ·{" "}
                <Link href={conversaHref(replyDone)} className="underline">
                  Abrir conversa
                </Link>
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validReply(reply) || sendReply.isPending) return;
                  if (!requireAuth("chat", group.profile.id)) return;
                  sendReply.mutate(reply.trim());
                }}
                className="flex items-center gap-2"
              >
                <label className="sr-only" htmlFor="story-reply">
                  Responder a {group.profile.name}
                </label>
                <input
                  id="story-reply"
                  value={reply}
                  maxLength={REPLY_MAX}
                  onChange={(e) => setReply(e.target.value)}
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                  placeholder={`Responder a ${group.profile.name}…`}
                  className="h-11 min-w-0 flex-1 rounded-full border border-white/50 bg-black/40 px-4 text-sm text-white placeholder:text-white/60"
                />
                <button
                  type="submit"
                  aria-label="Enviar resposta"
                  disabled={!validReply(reply) || sendReply.isPending}
                  className="flex size-11 items-center justify-center rounded-full bg-white text-black disabled:opacity-40"
                >
                  <Send className="size-5" aria-hidden />
                </button>
              </form>
            )}

            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                aria-pressed={liked}
                onClick={() => requireAuth("like", story.id) && like.mutate(!liked)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3 font-semibold"
              >
                <Heart className={`size-4 ${liked ? "fill-red-500 text-red-500" : ""}`} aria-hidden />
                {formatCount(likes)}
              </button>
              <ShareButton
                path={storiesHref({ perfil: group.profile.slug })}
                title={`Stories de ${group.profile.name}`}
                noun="story"
                report={denunciarHref("story", story.id)}
                label="Enviar"
              />
              <button
                type="button"
                aria-pressed={saved}
                onClick={() => requireAuth("favorite", story.id) && save.mutate(!saved)}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3 font-semibold"
              >
                <Bookmark className={`size-4 ${saved ? "fill-white" : ""}`} aria-hidden />
                {saved ? "Salvo" : "Salvar"}
              </button>
              <span className="ml-auto text-white/80">{formatCount(story.views)} views</span>
            </div>
          </div>
        </article>
        <NeighborButton g={next} dir="next" onClick={() => go({ g: pos.g + 1, s: 0 })} />
      </div>
    </div>
  );
}

function NeighborButton({
  g,
  dir,
  onClick,
}: {
  g: StoryGroup | null;
  dir: "prev" | "next";
  onClick: () => void;
}) {
  if (!g) return <span className="hidden w-24 shrink-0 lg:block" aria-hidden />;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? `Story anterior: ${g.profile.name}` : `Próximo story: ${g.profile.name}`}
      className="hidden w-24 shrink-0 flex-col items-center gap-2 opacity-70 hover:opacity-100 lg:flex"
    >
      <span className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-white/20 text-lg font-bold">
        {g.profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={g.profile.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          g.profile.name[0]
        )}
      </span>
      <span className="line-clamp-2 text-center text-xs font-semibold">{g.profile.name}</span>
    </button>
  );
}

function TagCard({
  story,
  tag,
  group,
  chat,
  claim,
}: {
  story: Story;
  tag: NonNullable<Story["tag"]>;
  group: StoryGroup;
  chat: (draft: string) => void;
  claim: (couponId: string) => void;
}) {
  const profileHref =
    group.profile.kind === "provider" ? prestadorHref(group.profile.slug) : lojaHref(group.profile.slug);
  const btn = "flex h-10 flex-1 items-center justify-center rounded-lg px-3 text-sm font-bold";
  const primary = `${btn} bg-white text-black`;
  const ghost = `${btn} border border-white/70 text-white`;
  const name = group.profile.name;
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-black/60 p-3 backdrop-blur" data-story={story.id}>
      <div className="flex items-center gap-3">
        <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-white/20">
          {tag.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tag.imageUrl} alt="" className="size-full object-cover" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${TAG_TONE[tag.kind]}`}
          >
            {TAG_LABEL[tag.kind]}
          </span>
          <p className="truncate text-sm font-bold">{tag.title}</p>
          {tag.priceCents !== null && <p className="text-sm text-white/80">{formatMoney(tag.priceCents)}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        {tag.kind === "product" && (
          <>
            <button
              type="button"
              className={primary}
              onClick={() => chat(`Quero comprar ${tag.title}. Ainda tem?`)}
            >
              Quero comprar
            </button>
            {tag.productSlug && (
              <Link href={produtoHref(tag.productSlug)} className={ghost}>
                Ver produto
              </Link>
            )}
          </>
        )}
        {tag.kind === "service" && (
          <>
            <button
              type="button"
              className={primary}
              onClick={() => chat(`Olá, ${name}! Vi seu story e gostaria de um orçamento de ${tag.title}.`)}
            >
              Pedir orçamento
            </button>
            <Link href={profileHref} className={ghost}>
              Ver perfil
            </Link>
          </>
        )}
        {tag.kind === "place" && (
          <>
            <button
              type="button"
              className={primary}
              onClick={() => chat(`Olá, ${name}! Vi seu story e gostaria de saber mais.`)}
            >
              Falar com a loja
            </button>
            <Link href={profileHref} className={ghost}>
              Ver loja
            </Link>
          </>
        )}
        {tag.kind === "offer" && (
          <>
            {tag.couponId ? (
              <button type="button" className={primary} onClick={() => claim(tag.couponId as string)}>
                Pegar cupom
              </button>
            ) : (
              <Link href={routes.ofertas} className={primary}>
                Ver ofertas
              </Link>
            )}
            <Link href={profileHref} className={ghost}>
              Ver loja
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
