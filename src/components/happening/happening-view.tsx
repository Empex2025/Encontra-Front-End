"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  Clock,
  Flag,
  MapPin,
  MessageCircle,
  Navigation,
  Star,
  Tag,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useResumeAction } from "@/hooks/use-resume-action";
import { useRequireAuth } from "@/components/auth/auth-invite";
import { ShareButton } from "@/components/catalog/share-button";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { InlineError, ListSkeleton } from "@/components/ui/inline-state";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import { API_BASE, ApiError } from "@/lib/api/client";
import { discover, type Happening, type NearbyHappening } from "@/lib/api/discover";
import { eventChip, eventDayBadge, eventWhen, eventWhenText, initials } from "@/lib/domain/discover";
import { formatDayMonth, formatKm, formatMoney } from "@/lib/format";
import { whatsappUrl } from "@/lib/domain/whatsapp";
import {
  conversaHref,
  denunciarHref,
  eventoHref,
  explorarComBusca,
  lojaHref,
  prestadorHref,
  routes,
} from "@/lib/routes";

type Mark = "going" | "interested" | null;

const AVATAR_TONES = [
  "bg-navy-700",
  "bg-accent-text",
  "bg-success",
  "bg-danger-text",
  "bg-primary",
  "bg-text-muted",
] as const;

const card = "rounded-2xl bg-surface shadow-card";
const h2 = "text-xl leading-7 font-bold text-text-strong";
const pad2 = (n: number) => String(n).padStart(2, "0");
const count = (n: number) => n.toLocaleString("pt-BR");

/** Partes do selo de data: "OUT" · "15" · "qui". */
function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    mon: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
    day: pad2(d.getDate()),
    wk: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
  };
}

export function HappeningView({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["happening", id],
    queryFn: () => discover.happening(id),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const notFound = q.error instanceof ApiError && q.error.status === 404;
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
      <Link
        href={routes.home}
        className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-link hover:underline lg:min-h-5"
      >
        <ArrowLeft className="size-4" aria-hidden /> Voltar para o início
      </Link>
      {q.isPending ? (
        <div role="status" aria-busy="true" aria-label="Carregando evento" className="flex flex-col gap-4">
          <div className="h-[260px] animate-pulse rounded-[20px] bg-surface-2 sm:h-80" />
          <div className="h-12 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-32 animate-pulse rounded-2xl bg-surface-2" />
        </div>
      ) : notFound ? (
        <section className="flex flex-col items-center gap-3 py-16 text-center">
          <h1 className="text-2xl font-bold text-text-strong">Evento não encontrado</h1>
          <p className="text-text-muted">Ele pode ter sido removido ou o link está errado.</p>
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
        <Content ev={q.data} />
      )}
    </div>
  );
}

function Content({ ev }: { ev: Happening }) {
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const requireAuth = useRequireAuth();
  const key = ["happening", ev.id];
  const when = eventWhen(ev.startsAt, ev.endsAt);
  const chip = eventChip(ev.startsAt, ev.endsAt);
  const past = when.state === "past";
  const live = when.state === "now";
  const date = dateParts(ev.startsAt);

  const mark = useMutation({
    mutationFn: ({ kind, previous }: { kind: Mark; previous: Mark }) =>
      discover.attend(ev.id, kind, previous),
    onMutate: async ({ kind, previous }) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<Happening>(key);
      qc.setQueryData<Happening>(key, (h) => {
        if (!h) return h;
        const d = (k: "going" | "interested") => (kind === k ? 1 : 0) - (previous === k ? 1 : 0);
        return {
          ...h,
          myAttendance: kind,
          going: Math.max(0, h.going + d("going")),
          interested: Math.max(0, h.interested + d("interested")),
        };
      });
      return { before };
    },
    onSuccess: (_r, { kind, previous }) =>
      toast(
        kind === "going"
          ? "Presença confirmada. Te avisamos 1 h antes."
          : kind === "interested"
            ? "Marcado como interesse. Você recebe novidades do evento."
            : previous === "going"
              ? "Presença cancelada."
              : "Interesse removido.",
      ),
    onError: (e, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(key, ctx.before);
      toast(e instanceof Error ? e.message : "Não foi possível atualizar.", "info");
    },
  });
  const toggle = (kind: "going" | "interested") => {
    if (!requireAuth(kind === "going" ? "attend" : "interest", ev.id)) return;
    const previous = ev.myAttendance;
    mark.mutate({ kind: previous === kind ? null : kind, previous });
  };
  const markIfNot = (kind: "going" | "interested") => {
    if (ev.myAttendance !== kind) mark.mutate({ kind, previous: ev.myAttendance });
  };
  useResumeAction("attend", ev.id, () => markIfNot("going"));
  useResumeAction("interest", ev.id, () => markIfNot("interested"));

  const claim = useMutation({
    mutationFn: (couponId: string) => actions.claimCoupon(couponId),
    onSuccess: () => {
      toast("Cupom guardado em Meus cupons.");
      void qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível pegar o cupom.", "info"),
  });

  const ask = useMutation({
    mutationFn: () =>
      actions.startConversation({
        profileId: ev.organizer.profileId as string,
        draft: `Olá! Tenho uma pergunta sobre o evento ${ev.title}.`,
        origin: { kind: "happening", id: ev.id },
      }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  const askOrganizer = () =>
    ev.organizer.profileId && requireAuth("chat", ev.organizer.profileId) && ask.mutate();

  const orgHref = ev.organizer.slug
    ? ev.organizer.kind === "provider"
      ? prestadorHref(ev.organizer.slug)
      : lojaHref(ev.organizer.slug)
    : explorarComBusca(ev.organizer.name);
  const route =
    ev.lat !== null && ev.lng !== null
      ? `https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`
      : ev.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.address)}`
        : null;
  const signup = whatsappUrl(ev.signupWhatsapp, `Olá! Quero me inscrever no evento ${ev.title}.`);
  const price = ev.priceCents !== null ? `Inscrição ${formatMoney(ev.priceCents)}` : "Inscrição paga";
  const org = ev.organizer.name;
  const going = ev.myAttendance === "going";
  const interested = ev.myAttendance === "interested";
  const act =
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-4 text-sm font-semibold text-text-strong hover:bg-surface-2";

  return (
    <article className="flex flex-col gap-6">
      <header
        aria-label="Capa do evento"
        className="relative h-[280px] overflow-hidden rounded-[20px] bg-navy text-white sm:h-80"
      >
        {ev.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,21,79,0.05)_0%,rgba(0,21,79,0.35)_45%,rgba(0,10,40,0.88)_100%)]"
        />
        <div className="absolute right-4 bottom-5 left-4 flex items-end gap-4 sm:right-8 sm:bottom-7 sm:left-8 sm:gap-6">
          <div
            role="img"
            aria-label={`Data: ${date.day} de ${date.mon.toLowerCase()}`}
            className="flex w-16 shrink-0 flex-col items-center rounded-2xl bg-white pt-2 pb-2.5 text-center shadow-[0_8px_16px_rgba(0,0,0,0.2)] sm:w-[88px] sm:pt-2.5 sm:pb-3"
          >
            <span className="text-xs leading-4 font-extrabold tracking-[1px] text-danger">{date.mon}</span>
            <span className="text-[30px] leading-9 font-extrabold text-navy sm:text-[38px] sm:leading-[42px]">
              {date.day}
            </span>
            <span className="text-xs leading-4 font-semibold text-text-subtle">{date.wk}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <div className="flex flex-wrap gap-2 text-xs font-extrabold">
              <span
                className={cn(
                  "inline-flex h-[26px] items-center rounded-full px-3",
                  eventDayBadge(ev.startsAt) === "Hoje" ? "bg-amber text-navy" : "bg-white text-navy",
                )}
              >
                {eventDayBadge(ev.startsAt)}
              </span>
              <span
                className={cn(
                  "inline-flex h-[26px] items-center rounded-full px-3",
                  ev.free ? "bg-success-soft text-success-text" : "bg-white text-navy",
                )}
              >
                {ev.free ? "Gratuito" : price}
              </span>
            </div>
            <h1 className="text-[28px] leading-[34px] font-extrabold sm:text-[40px] sm:leading-[48px]">
              {ev.title}
            </h1>
            <Link href={orgHref} className="inline-flex items-center gap-2.5 self-start">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white/80 bg-navy-700 text-[13px] font-extrabold">
                {initials(org)}
              </span>
              <span className="flex flex-col">
                <span className="text-xs leading-4 text-white/75">Organizado por</span>
                <span className="text-[15px] leading-5 font-bold">{org} ›</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <section aria-label="Ações do evento" className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          aria-pressed={going}
          disabled={mark.isPending || past}
          onClick={() => toggle("going")}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-lg px-[22px] text-[15px] font-extrabold disabled:opacity-60",
            going
              ? "border-[1.5px] border-success-text bg-success-soft text-success-text"
              : "bg-accent text-on-accent hover:bg-accent-hover",
          )}
        >
          <Check className="size-[18px]" aria-hidden />
          {going ? "Você vai" : "Vou"}
        </button>
        <button
          type="button"
          aria-pressed={interested}
          disabled={mark.isPending || past}
          onClick={() => toggle("interested")}
          className={cn(
            "inline-flex h-12 items-center gap-2 rounded-lg border px-[18px] text-sm font-bold text-text-strong disabled:opacity-60",
            interested ? "border-primary bg-selected" : "border-border-strong bg-surface hover:bg-surface-2",
          )}
        >
          <Star className={cn("size-[18px]", interested && "fill-current")} aria-hidden />
          {interested ? "Interessado" : "Tenho interesse"}
        </button>
        <a href={`${API_BASE}/happenings/${encodeURIComponent(ev.id)}/calendar.ics`} className={act}>
          <CalendarPlus className="size-[18px]" aria-hidden /> Adicionar à agenda
        </a>
        <ShareButton
          path={eventoHref(ev.id)}
          title={ev.title}
          noun="evento"
          report={denunciarHref("evento", ev.id)}
          className={act}
        />
        <span className="hidden flex-1 sm:block" />
        <p className="text-sm text-text-muted" aria-live="polite">
          <b className="text-text">{count(ev.going)}</b> vão · {count(ev.interested)} interessados
        </p>
        <Link
          href={denunciarHref("evento", ev.id)}
          className="inline-flex h-11 items-center gap-1.5 px-2 text-[13px] font-semibold text-text-subtle hover:text-danger-text"
        >
          <Flag className="size-4" aria-hidden /> Denunciar
        </Link>
        {past && (
          <p role="status" className="w-full text-sm font-semibold text-text-muted">
            Este evento já terminou: presença e interesse estão encerrados.
          </p>
        )}
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Block title="Sobre o evento">
            {ev.about ? (
              <p className="text-[15px] leading-6 whitespace-pre-line text-text-2">{ev.about}</p>
            ) : (
              <Empty>O organizador ainda não publicou uma descrição.</Empty>
            )}
          </Block>
          <Block title="Programação">
            {ev.schedule.length === 0 ? (
              <Empty>Nenhuma programação informada pelo organizador.</Empty>
            ) : (
              <ol className="flex flex-col">
                {ev.schedule.map((s, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[48px_24px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[64px_24px_minmax(0,1fr)]"
                  >
                    <span className="pt-px text-right text-[15px] leading-[22px] font-extrabold text-text-strong tabular-nums">
                      {s.time}
                    </span>
                    <span className="flex flex-col items-center" aria-hidden>
                      <span className="mt-1 size-3.5 rounded-full border-[3px] border-amber bg-surface" />
                      <span
                        className={cn(
                          "min-h-7 w-0.5 flex-1",
                          i === ev.schedule.length - 1 ? "bg-transparent" : "bg-border",
                        )}
                      />
                    </span>
                    <span className="flex flex-col gap-0.5 pb-5">
                      <span className="text-[15px] leading-[22px] font-bold text-text">{s.title}</span>
                      {s.detail && <span className="text-[13px] leading-5 text-text-subtle">{s.detail}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Block>
          <Block title="Ofertas no evento">
            {!ev.offer ? (
              <Empty>Nenhuma oferta ou cupom vinculado a este evento.</Empty>
            ) : (
              <div className="flex flex-wrap items-center gap-4 rounded-[14px] border-[1.5px] border-dashed border-amber bg-accent-soft p-[18px]">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber text-navy">
                  <Tag className="size-6" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 basis-44 flex-col gap-0.5">
                  <span className="text-base leading-[22px] font-extrabold text-text-strong">
                    {ev.offer.title}
                  </span>
                  <span className="text-[13px] leading-5 text-text-muted">
                    {ev.offer.percentOff}% de desconto
                    {formatDayMonth(ev.offer.validUntil)
                      ? ` · válido até ${formatDayMonth(ev.offer.validUntil)}`
                      : ""}
                    . Oferta de {org}.
                  </span>
                </span>
                {ev.offer.claimed ? (
                  <span className="flex flex-col items-end gap-0.5">
                    <span className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3.5 text-[15px] font-extrabold tracking-[1px] text-text-strong">
                      {ev.offer.code}
                    </span>
                    <Link
                      href={`${routes.atividade}?aba=cupons`}
                      className="text-xs font-bold text-link hover:underline"
                    >
                      Ver meus cupons ›
                    </Link>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={claim.isPending}
                    onClick={() =>
                      ev.offer && requireAuth("coupon", ev.offer.id) && claim.mutate(ev.offer.id)
                    }
                    className="h-11 rounded-lg bg-accent px-5 text-sm font-extrabold text-on-accent hover:bg-accent-hover disabled:opacity-60"
                  >
                    Pegar cupom
                  </button>
                )}
              </div>
            )}
          </Block>
          <Block title="Quem vai">
            {ev.going === 0 && ev.attendeesPreview.length === 0 ? (
              <Empty>Ninguém confirmou presença ainda. Seja a primeira pessoa a marcar “Vou”.</Empty>
            ) : (
              <div className="flex flex-wrap items-center gap-4">
                <ul className="flex" aria-label="Algumas pessoas que vão">
                  {ev.attendeesPreview.slice(0, 6).map((a, i) => (
                    <li
                      key={i}
                      title={a.name}
                      className={cn(
                        "flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-surface text-[13px] font-extrabold text-white",
                        i > 0 && "-ml-2.5",
                        AVATAR_TONES[i % AVATAR_TONES.length],
                      )}
                    >
                      {a.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.avatarUrl} alt={a.name} className="size-full object-cover" />
                      ) : (
                        initials(a.name)
                      )}
                    </li>
                  ))}
                </ul>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] leading-[22px] font-bold text-text">
                    {count(ev.going)} {ev.going === 1 ? "pessoa vai" : "pessoas vão"}
                    {ev.followedGoing > 0 ? `, ${ev.followedGoing} que você segue` : ""}
                  </span>
                  <span className="text-[13px] leading-5 text-text-subtle">
                    {going ? "Você também confirmou presença." : "Confirme presença para aparecer aqui."}
                  </span>
                </span>
              </div>
            )}
          </Block>
          <section className={cn(card, "flex flex-wrap items-center gap-4 p-5 sm:p-6")}>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-selected text-text-strong">
              <MessageCircle className="size-6" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
              <h2 className="text-lg leading-[26px] font-bold text-text-strong">Perguntas ao organizador</h2>
              <span className="text-sm leading-5 text-text-muted">
                {ev.organizer.profileId
                  ? `Dúvida sobre horário, local ou o que levar? Pergunte direto para ${org} pelo chat.`
                  : "O organizador não tem perfil na EncontraÊ, então não dá para perguntar pelo chat."}
              </span>
            </span>
            {ev.organizer.profileId && (
              <button
                type="button"
                disabled={ask.isPending}
                onClick={askOrganizer}
                className="h-11 rounded-lg bg-primary px-[22px] text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
              >
                Perguntar
              </button>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <Side icon={<Clock className="size-[18px]" aria-hidden />} title="Quando">
            <span className="text-[15px] leading-[22px] font-bold text-text">
              {eventWhenText(ev.startsAt, ev.endsAt)}
            </span>
            <span
              className={cn(
                "inline-flex h-7 items-center gap-1.5 self-start rounded-full px-3 text-[13px] font-bold",
                live ? "bg-danger-soft text-danger-text" : "bg-accent-soft text-accent-text",
              )}
            >
              <span className={cn("size-2 rounded-full", live ? "bg-danger" : "bg-amber")} aria-hidden />
              {chip.label}
            </span>
          </Side>
          <Side icon={<MapPin className="size-[18px]" aria-hidden />} title="Onde">
            <span className="text-sm leading-[21px] text-text-2">
              {ev.address ?? ev.neighborhood ?? "Endereço não informado"}
            </span>
            <MapTile
              label={[ev.neighborhood, ev.distanceKm !== null ? formatKm(ev.distanceKm) : null]
                .filter(Boolean)
                .join(" · ")}
            />
            {route ? (
              <a href={route} target="_blank" rel="noopener noreferrer" className={cn(act, "w-full")}>
                <Navigation className="size-4" aria-hidden /> Como chegar
              </a>
            ) : (
              <p className="text-[13px] text-text-subtle">O organizador não informou o endereço.</p>
            )}
          </Side>
          <Side icon={<Ticket className="size-[18px]" aria-hidden />} title="Entrada">
            {ev.free ? (
              <span className="flex flex-col gap-0.5">
                <span className="text-lg leading-[26px] font-extrabold text-success-text">Gratuita</span>
                <span className="text-[13px] leading-5 text-text-subtle">
                  Não precisa de inscrição. É só chegar.
                </span>
              </span>
            ) : (
              <>
                <span className="flex flex-col gap-1">
                  <span className="text-lg leading-[26px] font-extrabold text-text-strong">{price}</span>
                  <span className="text-[13px] leading-5 text-text-muted">
                    Feita direto com {org}, pelo WhatsApp ou na loja. A EncontraÊ não vende ingressos.
                  </span>
                </span>
                {ev.organizer.profileId && (
                  <button
                    type="button"
                    disabled={ask.isPending}
                    onClick={askOrganizer}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
                  >
                    <MessageCircle className="size-4" aria-hidden /> Falar com o organizador
                  </button>
                )}
                {signup && (
                  <a
                    href={signup}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-success-text text-sm font-bold text-success-text hover:bg-success-soft"
                  >
                    Inscrição pelo WhatsApp
                  </a>
                )}
              </>
            )}
          </Side>
          <Side icon={<Users className="size-[18px]" aria-hidden />} title="Para quem">
            {ev.tags.length === 0 ? (
              <Empty>Público não informado.</Empty>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {ev.tags.map((t) => (
                  <li
                    key={t}
                    className="inline-flex h-[30px] items-center rounded-full bg-surface-2 px-3 text-[13px] font-semibold text-text-2"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </Side>
        </aside>
      </div>

      <Nearby id={ev.id} />
    </article>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-muted">{children}</p>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn(card, "flex flex-col gap-4 p-5 sm:p-6")}>
      <h2 className={h2}>{title}</h2>
      {children}
    </section>
  );
}

function Side({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(card, "flex flex-col gap-3 p-5")}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-selected text-text-strong">
          {icon}
        </span>
        <h3 className="text-base leading-6 font-bold text-text-strong">{title}</h3>
      </div>
      {children}
    </section>
  );
}

/**
 * Quadro do mapa: ilustração fixa (ruas e quarteirões). Não mostra a posição exata; o mapa de verdade
 * depende da escolha do serviço de mapas. O rótulo traz bairro e distância reais, quando a API informa.
 */
function MapTile({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="relative h-[150px] overflow-hidden rounded-xl border border-border bg-surface-3"
    >
      <div className="absolute inset-x-0 top-[58px] h-3 bg-surface" />
      <div className="absolute inset-x-0 top-[118px] h-2 bg-surface" />
      <div className="absolute inset-y-0 left-24 w-2.5 bg-surface" />
      <div className="absolute inset-y-0 left-[228px] w-3.5 bg-surface" />
      <div className="absolute top-[78px] left-[116px] h-8 w-[100px] rounded-md bg-success-soft" />
      <div className="absolute top-2.5 left-3.5 h-10 w-[70px] rounded-md bg-surface-2" />
      <div className="absolute top-[76px] left-[252px] h-[34px] w-[70px] rounded-md bg-surface-2" />
      <div className="absolute top-[22px] left-1/2 flex -translate-x-1/2 flex-col items-center">
        <span className="flex size-10 -rotate-45 items-center justify-center rounded-[99px_99px_99px_4px] bg-navy shadow-[0_4px_8px_rgba(0,0,0,0.25)]">
          <span className="size-3.5 rounded-full bg-amber" />
        </span>
        <span className="mt-1.5 h-[5px] w-3.5 rounded-full bg-black/20" />
      </div>
      {label && (
        <span className="absolute bottom-2 left-2.5 rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-text-muted">
          {label}
        </span>
      )}
    </div>
  );
}

function entryText(e: NearbyHappening) {
  const entry = e.free
    ? "Gratuito"
    : e.priceCents != null
      ? `Inscrição ${formatMoney(e.priceCents)}`
      : "Inscrição paga";
  return e.going != null ? `${entry} · ${count(e.going)} vão` : entry;
}

function Nearby({ id }: { id: string }) {
  const { location, isLoading } = useUserLocation();
  const q = useQuery({
    queryKey: ["happenings", "nearby", id, location.lat, location.lng, location.radiusKm],
    queryFn: () =>
      discover.nearbyHappenings({
        lat: location.lat,
        lng: location.lng,
        radiusKm: location.radiusKm,
        exclude: id,
      }),
    enabled: !isLoading,
    retry: false,
  });
  const items = q.data?.items ?? [];
  return (
    <section aria-label="Outros eventos perto" className="mt-2 flex flex-col gap-4">
      <h2 className={h2}>Outros eventos perto</h2>
      {q.isError ? (
        <InlineError
          message="Não foi possível carregar os outros eventos."
          onRetry={() => void q.refetch()}
          retrying={q.isFetching}
        />
      ) : q.isPending ? (
        <ListSkeleton rows={2} label="Carregando outros eventos" />
      ) : items.length === 0 ? (
        <p className={cn(card, "p-4 text-sm text-text-muted")}>
          Nenhum outro evento por perto. Amplie o raio no cabeçalho para ver mais.
        </p>
      ) : null}
      <ul className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-2">
        {items.map((e) => {
          const d = dateParts(e.startsAt);
          const where = [
            e.organizerName,
            [e.neighborhood, e.distanceKm !== null ? formatKm(e.distanceKm) : null]
              .filter(Boolean)
              .join(", "),
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={e.id}>
              <Link
                href={eventoHref(e.id)}
                className="flex gap-4 rounded-2xl border border-border bg-surface p-3 hover:bg-surface-2"
              >
                <span className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-3 sm:h-28 sm:w-40">
                  {e.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.coverUrl} alt="" className="size-full object-cover" />
                  )}
                  <span
                    aria-hidden
                    className="absolute top-2 left-2 flex w-11 flex-col items-center rounded-lg bg-white py-1"
                  >
                    <span className="text-[10px] leading-3 font-extrabold text-danger">{d.mon}</span>
                    <span className="text-lg leading-[22px] font-extrabold text-navy">{d.day}</span>
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
                  <span className="text-[17px] leading-6 font-bold text-text-strong">{e.title}</span>
                  <span className="text-[13px] leading-5 text-text-muted">
                    {eventWhenText(e.startsAt, null)}
                  </span>
                  {where && <span className="text-[13px] leading-5 text-text-subtle">{where}</span>}
                  <span className="mt-auto text-[13px] leading-5 font-bold text-success-text">
                    {entryText(e)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
