"use client";

import { useQuery } from "@tanstack/react-query";
import { Clock, MapPin, Navigation, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/catalog/avatar";
import { ContactButtons } from "@/components/catalog/contact-buttons";
import { CouponCard } from "@/components/catalog/coupon-card";
import { EmptyNote, PageError, Section } from "@/components/catalog/section-state";
import { StatusLine } from "@/components/catalog/status-line";
import { TrustSignals } from "@/components/catalog/trust-signals";
import { ResultCard } from "@/components/search/result-card";
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
      <div
        aria-busy="true"
        aria-label="Carregando"
        className="mx-auto h-96 max-w-3xl animate-pulse rounded-2xl bg-surface-2"
      />
    );
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 404) return <Gone />;
    return (
      <PageError
        what="a oferta"
        error={q.error}
        onRetry={() => q.refetch()}
        backHref={routes.ofertas}
        backLabel="Ver ofertas perto de você"
      />
    );
  }
  return <OfferContent offer={q.data} />;
}

/** "Este link não está mais disponível" (item inexistente). */
function Gone() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-text-strong">Este link não está mais disponível</h1>
      <p className="text-text-muted">A oferta pode ter sido removida ou o endereço está incorreto.</p>
      <Link
        href={routes.ofertas}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-hover"
      >
        Ver ofertas perto de você
      </Link>
    </section>
  );
}

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

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-5">
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

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-surface-2">
        {o.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={o.imageUrl}
            alt=""
            className={ended ? "size-full object-cover grayscale" : "size-full object-cover"}
          />
        )}
        {pct > 0 && !ended && (
          <span className="absolute top-3 left-3 rounded-full bg-danger px-3 py-1 text-sm font-bold text-white">
            -{pct}%
          </span>
        )}
      </div>

      <header className="flex flex-col gap-2">
        <Link
          href={profileHref}
          className="flex items-center gap-2 text-sm font-semibold text-text-muted hover:underline"
        >
          <Avatar name={o.profile.name} url={o.profile.avatarUrl} size={28} />
          {o.profile.name}
        </Link>
        <h1 className="text-2xl font-bold text-text-strong">{o.title}</h1>
        {o.description && <p className="text-text">{o.description}</p>}
        {o.product && (
          <p className="flex flex-wrap items-baseline gap-2">
            <Tag className="size-4 self-center text-text-muted" aria-hidden />
            <Link href={produtoHref(o.product.slug)} className="font-semibold text-link hover:underline">
              {o.product.title}
            </Link>
            <span className="text-xl font-bold text-text-strong">{formatMoney(o.product.priceCents)}</span>
            {o.product.oldPriceCents && o.product.oldPriceCents > o.product.priceCents && (
              <span className="text-sm text-text-muted line-through">
                {formatMoney(o.product.oldPriceCents)}
              </span>
            )}
          </p>
        )}
        {!ended && left !== null && (
          <p className="flex items-center gap-2 font-semibold text-danger-text">
            <Clock className="size-4" aria-hidden />
            <span>
              Termina em <span className="tabular-nums">{countdownText(left)}</span>
            </span>
          </p>
        )}
        {!ended && !o.endsAt && (
          <p className="flex items-center gap-2 text-sm text-text-muted">
            <Clock className="size-4" aria-hidden />
            Prazo da oferta não informado. Confirme com a loja.
          </p>
        )}
        <StatusLine status={o.profile.status} />
      </header>

      {!ended && o.coupon && <CouponCard coupon={o.coupon} productTitle={o.product?.title} />}

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

      {!ended && (
        <ContactButtons
          profile={o.profile}
          whatsappText={`Olá! Vi a oferta "${o.title}" no EncontraÊ.`}
          chatLabel={`Conversar com ${o.profile.name}`}
          target={{ targetType: o.profile.kind === "store" ? "STORE" : "PROVIDER", targetId: o.profile.id }}
        />
      )}

      <section aria-labelledby="onde-t" className="rounded-2xl border border-border bg-surface p-4">
        <h2 id="onde-t" className="mb-2 text-lg font-bold text-text-strong">
          Onde fica
        </h2>
        <p className="flex items-start gap-2 text-text">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {o.location.address ?? o.location.neighborhood ?? "Endereço não informado"}
            <span className="block text-sm text-text-muted">
              {o.location.distanceKm !== null
                ? `${formatKm(o.location.distanceKm)} de você`
                : "Distância indisponível"}
            </span>
          </span>
        </p>
        {route ? (
          <a
            href={route}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex min-h-11 items-center gap-2 font-semibold text-link hover:underline"
          >
            <Navigation className="size-4" aria-hidden /> Como chegar
          </a>
        ) : (
          <>
            <button
              type="button"
              disabled
              aria-describedby="rota-oferta-off"
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-text-subtle disabled:cursor-not-allowed"
            >
              <Navigation className="size-4" aria-hidden /> Como chegar
            </button>
            <p id="rota-oferta-off" className="text-xs text-text-muted">
              Sem endereço ou localização informados, não dá para traçar a rota.
            </p>
          </>
        )}
      </section>

      <Related
        id="mais"
        title="Mais desta loja"
        description="Outros produtos e ofertas de quem publicou esta."
        items={o.more.slice(0, 3)}
      />
      <Related
        id="parecidos"
        title="Parecidos perto"
        description="Opções semelhantes na região, para comparar."
        items={o.similar.slice(0, 3)}
      />

      <footer className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
        <Link href="/institucional/termos" className="text-link hover:underline">
          Termos de uso
        </Link>
        <Link href="/institucional/privacidade" className="text-link hover:underline">
          Privacidade
        </Link>
        <Link
          href={`/denunciar?tipo=${o.profile.kind === "store" ? "loja" : "prestador"}&id=${encodeURIComponent(o.profile.slug)}`}
          className="text-link hover:underline"
        >
          Denunciar
        </Link>
      </footer>
    </article>
  );
}

function Related({
  id,
  title,
  description,
  items,
}: {
  id: string;
  title: string;
  description: string;
  items: OfferPage["more"];
}) {
  return (
    <Section id={id} title={title} description={description} level={3}>
      {items.length === 0 ? (
        <EmptyNote title="Nada para mostrar aqui por enquanto.">
          Quando houver outras ofertas ou produtos relacionados, eles aparecem nesta seção.
        </EmptyNote>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <li key={`${it.type}-${it.id}`}>
              <ResultCard item={it} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
