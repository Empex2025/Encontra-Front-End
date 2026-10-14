"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Mail, MessageCircle, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { btnOutline, btnPrimary } from "@/components/account/shared";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { type Faq as FaqData, help } from "@/lib/api/account";
import { filterFaq } from "@/lib/domain/account";
import { routes } from "@/lib/routes";

import { ContactForm } from "./contact-form";

const TABS = [
  { id: "faq", label: "Perguntas frequentes" },
  { id: "contato", label: "Fale conosco" },
];

export function HelpView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab = params.get("aba") === "contato" ? "contato" : "faq";
  const q = useQuery({ queryKey: ["help", "faq"], queryFn: help.faq });
  const setTab = (t: string) => router.replace(`${pathname}?aba=${t}`, { scroll: false });

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">Central de Ajuda</h1>
        <p className="text-text-muted">Respostas rápidas e, se precisar, fale com a gente.</p>
      </header>
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Ajuda" />
      {tab === "contato" ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <ContactForm />
          <Channels channels={q.data?.channels} />
        </div>
      ) : (
        <Faq
          data={q.data}
          loading={q.isPending}
          error={q.isError ? q.error : null}
          retry={() => void q.refetch()}
          goContact={() => setTab("contato")}
        />
      )}
    </div>
  );
}

function Channels({ channels }: { channels?: { chat: string; email: string; whatsapp: string } }) {
  const rows = [
    { icon: MessageCircle, label: "Chat", text: channels?.chat },
    { icon: Mail, label: "E-mail", text: channels?.email },
    { icon: MessageCircle, label: "WhatsApp", text: channels?.whatsapp },
  ];
  const missing = "Informação indisponível no momento";
  return (
    <aside className="flex flex-col gap-3 self-start rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-lg font-bold text-text-strong">Outros canais</h2>
      {rows.map((r) => (
        <div key={r.label} className="flex items-start gap-3">
          <r.icon className="mt-0.5 size-5 shrink-0 text-link" aria-hidden />
          <div>
            <p className="font-semibold text-text-strong">{r.label}</p>
            <p className="text-sm text-text-muted">{r.text || missing}</p>
          </div>
        </div>
      ))}
    </aside>
  );
}

function Faq({
  data,
  loading,
  error,
  retry,
  goContact,
}: {
  data?: FaqData;
  loading: boolean;
  error: Error | null;
  retry: () => void;
  goContact: () => void;
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const items = useMemo(() => data?.items ?? [], [data]);
  const shown = useMemo(() => filterFaq(items, query, cat), [items, query, cat]);
  const ready = !!data;
  const searching = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block">
        <span className="sr-only">Buscar na Central de Ajuda</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-subtle"
          aria-hidden
        />
        <input
          type="search"
          disabled={!ready}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(null);
          }}
          placeholder="Busque por uma dúvida"
          className="h-12 w-full rounded-lg border border-border-strong bg-surface pr-3 pl-10 text-base text-text outline-none focus:border-primary focus:ring-2 focus:ring-focus/40 disabled:opacity-60"
        />
      </label>

      {!searching && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias">
          <button
            type="button"
            aria-pressed={cat === null}
            onClick={() => setCat(null)}
            className={chip(cat === null)}
          >
            Todas <span className="text-text-subtle">{ready ? items.length : "—"}</span>
          </button>
          {(data?.categories ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={cat === c.id}
              onClick={() => setCat(c.id)}
              className={chip(cat === c.id)}
            >
              {c.name} <span className="text-text-subtle">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p role="status" className="py-10 text-center text-text-muted">
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
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-10 text-center">
          <h2 className="text-lg font-bold text-text-strong">
            {items.length === 0 ? "Nenhuma pergunta publicada ainda" : "Não encontramos essa dúvida"}
          </h2>
          <p className="text-text-muted">
            {items.length === 0
              ? "Ainda não há perguntas frequentes cadastradas. Fale com a gente se precisar de ajuda."
              : "Tente outras palavras ou fale com a gente."}
          </p>
          <button type="button" className={btnPrimary} onClick={goContact}>
            Falar com o suporte
          </button>
        </section>
      ) : (
        <ul className="flex flex-col gap-2">
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
      {!loading && (shown.length > 0 || !!error) && (
        <p className="text-sm text-text-muted">
          Não achou?{" "}
          <button type="button" onClick={goContact} className="font-semibold text-link hover:underline">
            Falar com o suporte
          </button>
        </p>
      )}
    </div>
  );
}
const chip = (on: boolean) =>
  cn(
    "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
    on
      ? "border-primary bg-selected text-text-strong"
      : "border-border-strong text-text-2 hover:bg-surface-2",
  );

function FaqRow({
  item,
  open,
  onToggle,
  goContact,
}: {
  item: { id: string; question: string; answer: string };
  open: boolean;
  onToggle: () => void;
  goContact: () => void;
}) {
  const toast = useToast();
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);
  const [comment, setComment] = useState("");
  const yes = useMutation({
    mutationFn: () => help.helpful(item.id, true),
    onSuccess: () => setVoted("yes"),
  });
  const no = useMutation({
    mutationFn: () => help.unhelpful(item.id, comment.trim()),
    onSuccess: () => toast("Obrigado! Vamos melhorar essa resposta."),
  });
  return (
    <li className="rounded-xl border border-border bg-surface">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`faq-${item.id}`}
          onClick={onToggle}
          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left font-semibold text-text-strong"
        >
          {item.question}
          <ChevronDown
            className={cn("size-5 shrink-0 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
      </h3>
      {open && (
        <div id={`faq-${item.id}`} className="flex flex-col gap-3 border-t border-border px-4 py-4">
          <p className="whitespace-pre-line text-text">{item.answer}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-text-strong">Esta resposta ajudou?</span>
            {voted === "yes" ? (
              <span role="status" className="text-sm font-semibold text-success-text">
                Obrigado pelo retorno!
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className={btnOutline}
                  disabled={yes.isPending}
                  onClick={() => !yes.isSuccess && yes.mutate()}
                >
                  <ThumbsUp className="mr-1.5 size-4" aria-hidden /> Sim
                </button>
                <button
                  type="button"
                  className={btnOutline}
                  disabled={voted === "no"}
                  onClick={() => setVoted("no")}
                >
                  <ThumbsDown className="mr-1.5 size-4" aria-hidden /> Não
                </button>
              </>
            )}
          </div>
          {voted === "no" && !no.isSuccess && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-text-strong" htmlFor={`c-${item.id}`}>
                O que faltou?
              </label>
              <textarea
                id={`c-${item.id}`}
                rows={3}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="rounded-lg border border-border-strong bg-surface p-3 text-text"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={no.isPending}
                  onClick={() => no.mutate()}
                >
                  Enviar
                </button>
                <button type="button" className={btnOutline} onClick={goContact}>
                  Falar com o suporte
                </button>
              </div>
            </div>
          )}
          {no.isSuccess && (
            <p role="status" className="text-sm text-text-muted">
              Recebemos seu retorno. Se ainda precisar,{" "}
              <Link href={`${routes.ajuda}?aba=contato`} className="font-semibold text-link hover:underline">
                fale com o suporte
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </li>
  );
}
