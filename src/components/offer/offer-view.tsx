"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/catalog/avatar";
import { ContactButtons } from "@/components/catalog/contact-buttons";
import { CouponCard } from "@/components/catalog/coupon-card";
import { PageError } from "@/components/catalog/section-state";
import { StatusLine } from "@/components/catalog/status-line";
import { TrustSignals } from "@/components/catalog/trust-signals";
import { CreateAccountNote, ItemGrid, PublicMain, ShareAside } from "@/components/public/public-shell";
import { ApiError } from "@/lib/api/client";
import { offerApi, type OfferPage } from "@/lib/api/offer";
import { countdownText, msLeft, offerEnded, routeUrl } from "@/lib/domain/offer";
import { textSignal, verificationSignal } from "@/lib/domain/trust";
import { formatKm, formatMoney } from "@/lib/format";
import { lojaHref, prestadorHref, produtoHref, routes } from "@/lib/routes";

export function OfferView({ slug }: { slug: string }) {
  const q = useQuery({
    queryKey: ["offer", slug],
    queryFn: () => offerApi.get(slug),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  if (q.isPending)
    return (
      <PublicMain>
        <div
          aria-busy="true"
          aria-label="Carregando"
          className="h-96 animate-pulse rounded-2xl bg-surface-2"
        />
      </PublicMain>
    );
  if (q.isError) {
    return (
      <PublicMain>
        {q.error instanceof ApiError && q.error.status === 404 ? (
          <Gone />
        ) : (
          <PageError
            what="a oferta"
            error={q.error}
            onRetry={() => q.refetch()}
            backHref={routes.ofertas}
            backLabel="Ver ofertas perto de você"
          />
        )}
      </PublicMain>
    );
  }
  return <OfferContent offer={q.data} />;
}

/** "Este link não está mais disponível" (item inexistente). */
function Gone() {
  return (
    <section className="flex flex-col items-center gap-3.5 rounded-2xl bg-surface px-8 py-14 text-center shadow-sm">
      <h1 className="text-[28px] leading-9 font-extrabold text-text-strong">
        Este link não está mais disponível
      </h1>
      <p className="text-[15px] leading-[22px] text-text-2">
        O item pode ter sido removido pela loja ou o endereço está incorreto.
      </p>
      <Link
        href={routes.ofertas}
        className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-[15px] font-bold text-on-primary hover:bg-primary-hover"
      >
        Ver ofertas perto de você
      </Link>
    </section>
  );
}

const untilFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Maceio",
});

function OfferContent({ offer: o }: { offer: OfferPage }) {
  // relógio em estado: atualiza a cada segundo só enquanto há prazo e a oferta está de pé
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  const left = o.endsAt && now !== null ? msLeft(o.endsAt, now) : null;
  const ended = offerEnded(o.status, left);
  const route = routeUrl({ lat: o.location.lat, lng: o.location.lng, address: o.location.address });
  const profileHref = o.profile.kind === "store" ? lojaHref(o.profile.slug) : prestadorHref(o.profile.slug);
  const pct =
    o.product?.oldPriceCents && o.product.oldPriceCents > o.product.priceCents
      ? Math.round((1 - o.product.priceCents / o.product.oldPriceCents) * 100)
      : 0;
  const endsDate = o.endsAt ? new Date(o.endsAt) : null;
  const validUntil = endsDate && !Number.isNaN(endsDate.getTime()) ? untilFmt.format(endsDate) : null;
  const where = [
    o.location.neighborhood,
    o.location.distanceKm !== null ? formatKm(o.location.distanceKm) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PublicMain
      aside={
        <ShareAside
          title={o.title}
          description={o.description}
          imageUrl={o.imageUrl}
          path={`/o/${encodeURIComponent(o.slug)}`}
        />
      }
    >
      <article className="flex flex-col gap-8">
        {ended && (
          <div role="status" className="rounded-2xl border border-border-strong bg-surface-2 p-4">
            <h2 className="text-lg font-bold text-text-strong">Oferta encerrada</h2>
            <p className="text-sm text-text-muted">
              Esta oferta terminou. Veja o que a loja tem agora ou outras ofertas perto de você.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={profileHref}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary-hover"
              >
                Ver {o.profile.name}
              </Link>
              <Link
                href={routes.ofertas}
                className="rounded-lg border border-border-strong px-4 py-2 text-sm font-bold text-text-strong hover:bg-selected"
              >
                Outras ofertas perto de você
              </Link>
            </div>
          </div>
        )}

        <section className="grid gap-6 rounded-2xl bg-surface p-4 shadow-sm sm:p-6 md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:gap-8">
          <div className="relative h-72 overflow-hidden rounded-xl bg-surface-3 sm:h-[400px]">
            {o.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={o.imageUrl}
                alt={o.title}
                className={ended ? "size-full object-cover grayscale" : "size-full object-cover"}
              />
            )}
            {!ended && (
              <span className="absolute top-3 left-3 rounded-full bg-accent px-3 py-1.5 text-xs font-extrabold text-on-accent">
                {pct > 0 ? `Oferta do dia · -${pct}%` : "Oferta do dia"}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <Link href={profileHref} className="flex items-center gap-2.5 hover:opacity-90">
              <Avatar name={o.profile.name} url={o.profile.avatarUrl} size={40} shape="circle" tone="navy" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-bold text-text">{o.profile.name}</span>
                {where && (
                  <span className="flex items-center gap-1.5 text-xs text-text-2">
                    <MapPin className="size-3.5" aria-hidden />
                    {where}
                  </span>
                )}
              </span>
            </Link>
            <h1 className="text-[28px] leading-9 font-extrabold text-text-strong">{o.title}</h1>
            {o.description && <p className="text-sm leading-[22px] text-text-2">{o.description}</p>}
            {o.product && (
              <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-[32px] leading-10 font-extrabold text-text-strong">
                  {formatMoney(o.product.priceCents)}
                </span>
                {o.product.oldPriceCents && o.product.oldPriceCents > o.product.priceCents && (
                  <span className="text-base text-text-muted line-through">
                    {formatMoney(o.product.oldPriceCents)}
                  </span>
                )}
                <Link
                  href={produtoHref(o.product.slug)}
                  className="text-sm font-semibold text-link hover:underline"
                >
                  {o.product.title}
                </Link>
              </p>
            )}

            {!ended && left !== null && (
              <div className="flex items-center gap-3.5 rounded-xl bg-danger-soft px-4 py-3.5">
                <Clock className="size-6 shrink-0 text-danger-text" aria-hidden />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-xs font-semibold text-danger-text">Termina em</span>
                  <span className="text-[26px] leading-8 font-extrabold text-danger-text tabular-nums">
                    {countdownText(left)}
                  </span>
                </span>
                {validUntil && <span className="text-[13px] text-text-2">Válido até {validUntil}</span>}
              </div>
            )}
            {!ended && !o.endsAt && (
              <p className="flex items-center gap-2 text-sm text-text-muted">
                <Clock className="size-4" aria-hidden />
                Prazo da oferta não informado. Confirme com a loja.
              </p>
            )}
            <StatusLine status={o.profile.status} />

            {!ended && (
              <div className="flex flex-col gap-2.5">
                {o.coupon && <CouponCard coupon={o.coupon} productTitle={o.product?.title} variant="cta" />}
                <ContactButtons
                  look="public"
                  routeHref={route}
                  profile={o.profile}
                  whatsappText={`Olá! Vi a oferta "${o.title}" no EncontraÊ.`}
                  chatLabel={`Conversar com ${o.profile.name}`}
                  target={{
                    targetType: o.profile.kind === "store" ? "STORE" : "PROVIDER",
                    targetId: o.profile.id,
                  }}
                />
                {!route && (
                  <p className="text-xs text-text-muted">
                    Sem endereço ou localização informados, não dá para traçar a rota.
                  </p>
                )}
              </div>
            )}
            {!ended && (
              <CreateAccountNote>
                Crie sua conta grátis para salvar, comparar preços com outras lojas e ser avisado quando
                baixar
              </CreateAccountNote>
            )}
          </div>
        </section>

        <TrustSignals
          id="confianca-oferta"
          description="O que a loja informou sobre esta oferta."
          signals={[
            verificationSignal(o.profile.verification),
            {
              label: "Situação da oferta",
              value: ended ? "Encerrada" : "Ativa segundo a loja",
              tone: "neutral",
              hint: ended ? undefined : "Confirme preço e disponibilidade com a loja antes de ir.",
            },
            textSignal("Preço do produto", o.product ? formatMoney(o.product.priceCents) : null),
            {
              ...textSignal("Horário da loja", o.profile.status?.text),
              tone: o.profile.status ? "neutral" : "unknown",
            },
          ]}
        />

        <ItemGrid title="Mais desta loja" aside={o.profile.name} items={o.more.slice(0, 3)} />
        <ItemGrid title="Parecidos perto" aside="Perto de você" items={o.similar.slice(0, 3)} />

        <p className="text-right text-[13px] font-semibold">
          <Link
            href={`/denunciar?tipo=${o.profile.kind === "store" ? "loja" : "prestador"}&id=${encodeURIComponent(o.profile.slug)}`}
            className="text-danger-text hover:underline"
          >
            Denunciar
          </Link>
        </p>
      </article>
    </PublicMain>
  );
}
