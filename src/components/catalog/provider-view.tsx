"use client";

import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Clock, Home, MapPin, ShieldCheck, ThumbsUp, Wrench } from "lucide-react";
import { useState } from "react";

import { useRequireAuth } from "@/components/auth/auth-invite";
import { useSession } from "@/hooks/use-session";
import { useResumeAction } from "@/hooks/use-resume-action";
import { cn } from "@/components/ui/cn";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { actions } from "@/lib/api/actions";
import type { ProviderData, Profile } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import {
  saveQuoteDraft,
  takeQuoteDraft,
  validateQuote,
  WHEN_OPTIONS,
  type QuoteWhen,
} from "@/lib/domain/quote-form";
import { providerMessage, whatsappUrl } from "@/lib/domain/whatsapp";
import { avaliarHref, conversaHref } from "@/lib/routes";
import { useRouter } from "next/navigation";

import { ContactButtons } from "./contact-buttons";
import { ReviewsPanel } from "./reviews-panel";
import { SimilarProfiles } from "./profile-view";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Corpo do perfil do prestador (Documento de entrega › Perfil do prestador). */
export function ProviderBody({ profile: p, provider: v }: { profile: Profile; provider: ProviderData }) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const service = v.services.find((s) => s.id === serviceId) ?? null;
  const target = { targetType: "PROVIDER" as const, targetId: p.id };
  const seals = [
    p.verification === "verified" && { icon: BadgeCheck, text: "Identidade verificada" },
    p.cnpjVerified && { icon: ShieldCheck, text: "CNPJ verificado" },
    v.recommendPct !== null && { icon: ThumbsUp, text: `${v.recommendPct}% recomendam` },
    v.jobsDone !== null && { icon: Wrench, text: `${v.jobsDone} serviços feitos` },
  ].filter(Boolean) as { icon: typeof BadgeCheck; text: string }[];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3" aria-label="Contato">
        <ContactButtons
          profile={p}
          whatsappText={providerMessage(p.name, service?.name)}
          chatLabel="Conversar"
          target={target}
        />
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
          {v.serviceMode !== "home" && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              Atende no local
            </span>
          )}
          {v.serviceMode !== "local" && (
            <span className="inline-flex items-center gap-1">
              <Home className="size-4" aria-hidden />
              Atende em domicílio{v.homeRadiusKm ? ` até ${v.homeRadiusKm} km` : ""}
            </span>
          )}
          {v.yearsExperience !== null && <span>{v.yearsExperience} anos de experiência</span>}
          {v.nextSlot && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              Próximo horário: {v.nextSlot}
            </span>
          )}
        </p>
        {seals.length > 0 && (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {seals.map((s) => (
              <li
                key={s.text}
                className="flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm font-semibold text-text"
              >
                <s.icon className="size-5 shrink-0 text-primary" aria-hidden />
                {s.text}
              </li>
            ))}
          </ul>
        )}
        <nav aria-label="Atalhos" className="flex flex-wrap gap-4 text-sm font-semibold text-link">
          <a href="#servicos" className="hover:underline">
            Serviços
          </a>
          {v.photos.length > 0 && (
            <a href="#fotos" className="hover:underline">
              Fotos
            </a>
          )}
          <a href="#avaliacoes" className="hover:underline">
            Avaliações
          </a>
          <a href="#sobre" className="hover:underline">
            Sobre
          </a>
        </nav>
      </section>

      <section id="servicos" aria-labelledby="servicos-t" className="flex scroll-mt-24 flex-col gap-3">
        <h2 id="servicos-t" className="text-xl font-bold text-text-strong">
          Serviços
        </h2>
        {v.services.length === 0 ? (
          <p className="text-text-muted">
            O prestador ainda não cadastrou serviços. Converse para pedir um orçamento.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {v.services.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border p-4",
                  s.id === serviceId ? "border-primary bg-surface-2" : "border-border",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-text-strong">{s.name}</p>
                  {s.description && <p className="text-sm text-text-muted">{s.description}</p>}
                  {s.durationMinutes && <p className="text-xs text-text-subtle">~{s.durationMinutes} min</p>}
                </div>
                <p className="text-sm font-bold text-text-strong">
                  {s.fromCents !== null ? `A partir de ${formatMoney(s.fromCents)}` : "Sob orçamento"}
                </p>
                <button
                  type="button"
                  aria-pressed={s.id === serviceId}
                  onClick={() => {
                    setServiceId(s.id);
                    document
                      .getElementById("orcamento")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="h-11 rounded-lg border border-primary px-4 text-sm font-bold text-text-strong hover:bg-surface-2"
                >
                  {s.id === serviceId ? "Selecionado" : "Pedir orçamento"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {v.photos.length > 0 && (
        <section id="fotos" aria-labelledby="fotos-t" className="flex scroll-mt-24 flex-col gap-3">
          <h2 id="fotos-t" className="text-xl font-bold text-text-strong">
            Fotos de trabalhos
          </h2>
          <ul className="grid grid-cols-3 gap-2">
            {v.photos.map((ph) => (
              <li key={ph.id} className="aspect-square overflow-hidden rounded-lg bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ph.url}
                  alt="Trabalho do prestador"
                  loading="lazy"
                  className="size-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="avaliacoes" aria-labelledby="aval-t" className="flex scroll-mt-24 flex-col gap-3">
        <h2 id="aval-t" className="text-xl font-bold text-text-strong">
          Avaliações
        </h2>
        <ReviewsPanel
          target="profiles"
          slug={p.slug}
          reviewHref={avaliarHref("prestador", p.slug)}
          reviewLabel="Avaliar este prestador"
        />
      </section>

      <section id="sobre" aria-labelledby="sobre-t" className="flex scroll-mt-24 flex-col gap-3">
        <h2 id="sobre-t" className="text-xl font-bold text-text-strong">
          Sobre
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 text-sm">
            <h3 className="font-bold text-text-strong">Área de atendimento</h3>
            {v.areas.length > 0 ? (
              <p className="text-text">{v.areas.join(", ")}</p>
            ) : (
              <p className="text-text-muted">Não informada.</p>
            )}
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <h3 className="font-bold text-text-strong">Horário</h3>
            {p.hours.length === 0 ? (
              <p className="text-text-muted">Não informado.</p>
            ) : (
              <ul>
                {p.hours.map((h) => (
                  <li key={h.day} className="flex justify-between">
                    <span>{DAYS[h.day]}</span>
                    <span>{h.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {p.bio && <p className="whitespace-pre-line text-text">{p.bio}</p>}
        {p.payment.length > 0 && (
          <p className="text-sm text-text-muted">
            Pagamento combinado direto com o prestador: {p.payment.join(", ")}.
          </p>
        )}
      </section>

      <QuoteForm profile={p} provider={v} serviceId={serviceId} onService={setServiceId} />
      <SimilarProfiles profile={p} />
    </div>
  );
}

function QuoteForm({
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
  const [sent, setSent] = useState<{ conversationId: string | null } | null>(null);
  const service = v.services.find((s) => s.id === serviceId) ?? null;
  const needsNeighborhood = v.serviceMode === "home";

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
      setSent({ conversationId: r.conversationId });
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

  if (sent)
    return (
      <section
        id="orcamento"
        aria-live="polite"
        className="bg-success-bg flex flex-col gap-3 rounded-2xl border border-success-text/40 p-5"
      >
        <h2 className="text-xl font-bold text-success-text">Pedido enviado</h2>
        <p className="text-text">
          {p.name} recebeu seu pedido de orçamento. Você acompanha a resposta em Atividade e nas conversas.
        </p>
        {sent.conversationId && (
          <button
            type="button"
            onClick={() => router.push(conversaHref(sent.conversationId!))}
            className="self-start rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary hover:bg-primary-hover"
          >
            Abrir conversa
          </button>
        )}
      </section>
    );

  return (
    <section
      id="orcamento"
      aria-labelledby="orc-t"
      className="flex scroll-mt-24 flex-col gap-4 rounded-2xl border border-border p-5"
    >
      <h2 id="orc-t" className="text-xl font-bold text-text-strong">
        Pedir orçamento
      </h2>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-strong">
        Serviço
        <select
          value={serviceId ?? ""}
          onChange={(e) => onService(e.target.value || null)}
          aria-invalid={!!errors.serviceId}
          className="h-11 rounded-lg border border-border-strong bg-surface px-3 font-normal text-text"
        >
          <option value="">Escolha um serviço</option>
          {v.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.serviceId && (
          <span role="alert" className="text-xs font-semibold text-danger-text">
            {errors.serviceId}
          </span>
        )}
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-text-strong">Para quando?</legend>
        <div className="flex flex-wrap gap-2">
          {WHEN_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={when === o.id}
              onClick={() => setWhen(o.id)}
              className={cn(
                "h-11 rounded-full border px-4 text-sm font-semibold",
                when === o.id
                  ? "border-primary bg-primary text-on-primary"
                  : "border-border-strong text-text hover:bg-surface-2",
              )}
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
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-strong">
          Seu bairro
          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            aria-invalid={!!errors.neighborhood}
            className="h-11 rounded-lg border border-border-strong bg-surface px-3 font-normal text-text"
          />
          {errors.neighborhood && (
            <span role="alert" className="text-xs font-semibold text-danger-text">
              {errors.neighborhood}
            </span>
          )}
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-text-strong">
        Detalhes (opcional)
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={400}
          rows={4}
          className="rounded-lg border border-border-strong bg-surface p-3 font-normal text-text"
        />
        <span className="self-end text-xs font-normal text-text-subtle">{details.length}/400</span>
      </label>
      <p className="text-xs text-text-muted">
        Seu telefone só é compartilhado se você escolher enviar pelo WhatsApp.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={send.isPending}
          onClick={() => submit("chat")}
          className="h-12 flex-1 rounded-lg bg-primary px-4 font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          Enviar pelo chat
        </button>
        {p.whatsapp && (
          <button
            type="button"
            disabled={send.isPending}
            onClick={() => submit("whatsapp")}
            className="h-12 flex-1 rounded-lg border border-primary px-4 font-bold text-text-strong hover:bg-surface-2 disabled:opacity-60"
          >
            Enviar pelo WhatsApp
          </button>
        )}
      </div>
    </section>
  );
}
