"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Bookmark,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  Pause,
  Play,
  Send,
  Share2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { ShareButton } from "@/components/catalog/share-button";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/components/ui/cn";
import { useResumeAction } from "@/hooks/use-resume-action";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import { discover, type Story, type StoryGroup } from "@/lib/api/discover";
import { readPendingAction } from "@/lib/domain/auth-actions";
import {
  findStoryPos,
  initials,
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
import { peekTextDraft, saveTextDraft, takeTextDraft } from "@/lib/domain/text-draft";
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
  product: "text-link",
  service: "text-kind-service",
  offer: "text-accent-text",
  place: "text-success-text",
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
  const sub = storiesSubtitle(location.label, 0, []);

  if (q.isPending) {
    return (
      <Shell sub={sub} closeHref={routes.home}>
        <div
          role="status"
          aria-busy="true"
          aria-label="Carregando stories"
          className="flex h-full flex-col items-center justify-center gap-4 px-4"
        >
          <div className="h-[60%] max-h-[560px] w-full max-w-[420px] animate-pulse rounded-[18px] bg-white/10" />
          <p className="text-white/80">Carregando stories…</p>
        </div>
      </Shell>
    );
  }
  if (q.isError) {
    return (
      <Shell sub={sub} closeHref={routes.home}>
        <Centered>
          <p role="alert" className="text-xl font-bold">
            Não foi possível carregar os stories
          </p>
          <p className="max-w-sm text-white/70">
            Não é você, é a gente. Verifique a conexão e tente de novo.
          </p>
          <button
            type="button"
            onClick={() => q.refetch()}
            className="h-11 rounded-lg bg-accent px-5 font-bold text-on-accent hover:bg-accent-hover"
          >
            Tentar de novo
          </button>
        </Centered>
      </Shell>
    );
  }
  if (q.data.groups.length === 0) {
    return (
      <Shell sub={sub} closeHref={routes.home}>
        <Centered>
          <p className="text-xl font-bold">
            {perfil || destaque ? "Este perfil não tem stories ativos agora" : "Nenhum story por perto agora"}
          </p>
          <p className="max-w-sm text-white/70">
            {perfil || destaque
              ? "Os stories duram 24 horas. Volte ao perfil ou veja o que está perto de você."
              : "Stories duram 24 horas. Siga lojas para ver as novidades delas aqui, ou veja o que está perto de você."}
          </p>
          <Link
            href={routes.explorar}
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 font-bold text-on-accent hover:bg-accent-hover"
          >
            Ver o que está perto de mim
          </Link>
        </Centered>
      </Shell>
    );
  }
  return (
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
  );
}

/** Tela cheia escura: cabeçalho com marca, subtítulo e "Fechar"; o fundo é o story atual desfocado. */
function Shell({
  sub,
  bg,
  closeHref,
  onClose,
  closeLabel = "Fechar",
  note,
  children,
}: {
  note?: string;
  sub: string;
  bg?: string | null;
  closeHref?: string;
  onClose?: () => void;
  closeLabel?: string;
  children: React.ReactNode;
}) {
  const pill =
    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/12 px-4 text-sm font-semibold text-white hover:bg-white/20";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stories"
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-stage text-white"
    >
      {bg && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bg}
            alt=""
            className="absolute -top-[60px] -left-[60px] h-[calc(100%+120px)] w-[calc(100%+120px)] max-w-none transform-gpu object-cover opacity-25 blur-[40px] will-change-transform"
          />
        </div>
      )}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 px-4 lg:h-[72px] lg:px-10">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 sm:hidden">
            <Logo compact />
          </span>
          <span className="hidden shrink-0 sm:block">
            <Logo />
          </span>
          <span className="truncate text-sm font-semibold text-navy-50 sm:ml-2 sm:border-l sm:border-white/25 sm:pl-3">
            {sub}
          </span>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} className={pill}>
            <X className="size-4" aria-hidden />
            {closeLabel}
          </button>
        ) : (
          <Link href={closeHref ?? routes.home} className={pill}>
            <X className="size-4" aria-hidden />
            {closeLabel}
          </Link>
        )}
      </header>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      {note && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-[84px] left-1/2 z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 animate-[popin_0.2s_ease-out_both] rounded-lg bg-surface px-5 py-3 text-sm leading-5 font-semibold text-text-strong shadow-[0_8px_12px_rgba(0,0,0,0.3)]"
        >
          {note}
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">{children}</div>
  );
}

const replyDraftScope = (storyId: string) => `story:${storyId}`;

/**
 * Onde abrir a fila. Quem entrou na conta no meio de uma ação (curtir, salvar, responder) volta
 * exatamente ao story em que estava, mesmo que a fila tenha mudado de ordem.
 */
function startPos(groups: StoryGroup[]): Pos {
  const pending = typeof window === "undefined" ? null : readPendingAction();
  if (pending?.targetId) {
    if (pending.type === "like" || pending.type === "favorite") {
      return findStoryPos(groups, pending.targetId) ?? { g: 0, s: 0 };
    }
    if (pending.type === "chat") {
      const g = groups.findIndex((x) => x.profile.id === pending.targetId);
      const s =
        g < 0 ? -1 : groups[g].stories.findIndex((x) => peekTextDraft(replyDraftScope(x.id)) !== null);
      if (g >= 0 && s >= 0) return { g, s };
    }
  }
  return { g: 0, s: 0 };
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
  // Aviso curto no alto da tela (como no protótipo), no lugar do aviso global de baixo, que cobriria a resposta.
  const [note, setNote] = useState("");
  const noteTimer = useRef(0);
  const toast = useCallback((message: string) => {
    setNote(message);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(""), 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);
  const requireAuth = useRequireAuth();
  const sizes = groups.map((g) => g.stories.length);
  const [pos, setPos] = useState<Pos>(() => startPos(groups));
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
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Vídeo acompanha a pausa do story.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stopped) v.pause();
    else void v.play().catch(() => {});
  }, [stopped, story.id]);

  // Contagem de visualização: uma vez por story nesta sessão.
  useEffect(() => {
    if (ended || viewed.current.has(story.id)) return;
    viewed.current.add(story.id);
    void discover.view(story.id).catch(() => {});
  }, [story.id, ended]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // janela aberta (compartilhar, entrar na conta): as teclas são dela, não do story
      if (document.querySelector("dialog[open]")) return;
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
      toast(e instanceof Error ? e.message : "Não foi possível curtir.");
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
      toast(e instanceof Error ? e.message : "Não foi possível salvar.");
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
      toast(e instanceof Error ? e.message : "Não foi possível atualizar.");
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
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa."),
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
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível enviar."),
  });
  const coupon = useMutation({
    mutationFn: (id: string) => actions.claimCoupon(id),
    onSuccess: () => toast("Cupom guardado em Meus cupons."),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível pegar o cupom."),
  });

  // Depois do login: conclui o que a pessoa tentou neste story.
  useResumeAction("like", story.id, () => {
    if (!liked) like.mutate(true);
  });
  useResumeAction("favorite", story.id, () => {
    if (!saved) save.mutate(true);
  });
  useResumeAction("chat", group.profile.id, () => {
    // O texto digitado volta pronto; a pessoa confere e envia (nada é enviado sozinho).
    const text = takeTextDraft(replyDraftScope(story.id), REPLY_MAX);
    if (text) {
      setReply(text);
      setTyping(true);
    }
  });

  const profileHref =
    group.profile.kind === "provider" ? prestadorHref(group.profile.slug) : lojaHref(group.profile.slug);
  const prev = pos.g > 0 ? groups[pos.g - 1] : null;
  const next = pos.g + 1 < groups.length ? groups[pos.g + 1] : null;
  const replyDone = replied[story.id];
  const atStart = pos.g === 0 && pos.s === 0;
  const sub = single ? group.profile.name : storiesSubtitle(place, laps, interests);
  const bg = story.mediaType === "image" ? story.mediaUrl : null;

  if (ended) {
    return (
      <Shell sub={sub} closeHref={routes.home}>
        <Centered>
          <span className="flex size-16 items-center justify-center rounded-full bg-white/12" aria-hidden>
            <CheckCheck className="size-8" />
          </span>
          <h1 className="text-2xl font-bold">Você viu todos os stories de hoje</h1>
          <p className="max-w-md text-white/75">
            Siga lojas e prestadores para ver primeiro as novidades deles. Novos stories aparecem ao longo do
            dia.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="h-12 rounded-lg bg-white/12 px-6 font-bold hover:bg-white/20"
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
              className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-6 font-bold text-on-accent hover:bg-accent-hover"
            >
              Ver o que está perto de mim
            </Link>
          </div>
        </Centered>
      </Shell>
    );
  }

  const ago = formatTimeAgo(story.publishedAt);
  const rail =
    "flex flex-col items-center gap-1 text-xs font-semibold text-white transition-transform hover:scale-[1.06]";
  const railDot =
    "flex size-11 items-center justify-center rounded-full bg-white/12 lg:size-[52px] max-lg:bg-black/35";

  return (
    <Shell
      sub={sub}
      bg={bg}
      note={note}
      onClose={close}
      closeLabel={fromProfile ? "Voltar ao perfil" : "Fechar"}
    >
      <h1 className="sr-only">
        {group.highlight
          ? `${group.profile.name} · destaque ${group.highlight.name}`
          : `Stories de ${group.profile.name}`}
      </h1>
      <div className="relative flex min-h-0 flex-1 items-center justify-center gap-7 py-1">
        <NeighborCard g={prev} onClick={() => go({ g: pos.g - 1, s: 0 })} dir="prev" />
        <button
          type="button"
          aria-label="Story anterior"
          disabled={atStart}
          onClick={() => go(prevPos(sizes, pos))}
          className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-white/12 hover:bg-white/20 disabled:opacity-35 lg:flex"
        >
          <ChevronLeft className="size-[22px]" aria-hidden />
        </button>

        <article
          aria-label={`Story de ${group.profile.name}`}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="relative h-full w-full max-w-[480px] overflow-hidden bg-black shadow-[0_20px_40px_rgba(0,0,0,0.45)] lg:aspect-[9/16] lg:h-full lg:max-h-[768px] lg:w-auto lg:rounded-[18px]"
        >
          {mediaFailed[story.id] ? (
            <p
              role="alert"
              className="absolute inset-0 flex items-center justify-center bg-navy-900 px-6 text-center text-white/80"
            >
              Não foi possível carregar esta mídia.
            </p>
          ) : story.mediaType === "video" ? (
            <video
              ref={videoRef}
              key={story.id}
              src={story.mediaUrl}
              autoPlay
              muted
              playsInline
              loop
              className="absolute inset-0 size-full object-cover"
              onError={() => setMediaFailed((m) => ({ ...m, [story.id]: true }))}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={story.id}
              src={story.mediaUrl}
              alt={story.caption ?? ""}
              className="absolute inset-0 size-full animate-[fadein_0.25s_ease-out_both] object-cover"
              onError={() => setMediaFailed((m) => ({ ...m, [story.id]: true }))}
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_22%,rgba(0,0,0,0)_48%,rgba(0,10,40,0.85)_100%)]"
          />
          {/* zonas de toque: esquerda volta, direita avança */}
          <button
            type="button"
            aria-label="Voltar"
            className="absolute top-[70px] bottom-[260px] left-0 z-[2] w-[35%] cursor-w-resize"
            onClick={() => go(prevPos(sizes, pos))}
          />
          <button
            type="button"
            aria-label="Avançar"
            className="absolute top-[70px] right-0 bottom-[260px] z-[2] w-[65%] cursor-e-resize"
            onClick={advance}
          />

          <div className="absolute inset-x-3 top-2.5 z-[3] flex gap-1" aria-hidden>
            {group.stories.map((s, i) => (
              <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                <span
                  className="block h-full bg-white"
                  style={{ width: i < pos.s ? "100%" : i === pos.s ? `${progress}%` : "0%" }}
                />
              </span>
            ))}
          </div>

          <div className="absolute inset-x-3 top-[22px] z-[3] flex items-center gap-2.5">
            <Link href={profileHref} className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber bg-navy-700 text-[13px] font-extrabold">
                {group.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.profile.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  initials(group.profile.name)
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1 text-sm font-bold [text-shadow:0_1px_2px_rgba(0,0,0,.4)]">
                  <span className="truncate">{group.profile.name}</span>
                  {group.profile.verified && (
                    <BadgeCheck className="size-3.5 shrink-0" aria-label="Identidade verificada" role="img" />
                  )}
                </span>
                <span className="truncate text-xs text-navy-50">
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
              aria-pressed={following}
              onClick={() => requireAuth("follow", group.profile.id) && follow.mutate(!following)}
              className={cn(
                "h-[30px] shrink-0 rounded-full border-[1.5px] border-white px-3 text-xs font-bold",
                following ? "bg-white/15 text-white" : "bg-white text-navy",
              )}
            >
              {following ? "Seguindo" : "Seguir"}
            </button>
            <button
              type="button"
              aria-label={paused ? "Continuar" : "Pausar"}
              onClick={() => setPaused((p) => !p)}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black/25"
            >
              {paused ? (
                <Play className="size-3.5" aria-hidden />
              ) : (
                <Pause className="size-3.5" aria-hidden />
              )}
            </button>
          </div>

          <div className="absolute inset-x-4 bottom-4 z-[3] flex flex-col gap-3">
            <div className="flex flex-col gap-1 max-lg:pr-14">
              {story.caption && (
                <p className="line-clamp-3 text-[26px] leading-8 font-extrabold [text-shadow:0_2px_6px_rgba(0,0,0,.45)]">
                  {story.caption}
                </p>
              )}
              {story.subtitle && (
                <p className="line-clamp-3 text-sm leading-5 text-navy-50">{story.subtitle}</p>
              )}
            </div>
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
              <p
                role="status"
                className="flex animate-[popin_0.2s_ease-out_both] items-center gap-2.5 rounded-full bg-[rgba(25,135,84,0.92)] px-3.5 py-2.5 text-[13px]"
              >
                <span className="flex-1">Mensagem enviada para {group.profile.name} ✓</span>
                <Link href={conversaHref(replyDone)} className="font-extrabold underline">
                  Abrir conversa
                </Link>
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!validReply(reply) || sendReply.isPending) return;
                  if (!requireAuth("chat", group.profile.id)) {
                    saveTextDraft(replyDraftScope(story.id), reply.trim());
                    return;
                  }
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
                  className="h-11 min-w-0 flex-1 rounded-full border-[1.5px] border-white/60 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-white/75 focus-visible:border-amber"
                />
                <button
                  type="submit"
                  aria-label="Enviar resposta"
                  disabled={!validReply(reply) || sendReply.isPending}
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full text-navy",
                    validReply(reply) ? "bg-amber" : "bg-white/60",
                  )}
                >
                  <Send className="size-[18px]" aria-hidden />
                </button>
              </form>
            )}
          </div>

          {/* celular: curtir, enviar e salvar ficam sobre o story, à direita */}
          <div className="absolute right-3 bottom-[17.5rem] z-[4] flex flex-col gap-4 lg:hidden">
            <Rail
              liked={liked}
              likes={likes}
              saved={saved}
              onLike={() => requireAuth("like", story.id) && like.mutate(!liked)}
              onSave={() => requireAuth("favorite", story.id) && save.mutate(!saved)}
              share={{
                path: storiesHref({ perfil: group.profile.slug }),
                name: group.profile.name,
                id: story.id,
              }}
              rail={rail}
              dot={railDot}
            />
          </div>
        </article>

        <div className="hidden flex-col gap-[18px] lg:flex">
          <Rail
            liked={liked}
            likes={likes}
            saved={saved}
            onLike={() => requireAuth("like", story.id) && like.mutate(!liked)}
            onSave={() => requireAuth("favorite", story.id) && save.mutate(!saved)}
            share={{
              path: storiesHref({ perfil: group.profile.slug }),
              name: group.profile.name,
              id: story.id,
            }}
            rail={rail}
            dot={railDot}
          />
        </div>

        <button
          type="button"
          aria-label="Próximo story"
          onClick={advance}
          className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-white/12 hover:bg-white/20 lg:flex"
        >
          <ChevronRight className="size-[22px]" aria-hidden />
        </button>
        <NeighborCard g={next} onClick={() => go({ g: pos.g + 1, s: 0 })} dir="next" />
      </div>
    </Shell>
  );
}

/** Curtir, enviar (compartilhar) e salvar: colunas de ícones ao lado do story. */
function Rail({
  liked,
  likes,
  saved,
  onLike,
  onSave,
  share,
  rail,
  dot,
}: {
  liked: boolean;
  likes: number;
  saved: boolean;
  onLike: () => void;
  onSave: () => void;
  share: { path: string; name: string; id: string };
  rail: string;
  dot: string;
}) {
  return (
    <>
      <button type="button" aria-label="Curtir" aria-pressed={liked} onClick={onLike} className={rail}>
        <span className={dot}>
          <Heart className={cn("size-6", liked && "fill-danger text-danger")} aria-hidden />
        </span>
        <span>{formatCount(likes)}</span>
      </button>
      <ShareButton
        path={share.path}
        title={`Stories de ${share.name}`}
        noun="story"
        report={denunciarHref("story", share.id)}
        trigger={(open) => (
          <button type="button" aria-label="Compartilhar" onClick={open} className={rail}>
            <span className={dot}>
              <Share2 className="size-[22px]" aria-hidden />
            </span>
            <span>Enviar</span>
          </button>
        )}
      />
      <button type="button" aria-label="Salvar" aria-pressed={saved} onClick={onSave} className={rail}>
        <span className={dot}>
          <Bookmark className={cn("size-[22px]", saved && "fill-white")} aria-hidden />
        </span>
        <span>{saved ? "Salvo" : "Salvar"}</span>
      </button>
    </>
  );
}

/** Miniatura do perfil vizinho (anterior ou próximo), só em telas largas. */
function NeighborCard({
  g,
  dir,
  onClick,
}: {
  g: StoryGroup | null;
  dir: "prev" | "next";
  onClick: () => void;
}) {
  if (!g) return <span className="hidden w-[200px] shrink-0 xl:block" aria-hidden />;
  const first = g.stories[0];
  const ago = formatTimeAgo(first.publishedAt);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver stories de ${g.profile.name}`}
      data-dir={dir}
      className="relative hidden h-[356px] w-[200px] shrink-0 overflow-hidden rounded-2xl bg-navy-700 opacity-55 transition hover:scale-[1.02] hover:opacity-90 xl:block"
    >
      {first.mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={first.mediaUrl} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      <span className="absolute inset-0 bg-stage/35" />
      <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
        <span className="flex size-14 items-center justify-center overflow-hidden rounded-full border-[3px] border-amber bg-navy-700 text-base font-extrabold">
          {g.profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.profile.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials(g.profile.name)
          )}
        </span>
        <span className="px-2 text-sm font-bold [text-shadow:0_1px_3px_rgba(0,0,0,.5)]">
          {g.profile.name}
        </span>
        {ago && <span className="text-xs text-navy-50">{ago}</span>}
      </span>
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
  const btn = "flex items-center justify-center rounded-lg px-2.5 text-center text-xs leading-[14px]";
  const primary = `${btn} h-[38px] bg-accent font-extrabold text-on-accent hover:bg-accent-hover`;
  const ghost = `${btn} h-8 border border-border font-bold text-text-strong hover:bg-surface-2`;
  const name = group.profile.name;
  const thumb = tag.imageUrl ?? (story.mediaType === "image" ? story.mediaUrl : null);
  return (
    <div
      className="flex animate-[popin_0.2s_ease-out_both] items-center gap-3 rounded-[14px] bg-surface p-2.5 text-text shadow-[0_6px_14px_rgba(0,0,0,0.25)] max-sm:flex-wrap"
      data-story={story.id}
    >
      <span className="relative size-[52px] shrink-0 overflow-hidden rounded-[10px] bg-navy-700">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="absolute inset-0 size-full object-cover" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cn("text-[11px] font-bold tracking-[0.4px] uppercase", TAG_TONE[tag.kind])}>
          {TAG_LABEL[tag.kind]}
        </span>
        <span className="truncate text-[13px] leading-[18px] font-bold text-text">{tag.title}</span>
        {tag.priceCents !== null && (
          <span className="text-sm leading-5 font-extrabold text-text-strong">
            {tag.kind === "service" ? "A partir de " : ""}
            {formatMoney(tag.priceCents)}
          </span>
        )}
      </div>
      <div className="flex w-40 shrink-0 flex-col gap-1.5 max-sm:w-full max-sm:flex-row">
        {tag.kind === "product" && (
          <>
            <button
              type="button"
              className={cn(primary, "max-sm:flex-1")}
              onClick={() => chat(`Quero comprar ${tag.title}. Ainda tem?`)}
            >
              Quero comprar
            </button>
            {tag.productSlug && (
              <Link href={produtoHref(tag.productSlug)} className={cn(ghost, "max-sm:flex-1")}>
                Ver produto
              </Link>
            )}
          </>
        )}
        {tag.kind === "service" && (
          <>
            <button
              type="button"
              className={cn(primary, "max-sm:flex-1")}
              onClick={() => chat(`Olá, ${name}! Vi seu story e gostaria de um orçamento de ${tag.title}.`)}
            >
              Pedir orçamento
            </button>
            <Link href={profileHref} className={cn(ghost, "max-sm:flex-1")}>
              Ver perfil
            </Link>
          </>
        )}
        {tag.kind === "place" && (
          <>
            <button
              type="button"
              className={cn(primary, "max-sm:flex-1")}
              onClick={() => chat(`Olá, ${name}! Vi seu story e gostaria de saber mais.`)}
            >
              Falar com a loja
            </button>
            <Link href={profileHref} className={cn(ghost, "max-sm:flex-1")}>
              Ver loja
            </Link>
          </>
        )}
        {tag.kind === "offer" && (
          <>
            {tag.couponId ? (
              <button
                type="button"
                className={cn(primary, "max-sm:flex-1")}
                onClick={() => claim(tag.couponId as string)}
              >
                Pegar cupom
              </button>
            ) : (
              <Link href={routes.ofertas} className={cn(primary, "max-sm:flex-1")}>
                Ver ofertas
              </Link>
            )}
            <Link href={profileHref} className={cn(ghost, "max-sm:flex-1")}>
              Ver loja
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
