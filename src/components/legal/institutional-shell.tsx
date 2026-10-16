import Link from "next/link";

import { cn } from "@/components/ui/cn";
import { LEGAL_DOCS, type LegalDocId } from "@/lib/domain/legal-docs";
import { routes } from "@/lib/routes";

/** Rota de cada item do índice (Denunciar é uma página própria, mas mora no mesmo quadro). */
export const legalHref = (doc: string) => (doc === "denunciar" ? "/denunciar" : `${routes.institucional}/${doc}`);

/**
 * Quadro do Institucional (protótipo): título da página, índice de 260 px à esquerda e o artigo (máx. 760 px)
 * com cabeçalho e rodapé "Ainda tem dúvidas?". Serve aos textos do servidor e à tela Denunciar.
 */
export function InstitutionalShell({
  active,
  title,
  sub,
  updated,
  children,
}: {
  active: LegalDocId;
  title: string;
  sub: string;
  /** Linha "Última atualização: …" (só para textos jurídicos). */
  updated?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] leading-9 font-bold text-text-strong sm:text-[32px] sm:leading-10">
          Institucional
        </h1>
        <p className="text-base text-text-muted">
          Como a EncontraÊ funciona, as regras de uso e os seus direitos.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Índice" className="flex flex-col gap-0.5 py-2 lg:sticky lg:top-[104px]">
          <ul className="flex gap-0.5 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LEGAL_DOCS.map((d) => {
              const on = d.doc === active;
              return (
                <li key={d.doc} className="shrink-0">
                  <Link
                    href={legalHref(d.doc)}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center rounded-r-lg border-l-[3px] px-3.5 text-[15px] whitespace-nowrap hover:bg-surface-2",
                      on
                        ? "border-amber bg-selected font-bold text-text-strong hover:bg-selected"
                        : "border-transparent font-medium text-text-muted",
                    )}
                  >
                    {d.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 ml-[17px] hidden flex-col gap-1 border-t border-surface-3 pt-4 lg:flex">
            <span className="text-[13px] text-text-subtle">Ficou com dúvida?</span>
            <Link href={routes.ajuda} className="text-sm font-bold text-link hover:underline">
              Central de Ajuda ›
            </Link>
          </div>
        </nav>

        <article className="flex max-w-[760px] min-w-0 flex-col gap-7">
          <header className="flex flex-col gap-2 border-b border-border pb-5">
            <h2 className="text-[28px] leading-9 font-bold text-text-strong">{title}</h2>
            <p className="text-base text-text-muted">{sub}</p>
            {updated && <span className="text-[13px] leading-5 text-text-subtle">{updated}</span>}
          </header>
          {children}
          <footer className="mt-4 flex flex-wrap items-center gap-4 border-t border-border pt-5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold text-text-strong">Ainda tem dúvidas?</span>
              <span className="text-sm leading-5 text-text-muted">Nossa equipe responde em até 1 dia útil.</span>
            </div>
            <Link
              href={`${routes.ajuda}?aba=contato`}
              className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-extrabold text-on-accent hover:bg-accent-hover"
            >
              Fale com a gente
            </Link>
          </footer>
        </article>
      </div>
    </div>
  );
}
