"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  Tag,
  UserRound,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { btnPrimary } from "@/components/account/shared";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { useToast } from "@/components/ui/toast";
import { type Faq as FaqData, help } from "@/lib/api/account";
import { actions } from "@/lib/api/actions";
import { filterFaq } from "@/lib/domain/account";
import { whatsappUrl } from "@/lib/domain/whatsapp";
import { routes } from "@/lib/routes";

import { ContactForm } from "./contact-form";

const TABS = [
  { id: "faq", label: "Perguntas frequentes" },
  { id: "contato", label: "Fale conosco" },
] as const;

/** Atalhos para os textos institucionais (fixos, são rotas do próprio app). */
const INSTITUTIONAL = [
  ["Como funciona", `${routes.institucional}/sobre`],
  ["Termos de uso", `${routes.institucional}/termos`],
  ["Privacidade", `${routes.institucional}/privacidade`],
  ["Cookies", `${routes.institucional}/cookies`],
  ["Regras de avaliação", `${routes.institucional}/avaliacoes`],
  ["Denunciar", "/denunciar"],
] as const;

const CAT_ICONS: Record<string, typeof Tag> = {
  conta: UserRound,
  buscar: Search,
  ofertas: Tag,
  contato: MessageCircle,
  avaliacoes: Star,
  privacidade: ShieldCheck,
};

const safeHref = (h: string) => h.startsWith("/") && !h.startsWith("//");

export function HelpView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("aba") === "contato" ? "contato" : "faq";
  const q = useQuery({ queryKey: ["help", "faq"], queryFn: help.faq });
  const [query, setQuery] = useState("");
  const setTab = (t: string) => router.replace(`${pathname}?aba=${t}`, { scroll: false });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 rounded-[20px] bg-navy p-5 sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] leading-9 font-bold text-white sm:text-[32px] sm:leading-10">
            Como podemos ajudar?
          </h1>
          <p className="text-base text-navy-200">
            Respostas rápidas sobre a EncontraÊ. Se não resolver, fale com a gente.
          </p>
        </div>
        <label className="flex h-14 max-w-[760px] items-center gap-3 rounded-full bg-white px-5">
          <Search className="size-[22px] shrink-0 text-navy" aria-hidden />
          <span className="sr-only">Buscar na ajuda</span>
          <input
            type="search"
            value={query}
            disabled={!q.data}
            onChange={(e) => {
              setQuery(e.target.value);
              if (tab !== "faq") setTab("faq");
            }}
            placeholder="Ex.: cupom, senha, localização, avaliação"
            className="min-w-0 flex-1 border-0 bg-transparent text-base text-[#212529] outline-none placeholder:text-text-subtle disabled:opacity-60"
          />
        </label>
        <nav aria-label="Textos da EncontraÊ" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold">
          {INSTITUTIONAL.map(([label, href]) => (
            <Link key={href} href={href} className="inline-flex min-h-8 items-center text-white/85 hover:text-white hover:underline">
              {label} ›
            </Link>
          ))}
        </nav>
        <div role="tablist" aria-label="Ajuda" className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={cn(
                  "h-[38px] rounded-full border px-4 text-sm font-bold",
                  on ? "border-white bg-white text-navy" : "border-white/40 text-white hover:border-white/70",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {tab === "contato" ? (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <ContactForm />
          <Channels data={q.data} loading={q.isPending} error={q.isError} retry={() => void q.refetch()} />
        </div>
      ) : (
        <Faq
          data={q.data}
          loading={q.isPending}
          error={q.isError ? q.error : null}
          retry={() => void q.refetch()}
          goContact={() => setTab("contato")}
          query={query}
        />
      )}
    </div>
  );
}

function Channels({
  data,
  loading,
  error,
  retry,
}: {
  data?: FaqData;
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const ch = data?.channels;
  const sup = data?.support;
  const wa = whatsappUrl(sup?.whatsapp ?? null, "Olá! Preciso de ajuda na EncontraÊ.");
  const chat = useMutation({
    mutationFn: () => actions.startConversation({ profileId: sup?.chatProfileId ?? "" }),
    onSuccess: (r) => router.push(`${routes.conversas}/${r.id}`),
    onError: () => toast("Não foi possível abrir o chat agora. Tente de novo.", "info"),
  });
  const missing = loading ? "Carregando…" : error ? "Não foi possível carregar" : "Informação indisponível";
  const rows = [
    {
      key: "chat",
      title: "Chat com o suporte",
      text: ch?.chat,
      icon: <MessageCircle className="size-5" aria-hidden />,
      tone: "bg-selected text-text-strong",
      act: sup?.chatProfileId ? { onClick: () => chat.mutate() } : null,
    },
    {
      key: "email",
      title: "E-mail",
      text: ch?.email,
      icon: <Mail className="size-5" aria-hidden />,
      tone: "bg-accent-soft text-accent-text",
      act: sup?.email ? { href: `mailto:${sup.email}` } : null,
    },
    {
      key: "wa",
      title: "WhatsApp",
      text: ch?.whatsapp,
      icon: <WhatsAppIcon className="size-5" />,
      tone: "bg-success-soft text-success-text",
      act: wa ? { href: wa } : null,
    },
  ];
  const card =
    "flex items-center gap-3.5 rounded-[14px] border border-border bg-surface p-4 text-left";
  return (
    <aside className="flex flex-col gap-3">
      <h2 className="text-base leading-6 font-bold text-text-strong">Outros canais</h2>
      {rows.map((r) => {
        const body = (
          <>
            <span
              className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", r.tone)}
            >
              {r.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-bold text-text">{r.title}</span>
              <span className="text-xs text-text-subtle">
                {[r.key === "email" ? sup?.email : null, r.text].filter(Boolean).join(" · ") || missing}
              </span>
            </span>
          </>
        );
        if (r.act && "href" in r.act)
          return (
            <a key={r.key} href={r.act.href} className={cn(card, "hover:bg-surface-2")}>
              {body}
            </a>
          );
        if (r.act)
          return (
            <button
              key={r.key}
              type="button"
              disabled={chat.isPending}
              onClick={r.act.onClick}
              className={cn(card, "hover:bg-surface-2 disabled:opacity-60")}
            >
              {body}
            </button>
          );
        return (
          <div key={r.key} className={card}>
            {body}
          </div>
        );
      })}
      {error && (
        <button type="button" onClick={retry} className="self-start text-[13px] font-bold text-link hover:underline">
          Tentar de novo
        </button>
      )}
      <div className="rounded-[14px] bg-surface-2 px-4 py-3.5 text-[13px] leading-5 text-text-muted">
        <b className="text-text">Problema com uma loja?</b> Primeiro tente resolver pelo chat com ela. Se não
        der certo, conte aqui que a gente acompanha.
      </div>
    </aside>
  );
}

function Faq({
  data,
  loading,
  error,
  retry,
  goContact,
  query,
}: {
  data?: FaqData;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  goContact: () => void;
  query: string;
}) {
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const items = useMemo(() => data?.items ?? [], [data]);
  const shown = useMemo(() => filterFaq(items, query, cat), [items, query, cat]);
  const searching = query.trim().length > 0;
  const catName = data?.categories.find((c) => c.id === cat)?.name;
  const title = searching
    ? `${shown.length} ${shown.length === 1 ? "resposta" : "respostas"} para “${query.trim()}”`
    : (catName ?? "Perguntas frequentes");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <nav aria-label="Categorias" className="flex flex-col gap-1 rounded-2xl bg-surface p-3 shadow-card">
        <CatButton
          label="Todas as dúvidas"
          n={data ? items.length : null}
          on={cat === null}
          onClick={() => {
            setCat(null);
            setOpen(null);
          }}
          icon={
            <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 3h7v7H3z" />
              <path d="M14 14h7v7h-7z" />
            </svg>
          }
        />
        {(data?.categories ?? []).map((c) => {
          const Icon = CAT_ICONS[c.id] ?? HelpCircle;
          return (
            <CatButton
              key={c.id}
              label={c.name}
              n={c.count}
              on={cat === c.id}
              onClick={() => {
                setCat(c.id);
                setOpen(null);
              }}
              icon={<Icon className="size-[18px]" aria-hidden />}
            />
          );
        })}
        {!data && <p className="px-3 py-2 text-[13px] text-text-subtle">{loading ? "Carregando categorias…" : "Categorias indisponíveis."}</p>}
      </nav>

      <div className="flex min-w-0 flex-col gap-3">
        <h2 className="text-xl leading-7 font-bold text-text-strong">{title}</h2>
        {loading ? (
          <p role="status" className="rounded-2xl bg-surface py-10 text-center text-text-muted shadow-card">
            Carregando as perguntas…
          </p>
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={retry}
            title="Não foi possível carregar as perguntas frequentes"
            description="As respostas vêm do nosso servidor e não chegaram agora. Enquanto isso, você pode falar com o suporte."
          />
        ) : shown.length === 0 ? (
          <div className="rounded-2xl bg-surface p-8 text-center shadow-card">
            <p className="mb-3 text-[15px] text-text-muted">
              {items.length === 0
                ? "Ainda não há perguntas frequentes publicadas."
                : searching
                  ? `Não achamos nada sobre “${query.trim()}”.`
                  : "Nenhuma pergunta nesta categoria."}
            </p>
            <button type="button" className={btnPrimary} onClick={goContact}>
              Falar com o suporte
            </button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((item) => (
              <FaqRow
                key={item.id}
                item={item}
                open={open === item.id}
                onToggle={() => setOpen(open === item.id ? null : item.id)}
                goContact={goContact}
              />
            ))}
          </ul>
        )}
        {!loading && (
          <div className="mt-2 flex flex-wrap items-center gap-4 rounded-2xl border border-accent-border bg-accent-soft px-5 py-[18px]">
            <span className="min-w-0 flex-1 text-[15px] font-semibold text-accent-ink">
              Não encontrou sua resposta?
            </span>
            <button type="button" className={btnPrimary} onClick={goContact}>
              Fale conosco
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CatButton({
  label,
  n,
  on,
  onClick,
  icon,
}: {
  label: string;
  n: number | null;
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left hover:bg-surface-2",
        on && "bg-selected hover:bg-selected",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
          on ? "bg-primary text-on-primary" : "bg-surface-2 text-link",
        )}
      >
        {icon}
      </span>
      <span className={cn("flex-1 text-sm text-text", on ? "font-bold" : "font-medium")}>{label}</span>
      <span className="text-xs text-text-subtle">{n ?? "—"}</span>
    </button>
  );
}

function FaqRow({
  item,
  open,
  onToggle,
  goContact,
}: {
  item: { id: string; question: string; answer: string; link?: { label: string; href: string } | null };
  open: boolean;
  onToggle: () => void;
  goContact: () => void;
}) {
  const toast = useToast();
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);
  const [comment, setComment] = useState("");
  const yes = useMutation({
    mutationFn: () => help.helpful(item.id, true),
    onSuccess: () => {
      setVoted("yes");
      toast("Obrigado pelo retorno!");
    },
    onError: () => toast("Não foi possível registrar agora. Tente de novo.", "info"),
  });
  const no = useMutation({
    mutationFn: () => help.unhelpful(item.id, comment.trim()),
    onSuccess: () => toast("Obrigado! Vamos melhorar essa resposta."),
  });
  const pill = "h-[30px] rounded-full border px-3 text-xs font-semibold";
  return (
    <li className="overflow-hidden rounded-2xl bg-surface shadow-card">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`faq-${item.id}`}
          onClick={onToggle}
          className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-surface-2"
        >
          <span className="flex-1 text-[15px] leading-[22px] font-semibold text-text">{item.question}</span>
          <span
            aria-hidden
            className={cn("text-lg text-link transition-transform", open && "rotate-180")}
          >
            ⌄
          </span>
        </button>
      </h3>
      {open && (
        <div id={`faq-${item.id}`} className="flex flex-col gap-3 px-5 pb-[18px]">
          <p className="text-sm leading-[22px] whitespace-pre-line text-text-muted">{item.answer}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {item.link && safeHref(item.link.href) && (
              <Link href={item.link.href} className="text-[13px] font-bold text-link hover:underline">
                {item.link.label} ›
              </Link>
            )}
            <span className="ml-auto text-xs text-text-subtle">Esta resposta ajudou?</span>
            <button
              type="button"
              disabled={yes.isPending}
              onClick={() => voted !== "yes" && yes.mutate()}
              className={cn(
                pill,
                voted === "yes"
                  ? "border-success bg-success-soft text-success-text"
                  : "border-border bg-surface text-text hover:bg-surface-2",
              )}
            >
              Sim
            </button>
            <button
              type="button"
              disabled={voted === "no"}
              onClick={() => setVoted("no")}
              className={cn(pill, "border-border bg-surface text-text hover:bg-surface-2")}
            >
              Não
            </button>
          </div>
          {voted === "no" && !no.isSuccess && (
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-text" htmlFor={`c-${item.id}`}>
                O que faltou?
              </label>
              <textarea
                id={`c-${item.id}`}
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-lg border border-border bg-surface p-3 text-sm text-text"
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnPrimary} disabled={no.isPending} onClick={() => no.mutate()}>
                  Enviar
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center rounded-lg border border-primary px-5 text-sm font-bold text-text-strong hover:bg-surface-2"
                  onClick={goContact}
                >
                  Falar com o suporte
                </button>
              </div>
            </div>
          )}
          {no.isSuccess && (
            <p role="status" className="text-[13px] text-text-muted">
              Recebemos seu retorno. Se ainda precisar,{" "}
              <button type="button" onClick={goContact} className="font-bold text-link hover:underline">
                fale com o suporte
              </button>
              .
            </p>
          )}
        </div>
      )}
    </li>
  );
}
