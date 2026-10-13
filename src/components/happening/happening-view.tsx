"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarPlus, Flag, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { ShareButton } from "@/components/catalog/share-button";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/components/ui/toast";
import { useUserLocation } from "@/hooks/use-user-location";
import { actions } from "@/lib/api/actions";
import { API_BASE, ApiError } from "@/lib/api/client";
import { discover, type Happening } from "@/lib/api/discover";
import { eventDayBadge, eventWhen } from "@/lib/domain/discover";
import { formatKm, formatMoney } from "@/lib/format";
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

export function HappeningView({ id }: { id: string }) {
  const q = useQuery({
    queryKey: ["happening", id],
    queryFn: () => discover.happening(id),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const notFound = q.error instanceof ApiError && q.error.status === 404;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <Link
        href={routes.home}
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden /> Voltar para o início
      </Link>
      {q.isPending ? (
        <p role="status" className="py-16 text-center text-text-muted">
          Carregando evento…
        </p>
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
  const start = new Date(ev.startsAt);
  const when = eventWhen(ev.startsAt, ev.endsAt);
  const past = when.state === "past";

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
  const btn = "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold";

  return (
    <article className="flex flex-col gap-6">
      <header className="bg-navy-900 relative overflow-hidden rounded-2xl text-white">
        {ev.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.coverUrl} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
        )}
        <div className="relative flex flex-col gap-3 p-5 pt-24 sm:p-8 sm:pt-32">
          <div className="flex items-end gap-4">
            <div
              className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-white py-2 text-center text-black"
              aria-hidden
            >
              <span className="text-xs font-bold text-red-600 uppercase">
                {start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
              </span>
              <span className="text-2xl leading-7 font-bold">{start.getDate()}</span>
              <span className="text-[10px] font-semibold uppercase">
                {start.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
              </span>
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-amber px-2.5 py-1 text-black">
                  {eventDayBadge(ev.startsAt)}
                </span>
                <span className="rounded-full bg-white/20 px-2.5 py-1">
                  {ev.free
                    ? "Gratuito"
                    : ev.priceCents !== null
                      ? `Inscrição ${formatMoney(ev.priceCents)}`
                      : "Inscrição paga"}
                </span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">{ev.title}</h1>
              <p className="text-sm text-white/85">
                Organizado por{" "}
                <Link href={orgHref} className="font-semibold underline">
                  {ev.organizer.name} ›
                </Link>
              </p>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Ações do evento" className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={ev.myAttendance === "going"}
          disabled={mark.isPending || past}
          onClick={() => toggle("going")}
          className={cn(
            btn,
            ev.myAttendance === "going"
              ? "bg-success text-white"
              : "bg-primary text-on-primary hover:bg-primary-hover",
            "disabled:opacity-60",
          )}
        >
          {ev.myAttendance === "going" ? "Você vai" : "Vou"}
        </button>
        <button
          type="button"
          aria-pressed={ev.myAttendance === "interested"}
          disabled={mark.isPending || past}
          onClick={() => toggle("interested")}
          className={cn(
            btn,
            "border border-border-strong",
            ev.myAttendance === "interested"
              ? "bg-selected text-text-strong"
              : "text-text-2 hover:bg-surface-2",
            "disabled:opacity-60",
          )}
        >
          {ev.myAttendance === "interested" ? "Interessado" : "Tenho interesse"}
        </button>
        <a
          href={`${API_BASE}/happenings/${encodeURIComponent(ev.id)}/calendar.ics`}
          className={cn(btn, "border border-border-strong text-text-2 hover:bg-surface-2")}
        >
          <CalendarPlus className="size-4" aria-hidden /> Adicionar à agenda
        </a>
        <ShareButton
          path={eventoHref(ev.id)}
          title={ev.title}
          noun="evento"
          report={denunciarHref("evento", ev.id)}
        />
        <Link
          href={denunciarHref("evento", ev.id)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-danger-text hover:bg-surface-2"
        >
          <Flag className="size-4" aria-hidden /> Denunciar
        </Link>
        <p className="w-full text-sm text-text-muted sm:ml-auto sm:w-auto" aria-live="polite">
          {ev.going} vão · {ev.interested} interessados
        </p>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          {ev.about && (
            <Block title="Sobre o evento">
              <p className="whitespace-pre-line text-text">{ev.about}</p>
            </Block>
          )}
          {ev.schedule.length > 0 && (
            <Block title="Programação">
              <ul className="flex flex-col divide-y divide-border">
                {ev.schedule.map((s, i) => (
                  <li key={i} className="flex gap-4 py-2">
                    <span className="w-14 shrink-0 font-bold text-text-strong tabular-nums">{s.time}</span>
                    <span>
                      <span className="font-semibold text-text-strong">{s.title}</span>
                      {s.detail && <span className="block text-sm text-text-muted">{s.detail}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
          {ev.offer && (
            <Block title="Ofertas no evento">
              <p className="font-semibold text-text-strong">{ev.offer.title}</p>
              {ev.offer.claimed ? (
                <p className="text-text">
                  Seu cupom: <strong>{ev.offer.code}</strong> ·{" "}
                  <Link
                    href={`${routes.atividade}?aba=cupons`}
                    className="font-semibold text-link hover:underline"
                  >
                    Ver meus cupons ›
                  </Link>
                </p>
              ) : (
                <div>
                  <button
                    type="button"
                    disabled={claim.isPending}
                    onClick={() =>
                      ev.offer && requireAuth("coupon", ev.offer.id) && claim.mutate(ev.offer.id)
                    }
                    className={cn(btn, "bg-accent text-on-accent")}
                  >
                    Pegar cupom
                  </button>
                </div>
              )}
            </Block>
          )}
          {(ev.going > 0 || ev.attendeesPreview.length > 0) && (
            <Block title="Quem vai">
              <ul className="flex -space-x-2" aria-label="Algumas pessoas que vão">
                {ev.attendeesPreview.slice(0, 6).map((a, i) => (
                  <li
                    key={i}
                    title={a.name}
                    className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-primary text-sm font-bold text-on-primary"
                  >
                    {a.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatarUrl} alt={a.name} className="size-full object-cover" />
                    ) : (
                      a.name[0]
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-text-muted">
                {ev.going} {ev.going === 1 ? "pessoa vai" : "pessoas vão"}
                {ev.followedGoing > 0 ? `, ${ev.followedGoing} que você segue` : ""}
              </p>
            </Block>
          )}
          <Block title="Perguntas ao organizador">
            <div className="flex flex-wrap gap-2">
              {ev.organizer.profileId && (
                <button
                  type="button"
                  disabled={ask.isPending}
                  onClick={() => requireAuth("chat", ev.organizer.profileId as string) && ask.mutate()}
                  className={cn(btn, "border border-border-strong text-text-2 hover:bg-surface-2")}
                >
                  Perguntar
                </button>
              )}
              {signup && !ev.free && (
                <a
                  href={signup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(btn, "border border-success text-success-text hover:bg-success-soft")}
                >
                  Inscrição pelo WhatsApp
                </a>
              )}
              {!ev.organizer.profileId && !signup && (
                <p className="text-sm text-text-muted">O organizador não tem perfil na EncontraÊ.</p>
              )}
            </div>
          </Block>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Block title="Quando">
            <p className="text-text">
              {start.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
              {start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              {ev.endsAt
                ? ` às ${new Date(ev.endsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </p>
            <p
              className={cn(
                "text-sm font-semibold",
                when.state === "now" ? "text-success-text" : "text-text-muted",
              )}
            >
              {when.label}
            </p>
          </Block>
          <Block title="Onde">
            <p className="flex items-start gap-2 text-text">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                {ev.address ?? ev.neighborhood ?? "Endereço não informado"}
                {ev.distanceKm !== null && (
                  <span className="block text-sm text-text-muted">{formatKm(ev.distanceKm)} de você</span>
                )}
              </span>
            </p>
            {route && (
              <a
                href={route}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline"
              >
                <Navigation className="size-4" aria-hidden /> Como chegar
              </a>
            )}
          </Block>
          <Block title="Entrada">
            <p className="text-text">
              {ev.free
                ? "Gratuita"
                : ev.priceCents !== null
                  ? `Inscrição de ${formatMoney(ev.priceCents)}`
                  : "Paga"}
            </p>
          </Block>
          {ev.tags.length > 0 && (
            <Block title="Para quem">
              <ul className="flex flex-wrap gap-2">
                {ev.tags.map((t) => (
                  <li key={t} className="rounded-full bg-surface-2 px-3 py-1 text-sm text-text-2">
                    {t}
                  </li>
                ))}
              </ul>
            </Block>
          )}
          <Nearby id={ev.id} />
        </aside>
      </div>
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="text-lg font-bold text-text-strong">{title}</h2>
      {children}
    </section>
  );
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
  if (items.length === 0) return null;
  return (
    <Block title="Outros eventos perto">
      <ul className="flex flex-col gap-2">
        {items.map((e) => (
          <li key={e.id}>
            <Link
              href={eventoHref(e.id)}
              className="flex flex-col rounded-lg border border-border px-3 py-2 hover:bg-surface-2"
            >
              <span className="font-semibold text-text-strong">{e.title}</span>
              <span className="text-xs text-text-muted">
                {new Date(e.startsAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                {e.neighborhood ? ` · ${e.neighborhood}` : ""}
                {e.distanceKm !== null ? ` · ${formatKm(e.distanceKm)}` : ""} · {e.free ? "Gratuito" : "Pago"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Block>
  );
}
