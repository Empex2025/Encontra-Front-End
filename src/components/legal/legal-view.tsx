"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Trash2 } from "lucide-react";
import Link from "next/link";

import { ErrorState } from "@/components/ui/error-state";
import { type LegalDoc, legal } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { LEGAL_DOCS, type LegalDocId } from "@/lib/domain/legal-docs";
import { routes } from "@/lib/routes";

import { CookieControls } from "./cookie-controls";
import { InstitutionalShell } from "./institutional-shell";

const STEPS = [
  { n: 1, title: "Busque", text: "Digite o que precisa ou explore o mapa. Mostramos lojas, produtos e serviços perto de você." },
  {
    n: 2,
    title: "Compare",
    text: "Veja preço, distância, horário e avaliações lado a lado antes de sair de casa.",
  },
  {
    n: 3,
    title: "Fale com a loja",
    text: "Converse pelo chat, chame no WhatsApp ou trace a rota. A compra é combinada direto com a loja.",
  },
] as const;

const dateBr = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

export function LegalView({ doc }: { doc: string }) {
  const meta = LEGAL_DOCS.find((d) => d.doc === doc) ?? LEGAL_DOCS[0];
  const q = useQuery({
    queryKey: ["legal", doc],
    queryFn: () => legal.doc(doc),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  const notFound = q.error instanceof ApiError && q.error.status === 404;
  const isLegalText = doc !== "sobre";
  const d = q.data;

  return (
    <InstitutionalShell
      active={meta.doc as LegalDocId}
      title={d?.title || meta.title}
      sub={meta.sub}
      updated={
        isLegalText
          ? d
            ? `Última atualização: ${dateBr(d.updatedAt)}${d.version ? ` · versão ${d.version}` : ""}`
            : "Última atualização: —"
          : null
      }
    >
      {doc === "sobre" && <HowItWorks />}
      {q.isPending ? (
        <>
          {doc === "cookies" && <CookieControls />}
          <p role="status" className="py-10 text-center text-text-muted">
            Carregando o texto…
          </p>
        </>
      ) : q.isError ? (
        <>
          {doc === "cookies" && <CookieControls />}
          {notFound ? (
            <section className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-6 py-10 text-center shadow-card">
              <h3 className="text-lg font-bold text-text-strong">Texto ainda não publicado</h3>
              <p className="max-w-md text-text-muted">
                O servidor ainda não tem a versão oficial deste documento. Não mostramos um texto provisório
                para não passar informação errada.
              </p>
            </section>
          ) : (
            <ErrorState
              error={q.error}
              onRetry={() => q.refetch()}
              title="Não foi possível carregar este documento"
              description="O texto oficial vem do nosso servidor e não está disponível agora. Não mostramos uma versão provisória para não passar informação errada."
            />
          )}
        </>
      ) : (
        <Body doc={doc} data={q.data} />
      )}
      {doc === "privacidade" && <Rights />}
      {doc === "avaliacoes" && (
        <p className="text-[15px] leading-6 text-text-muted">
          Achou uma avaliação que fere as regras?{" "}
          <Link href="/denunciar?tipo=avaliacao" className="font-bold text-link hover:underline">
            Denunciar avaliação ›
          </Link>
        </p>
      )}
    </InstitutionalShell>
  );
}

/** Texto vindo do servidor: seções com título 20/28 e parágrafos de 15/24; Termos em lista numerada. */
function Body({ doc, data }: { doc: string; data: LegalDoc }) {
  const numbered = doc === "termos";
  const sections = data.sections;
  const strip = (h: string) => h.replace(/^\s*\d+[.)]\s*/, "");
  const render = (s: LegalDoc["sections"][number], i: number) =>
    numbered ? (
      <li key={`${i}-${s.heading}`} className="flex gap-3.5">
        <span className="w-7 shrink-0 text-[15px] leading-6 font-bold text-link">{i + 1}.</span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="text-base leading-6 font-bold text-text-strong">{strip(s.heading)}</h3>
          <Paragraphs text={s.body} />
        </div>
      </li>
    ) : (
      <section key={`${i}-${s.heading}`} className="flex flex-col gap-2">
        <h3 className="text-xl leading-7 font-bold text-text-strong">{s.heading}</h3>
        <Paragraphs text={s.body} />
      </section>
    );

  if (sections.length === 0 && !data.summary)
    return (
      <>
        {doc === "cookies" && <CookieControls />}
        <p className="rounded-2xl bg-surface px-6 py-10 text-center text-text-muted shadow-card">
          Este documento ainda não tem conteúdo publicado.
        </p>
      </>
    );

  return (
    <div className="flex flex-col gap-8">
      {data.summary && (
        <p className="rounded-r-xl border-l-[3px] border-amber bg-bg px-5 py-4 text-[15px] leading-6 text-text-2">
          <b className="text-text-strong">Em resumo:</b> {data.summary}
        </p>
      )}
      {doc === "cookies" ? (
        <>
          {sections.slice(0, 1).map(render)}
          <CookieControls />
          {sections.slice(1).map(render)}
        </>
      ) : numbered ? (
        <ol className="flex flex-col gap-5">{sections.map(render)}</ol>
      ) : (
        sections.map(render)
      )}
    </div>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-2">
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} className="text-[15px] leading-6 whitespace-pre-line text-text-muted">
            {p}
          </p>
        ))}
    </div>
  );
}

/** Os 3 passos do "Como funciona": rótulos de interface do protótipo, não texto jurídico. */
function HowItWorks() {
  return (
    <ol
      aria-label="Como usar em 3 passos"
      className="grid gap-4 rounded-2xl bg-bg p-4 sm:grid-cols-3 sm:p-6"
    >
      {STEPS.map((s, i) => (
        <li key={s.n} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-selected text-text-strong">
              <StepIcon n={s.n} />
              <span className="absolute -top-1 -right-1 flex size-[22px] items-center justify-center rounded-full bg-amber text-xs font-extrabold text-navy">
                {s.n}
              </span>
            </span>
            {i < STEPS.length - 1 && <span aria-hidden className="hidden h-0.5 flex-1 rounded-sm bg-border-strong sm:block" />}
          </div>
          <span className="text-base leading-6 font-bold text-text-strong">{s.title}</span>
          <span className="text-sm leading-[21px] text-text-muted">{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

function StepIcon({ n }: { n: number }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-6",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (n === 1)
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    );
  if (n === 2)
    return (
      <svg {...common}>
        <path d="M3 3v18h18" />
        <path d="M7 16v-5M12 16V7M17 16v-8" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

/** Atalhos reais para exercer os direitos: levam à aba Privacidade da conta. */
function Rights() {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xl leading-7 font-bold text-text-strong">Exercer seus direitos</h3>
      <div className="mt-1 flex flex-wrap gap-3">
        <Link
          href={`${routes.conta}?aba=priv`}
          className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-primary bg-surface px-[18px] text-sm font-bold text-text-strong hover:bg-surface-2"
        >
          <Download className="size-4" aria-hidden /> Baixar meus dados
        </Link>
        <Link
          href={`${routes.conta}?aba=priv`}
          className="inline-flex h-11 items-center gap-2 rounded-lg border-[1.5px] border-danger-text bg-surface px-[18px] text-sm font-bold text-danger-text hover:bg-danger-soft"
        >
          <Trash2 className="size-4" aria-hidden /> Excluir minha conta
        </Link>
      </div>
      <span className="text-[13px] leading-5 text-text-subtle">
        A exclusão é feita em Minha Conta › Privacidade e se torna definitiva após 30 dias.
      </span>
    </section>
  );
}

