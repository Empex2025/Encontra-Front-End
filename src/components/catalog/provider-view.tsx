"use client";

import { useMutation } from "@tanstack/react-query";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  Clock,
  Home,
  Info,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Scale,
  ShieldCheck,
  Star,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useComparisonSelection } from "@/hooks/use-comparison-selection";
import { useResumeAction } from "@/hooks/use-resume-action";
import { useSession } from "@/hooks/use-session";
import { track } from "@/lib/analytics/track";
import { actions } from "@/lib/api/actions";
import type { Profile, ProviderData } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { buttonState, itemRef } from "@/lib/domain/comparison";
import { routeUrl } from "@/lib/domain/offer";
import { markViewed } from "@/lib/domain/recently-viewed";
import {
  saveQuoteDraft,
  takeQuoteDraft,
  validateQuote,
  WHEN_OPTIONS,
  type QuoteWhen,
} from "@/lib/domain/quote-form";
import { servicePrice } from "@/lib/domain/service-price";
import { providerMessage, whatsappUrl } from "@/lib/domain/whatsapp";
import { formatCount, formatInt, formatKm } from "@/lib/format";
import { avaliarHref, conversaHref, denunciarHref, prestadorHref, routes } from "@/lib/routes";

import { Avatar } from "./avatar";
import { FollowButton } from "./follow-button";
import { BackLink, ChatPill, SimilarProfiles } from "./profile-view";
import { ReviewsPanel } from "./reviews-panel";
import { EmptyNote } from "./section-state";
import { ShareButton } from "./share-button";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const CARD = "flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-card";
const H2 = "text-xl leading-7 font-bold text-text-strong";
const SUB = "text-[13px] text-text-muted";
const SEP = (
  <span aria-hidden className="mx-0.5 text-border-strong">
    ·
  </span>
);

/** Perfil do prestador (Documento de entrega › Perfil do prestador): cabeçalho, abas âncora e painel de orçamento. */
export function ProviderPage({ profile: p }: { profile: Profile }) {
  const v = p.provider;
  const target = { targetType: "PROVIDER" as const, targetId: p.id };
  const [serviceId, setServiceId] = useState<string | null>(null);

  useEffect(() => {
    markViewed({ type: "provider", slug: p.slug });
    track({ type: "SERVICE_VIEW", ...target });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.id]);

  if (!v)
    return (
      <article className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <BackLink label="Voltar à pesquisa" />
        <section className={CARD}>
          <h1 className="text-[28px] leading-9 font-bold text-text-strong">{p.name}</h1>
          <EmptyNote title="Os dados de atendimento deste prestador ainda não chegaram.">
            Use o chat para falar com ele diretamente.
          </EmptyNote>
          <ChatPill profileId={p.id} look="outline" className="self-start" />
        </section>
      </article>
    );

  return (
    <article className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
      <BackLink label="Voltar à pesquisa" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-5">
          <ProviderHeader profile={p} provider={v} target={target} />
          <ProviderTabs profile={p} />
          <Services
            provider={v}
            first={firstName(p.name)}
            serviceId={serviceId}
            onPick={setServiceId}
            profileId={p.id}
          />
          <Photos provider={v} />
          <section id="avaliacoes" aria-label="Avaliações" className={cn(CARD, "scroll-mt-32")}>
            <h2 className={H2}>Avaliações</h2>
            <ReviewsPanel
              target="profiles"
              slug={p.slug}
              reviewHref={avaliarHref("prestador", p.slug)}
              reviewLabel="Já contratou? Avalie"
              layout="split"
              note="Avaliações de quem contratou pela EncontraÊ."
            />
          </section>
          <Area profile={p} provider={v} />
          <section id="sobre" aria-label="Sobre" className={cn(CARD, "scroll-mt-32")}>
            <h2 className={H2}>Sobre {p.name}</h2>
            <p className="text-[15px] leading-6 whitespace-pre-line text-text-2">
              {p.bio ?? "O prestador ainda não escreveu uma apresentação."}
            </p>
            <div className="flex items-start gap-2.5 rounded-xl bg-selected px-3.5 py-3 text-[13px] leading-5 text-text-strong">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                <b>Pagamento combinado direto com {firstName(p.name)}:</b>{" "}
                {p.payment.length > 0 ? `${p.payment.join(", ")}.` : "formas de pagamento não informadas."} A
                EncontraÊ não cobra nada de você: aqui você encontra, compara e conversa.
              </span>
            </div>
            <Link
              href={denunciarHref("prestador", p.slug)}
              className="self-start text-[13px] font-semibold text-danger-text hover:underline"
            >
              Denunciar este perfil
            </Link>
          </section>
          <SimilarProfiles profile={p} />
        </div>
        <QuotePanel profile={p} provider={v} serviceId={serviceId} onService={setServiceId} />
      </div>
    </article>
  );
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function ProviderHeader({
  profile: p,
  provider: v,
  target,
}: {
  profile: Profile;
  provider: ProviderData;
  target: { targetType: "PROVIDER"; targetId: string };
}) {
  const [followers, setFollowers] = useState(p.followers);
  const { list, toggle } = useComparisonSelection();
  const toast = useToast();
  const wa = whatsappUrl(p.whatsapp, providerMessage(p.name));
  const place = [p.address?.neighborhood, p.address?.city].filter(Boolean).join(", ");
  const area = v.areas.length > 0 ? v.areas.slice(0, 3).join(", ") : null;
  const home = v.serviceMode !== "local";
  const local = v.serviceMode !== "home";
  const where = v.serviceMode === "both" ? "No local e em domicílio" : home ? "Em domicílio" : "No local";
  const route =
    local && p.address
      ? routeUrl({
          lat: p.address.lat,
          lng: p.address.lng,
          address:
            [p.address.street, p.address.neighborhood, p.address.city].filter(Boolean).join(", ") || null,
        })
      : null;
  const verified = p.verification === "verified";
  const rated = p.stats.rating !== null && p.stats.reviewCount > 0;

  const ref = itemRef("service", p.id);
  const cmp = v.group ? buttonState(list, ref, v.group.id) : null;
  const cmpLabel =
    cmp === "in"
      ? "Na comparação"
      : cmp === "other_group"
        ? "Outra categoria"
        : cmp === "full"
          ? "Comparação cheia"
          : "Comparar";

  const trust = [
    {
      icon: ShieldCheck,
      ok: verified,
      t: verified
        ? "Identidade verificada"
        : p.verification === "pending"
          ? "Verificação em análise"
          : "Identidade não verificada",
      s: verified ? "pela EncontraÊ" : "ainda sem selo",
    },
    {
      icon: Clock,
      ok: !!p.responseTime,
      t: p.responseTime ? `Responde em ${p.responseTime}` : "Tempo de resposta",
      s: p.responseTime ? "pelo chat" : "não informado",
    },
    {
      icon: CalendarClock,
      ok: !!v.nextSlot,
      t: v.nextSlot ?? "Próximo horário",
      s: v.nextSlot ? "próximo horário livre" : "agenda não informada",
    },
    {
      icon: Check,
      ok: v.recommendPct !== null,
      t: v.recommendPct !== null ? `${v.recommendPct}% recomendam` : "Recomendação",
      s: v.recommendPct !== null ? "de quem contratou" : "ainda sem dados",
    },
  ];

  return (
    <section aria-label="Sobre o prestador" className={cn(CARD, "gap-5")}>
      <div className="flex items-start gap-4 sm:gap-5">
        <Avatar
          name={p.name}
          url={p.avatarUrl}
          size={104}
          shape="circle"
          tone="navy"
          className="!size-20 sm:!size-[104px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="inline-flex h-[26px] items-center gap-1.5 self-start rounded-full bg-selected px-2.5 text-xs font-bold text-text-strong">
            <Home className="size-3.5" aria-hidden />
            {v.group?.label ?? p.categoryLabel ?? "Serviço"}
          </span>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] leading-9 font-bold text-text-strong">{p.name}</h1>
            {verified && (
              <span title="Identidade verificada" className="inline-flex text-link">
                <BadgeCheck className="size-6 fill-link text-surface" aria-label="Identidade verificada" />
              </span>
            )}
          </div>
          <span className="text-[15px] leading-[22px] text-text-muted">{v.title}</span>
          <p className="flex flex-wrap items-center gap-1.5 text-sm leading-5 text-text-muted">
            <Star className="size-4 fill-accent text-accent" aria-hidden />
            {rated ? (
              <>
                <b className="text-text">{p.stats.rating!.toFixed(1).replace(".", ",")}</b>
                <span>({formatInt(p.stats.reviewCount)} avaliações)</span>
              </>
            ) : (
              <span>Ainda sem avaliações</span>
            )}
            {SEP}
            <span>
              {v.yearsExperience !== null
                ? `${v.yearsExperience} anos de experiência`
                : "Experiência não informada"}
            </span>
            {SEP}
            <span>{formatCount(followers)} seguidores</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5 text-sm leading-5 text-text-muted">
            <MapPin className="size-4 text-accent-hover" aria-hidden />
            <b className="text-text">
              {p.address?.distanceKm != null ? formatKm(p.address.distanceKm) : "Distância indisponível"}
            </b>
            {place && <span>· {place}</span>}
            {SEP}
            {home ? <Home className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
            <b className="text-text">{where}</b>
            <span>{v.homeRadiusKm && home ? `até ${v.homeRadiusKm} km` : area ? `· ${area}` : ""}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FollowButton profile={p} onFollowersChange={(d) => setFollowers((n) => n + d)} />
        <ChatPill profileId={p.id} look="outline" />
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ type: "WHATSAPP_CLICK", ...target })}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-success px-4 text-sm font-bold text-white hover:brightness-95"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="O prestador não informou WhatsApp"
            className="inline-flex h-10 cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-bold text-text-subtle"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp não informado
          </button>
        )}
        {route && (
          <a
            href={route}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ type: "ROUTE_REQUESTED", ...target })}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-sm font-bold text-text-strong hover:bg-selected"
          >
            <MapIcon className="size-4" aria-hidden />
            Como chegar
          </a>
        )}
        <span className="flex-1" />
        <button
          type="button"
          disabled={!v.group || cmp === "other_group" || cmp === "full"}
          aria-pressed={cmp === "in"}
          title={v.group ? undefined : "Este prestador ainda não tem categoria comparável."}
          onClick={() => {
            if (!v.group) return;
            const r = toggle({ ref, group: v.group, origin: `prestador:${p.slug}` });
            if (r === "removed") toast("Removido da comparação.");
            if (r === "added") toast("Adicionado à comparação.");
          }}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold text-text-strong disabled:cursor-not-allowed disabled:opacity-50",
            cmp === "in"
              ? "border-accent-hover bg-accent-soft"
              : "border-border bg-surface hover:bg-surface-2",
          )}
        >
          <Scale className="size-4" aria-hidden />
          {cmpLabel}
        </button>
        <ShareButton
          path={prestadorHref(p.slug)}
          title={p.name}
          noun="prestador"
          report={denunciarHref("prestador", p.slug)}
          trackTarget={target}
          variant="pill"
        />
      </div>

      <ul className="grid grid-cols-1 gap-3 border-t border-surface-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {trust.map((t) => (
          <li key={t.t} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                t.ok ? "bg-success-soft text-success-text" : "bg-surface-2 text-text-muted",
              )}
            >
              <t.icon className="size-[18px]" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] leading-[18px] font-bold text-text">{t.t}</span>
              <span className="text-xs leading-4 text-text-muted">{t.s}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProviderTabs({ profile: p }: { profile: Profile }) {
  const tabs = [
    ["servicos", "Serviços e preços"],
    ["fotos", "Fotos dos trabalhos"],
    ["avaliacoes", `Avaliações (${formatInt(p.stats.reviewCount)})`],
    ["area", "Área e horários"],
    ["sobre", "Sobre"],
  ];
  return (
    <nav
      aria-label="Seções do perfil"
      className="sticky top-16 z-[8] flex gap-1 overflow-x-auto rounded-xl bg-surface p-2 shadow-card lg:top-[84px]"
    >
      {tabs.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className="inline-flex h-9 shrink-0 items-center rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap text-text-strong hover:bg-selected"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

function Services({
  provider: v,
  first,
  serviceId,
  onPick,
  profileId,
}: {
  provider: ProviderData;
  first: string;
  serviceId: string | null;
  onPick: (id: string) => void;
  profileId: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const openChat = useMutation({
    mutationFn: (sid: string) => actions.startConversation({ profileId, serviceId: sid }),
    onSuccess: (c) => router.push(conversaHref(c.id)),
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível abrir a conversa.", "info"),
  });
  useResumeAction("chat", profileId, () => {
    if (serviceId) openChat.mutate(serviceId);
  });
  return (
    <section id="servicos" aria-label="Serviços e preços" className={cn(CARD, "scroll-mt-32")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className={H2}>Serviços e preços</h2>
        <span className={SUB}>Preços de referência. O valor final você combina direto com {first}.</span>
      </div>
      {v.services.length === 0 ? (
        <EmptyNote title="O prestador ainda não cadastrou serviços.">
          Use o chat para descrever o que você precisa e pedir um orçamento.
        </EmptyNote>
      ) : (
        <ul className="flex flex-col">
          {v.services.map((s) => {
            const on = s.id === serviceId;
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-3 py-3.5"
              >
                <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                  <span className="text-[15px] leading-[22px] font-bold text-text">{s.name}</span>
                  {s.description && (
                    <span className="text-[13px] leading-[18px] text-text-muted">{s.description}</span>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 text-[13px] whitespace-nowrap text-text-2">
                  <Timer className="size-4" aria-hidden />
                  {s.durationMinutes ? `~${s.durationMinutes} min` : "Duração não informada"}
                </span>
                <span className="flex w-[150px] flex-col items-end">
                  <span className="text-[11px] text-text-muted">{servicePrice(s).prefix || " "}</span>
                  <span className="text-lg leading-6 font-extrabold text-text-strong">{servicePrice(s).value}</span>
                  {servicePrice(s).suffix && (
                    <span className="text-[11px] text-text-muted">{servicePrice(s).suffix}</span>
                  )}
                </span>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    onPick(s.id);
                    if (servicePrice(s).action === "Combinar pelo chat") {
                      if (requireAuth("chat", profileId)) openChat.mutate(s.id);
                      return;
                    }
                    document
                      .getElementById("orcamento")
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={cn(
                    "h-9 min-w-32 shrink-0 rounded-lg border-[1.5px] border-primary px-3 text-[13px] font-bold whitespace-nowrap",
                    on ? "bg-primary text-on-primary" : "bg-surface text-text-strong hover:bg-selected",
                  )}
                >
                  {on ? "Selecionado" : servicePrice(s).action}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Photos({ provider: v }: { provider: ProviderData }) {
  return (
    <section id="fotos" aria-label="Fotos dos trabalhos" className={cn(CARD, "scroll-mt-32")}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={H2}>Fotos dos trabalhos</h2>
        <span className={SUB}>
          {v.photos.length > 0
            ? `${v.photos.length} ${v.photos.length === 1 ? "foto" : "fotos"}`
            : "Nenhuma foto publicada"}
        </span>
      </div>
      {v.photos.length === 0 ? (
        <EmptyNote title="O prestador ainda não publicou fotos de trabalhos.">
          Peça um orçamento pelo chat para ver exemplos do que ele faz.
        </EmptyNote>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {v.photos.map((ph) => (
            <li key={ph.id} className="h-[130px] overflow-hidden rounded-xl bg-surface-2 sm:h-[170px]">
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos enviadas pelo prestador */}
              <img
                src={ph.url}
                alt="Trabalho do prestador"
                loading="lazy"
                className="size-full object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Area({ profile: p, provider: v }: { profile: Profile; provider: ProviderData }) {
  const today = new Date().getDay();
  const home = v.serviceMode !== "local";
  return (
    <section
      id="area"
      aria-label="Área de atendimento e horários"
      className="grid scroll-mt-32 gap-5 md:grid-cols-2"
    >
      <div className={CARD}>
        <h2 className={H2}>Onde atende</h2>
        <span className="text-sm leading-5 text-text-2">
          <b className="text-text-strong">
            {v.serviceMode === "both" ? "No local e em domicílio" : home ? "Em domicílio" : "No local"}
          </b>
          {home && v.homeRadiusKm ? ` · até ${v.homeRadiusKm} km` : ""}
          {!home &&
            p.address &&
            ` · ${[p.address.street, p.address.neighborhood, p.address.city].filter(Boolean).join(", ")}`}
        </span>
        {v.areas.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {v.areas.map((a) => (
              <li
                key={a}
                className="inline-flex h-7 items-center rounded-full bg-surface-2 px-2.5 text-xs text-text-2"
              >
                {a}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-muted">Bairros atendidos não informados.</p>
        )}
      </div>
      <div className={CARD}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={H2}>Horários</h2>
          {p.responseTime && (
            <span className="text-xs font-bold text-success-text">Responde em {p.responseTime}</span>
          )}
        </div>
        {p.hours.length === 0 ? (
          <p className="text-text-muted">Horário não informado.</p>
        ) : (
          <ul className="flex flex-col">
            {p.hours.map((h) => (
              <li
                key={h.day}
                className={cn(
                  "flex justify-between rounded-lg px-2.5 py-2 text-sm text-text-2",
                  h.day === today && "bg-selected font-bold text-text-strong",
                )}
              >
                <span>{DAYS[h.day]}</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

const FIELD = "text-[13px] font-bold text-text";
const CHIP = (on: boolean) =>
  cn(
    "h-[34px] rounded-full border px-3 text-[13px] whitespace-nowrap",
    on
      ? "border-primary bg-primary font-bold text-on-primary"
      : "border-border bg-surface font-semibold text-text-strong hover:bg-surface-2",
  );

/** Painel fixo "Pedir orçamento" (coluna da direita); no celular vem depois do conteúdo. */
function QuotePanel({
  profile: p,
  provider: v,
  serviceId,
  onService,
}: {
  profile: Profile;
  provider: ProviderData;
  serviceId: string | null;
  onService: (id: string | null) => void;
}) {
  const requireAuth = useRequireAuth();
  const { me } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [when, setWhen] = useState<QuoteWhen | "">("");
  const [neighborhood, setNeighborhood] = useState("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<{ conversationId: string | null; summary: string[] } | null>(null);
  const service = v.services.find((s) => s.id === serviceId) ?? null;
  const needsNeighborhood = v.serviceMode === "home";
  const noServices = v.services.length === 0;
  const first = firstName(p.name);

  const send = useMutation({
    mutationFn: (via: "chat" | "whatsapp") =>
      actions.createQuote({
        profileId: p.id,
        serviceId: serviceId!,
        when: when as QuoteWhen,
        neighborhood: neighborhood.trim() || undefined,
        details: details.trim() || undefined,
        via,
      }),
    onSuccess: (r, via) => {
      track({ type: "AVAILABILITY_CHECK", targetType: "PROVIDER", targetId: p.id, props: { via } });
      if (via === "whatsapp") {
        const url = r.whatsappUrl ?? whatsappUrl(p.whatsapp, providerMessage(p.name, service?.name));
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }
      setSent({
        conversationId: r.conversationId,
        summary: [
          `Serviço: ${service?.name ?? "—"}`,
          `Quando: ${WHEN_OPTIONS.find((o) => o.id === when)?.label ?? "—"}`,
          ...(neighborhood.trim() ? [`Bairro: ${neighborhood.trim()}`] : []),
        ],
      });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      else toast(e instanceof Error ? e.message : "Não foi possível enviar o pedido.", "info");
    },
  });

  // quem não tem conta perde a página ao entrar: o pedido digitado volta pronto para conferir e enviar
  useResumeAction("quote", p.id, () => {
    const d = takeQuoteDraft(p.id);
    if (d) {
      if (d.serviceId) onService(d.serviceId);
      setWhen(d.when);
      setNeighborhood(d.neighborhood);
      setDetails(d.details);
    }
    toast("Você entrou. Confira o pedido e envie.");
    document.getElementById("orcamento")?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  const submit = (via: "chat" | "whatsapp") => {
    if (!me) saveQuoteDraft(p.id, { serviceId, when, neighborhood, details });
    if (!requireAuth("quote", p.id)) return;
    const errs = validateQuote({ serviceId, when, neighborhood, details, needsNeighborhood });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    send.mutate(via);
  };

  const shell = "flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-card-hover lg:sticky lg:top-[100px]";

  if (sent)
    return (
      <aside id="orcamento" aria-label="Pedir orçamento" aria-live="polite" className={shell}>
        <div className="flex flex-col items-center gap-3 px-1 py-3 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success-text">
            <Check className="size-8" aria-hidden />
          </span>
          <span className="text-xl leading-7 font-extrabold text-text-strong">Pedido enviado!</span>
          <span className="text-sm leading-[21px] text-text-muted">
            {p.name} recebeu seu pedido de orçamento. Você acompanha a resposta em Conversas e em Minha
            atividade.
          </span>
          <ul className="flex flex-col gap-1 self-stretch rounded-[10px] bg-bg p-3 text-left text-[13px] leading-[19px] text-text-2">
            {sent.summary.map((l) => {
              const [k, ...rest] = l.split(": ");
              return (
                <li key={l}>
                  <b>{k}:</b> {rest.join(": ")}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() =>
              router.push(sent.conversationId ? conversaHref(sent.conversationId) : routes.conversas)
            }
            className="flex h-11 items-center justify-center self-stretch rounded-lg bg-primary text-sm font-bold text-on-primary hover:bg-primary-hover"
          >
            Acompanhar em Conversas
          </button>
          <Link
            href={`${routes.atividade}?aba=orcamentos`}
            className="flex h-10 items-center justify-center self-stretch rounded-lg border border-primary text-[13px] font-bold text-text-strong hover:bg-selected"
          >
            Ver em Minha atividade › Orçamentos
          </Link>
          <button
            type="button"
            onClick={() => {
              setSent(null);
              setWhen("");
              setDetails("");
              setNeighborhood("");
            }}
            className="h-9 text-[13px] font-bold text-link hover:underline"
          >
            Fazer outro pedido
          </button>
        </div>
      </aside>
    );

  return (
    <aside id="orcamento" aria-label="Pedir orçamento" className={cn(shell, "scroll-mt-32")}>
      <div className="flex flex-col gap-1">
        <span className="text-xl leading-7 font-extrabold text-text-strong">Pedir orçamento</span>
        <span className="text-[13px] leading-[19px] text-text-2">
          Grátis e sem compromisso.{" "}
          {p.responseTime
            ? `${first} costuma responder em ${p.responseTime}.`
            : `${first} responde pelo chat.`}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className={FIELD} id="q-serv">
          Qual serviço?
        </span>
        {noServices ? (
          <p role="status" className="rounded-lg bg-bg p-3 text-[13px] text-text-muted">
            O prestador ainda não cadastrou serviços, então o pedido está desativado. Use “Conversar” no topo
            da página.
          </p>
        ) : (
          <div role="radiogroup" aria-labelledby="q-serv" className="flex flex-col gap-1.5">
            {v.services.map((s) => {
              const on = s.id === serviceId;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onService(s.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[10px] border-[1.5px] px-3 py-2.5 text-left",
                    on ? "border-primary bg-selected" : "border-border bg-surface hover:bg-bg",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "box-border size-4 shrink-0 rounded-full border-2",
                      on ? "border-[5px] border-primary" : "border-border-strong",
                    )}
                  />
                  <span className="flex-1 text-[13px] font-semibold text-text">{s.name}</span>
                  <span className="text-xs whitespace-nowrap text-text-2">
                    {servicePrice(s).value}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {errors.serviceId && (
          <span role="alert" className="text-xs font-semibold text-danger-text">
            {errors.serviceId}
          </span>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={cn(FIELD, "mb-2")}>Para quando?</legend>
        <div className="flex flex-wrap gap-1.5">
          {WHEN_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={when === o.id}
              onClick={() => setWhen(o.id)}
              className={CHIP(when === o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        {errors.when && (
          <span role="alert" className="text-xs font-semibold text-danger-text">
            {errors.when}
          </span>
        )}
      </fieldset>

      {needsNeighborhood && (
        <label className="flex flex-col gap-2">
          <span className={FIELD}>Seu bairro</span>
          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            aria-invalid={!!errors.neighborhood}
            className="h-11 rounded-[10px] border border-border bg-surface px-3 text-[13px] text-text"
          />
          {errors.neighborhood && (
            <span role="alert" className="text-xs font-semibold text-danger-text">
              {errors.neighborhood}
            </span>
          )}
        </label>
      )}

      <label className="flex flex-col gap-2">
        <span className={FIELD}>Conte mais (opcional)</span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Ex.: descreva o que você precisa"
          className="w-full resize-y rounded-[10px] border border-border bg-surface px-3 py-2.5 text-[13px] leading-[19px] text-text"
        />
        <span className="self-end text-xs text-text-subtle">{details.length}/400</span>
      </label>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={send.isPending || noServices}
          onClick={() => submit("chat")}
          className="flex h-[46px] items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          <MessageCircle className="size-[18px]" aria-hidden />
          Enviar pedido pelo chat
        </button>
        {p.whatsapp ? (
          <button
            type="button"
            disabled={send.isPending || noServices}
            onClick={() => submit("whatsapp")}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-success-soft text-sm font-bold text-success-text hover:brightness-95 disabled:opacity-60"
          >
            <WhatsAppIcon className="size-4" />
            Prefiro pelo WhatsApp
          </button>
        ) : (
          <button
            type="button"
            disabled
            title="O prestador não informou WhatsApp"
            className="flex h-11 cursor-not-allowed items-center justify-center rounded-lg border border-border text-sm font-bold text-text-subtle"
          >
            WhatsApp não informado
          </button>
        )}
      </div>
      <span className="text-center text-[11px] leading-4 text-text-muted">
        Seu telefone só é compartilhado se você escolher o WhatsApp.
      </span>
    </aside>
  );
}
