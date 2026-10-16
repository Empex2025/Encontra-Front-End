"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";
import { useSession } from "@/hooks/use-session";
import type { SearchItem } from "@/lib/api/search";
import { formatKm, formatMoney } from "@/lib/format";
import { routes } from "@/lib/routes";
import { resultHref } from "@/components/search/result-card";

/** Marca em texto, como no artboard "Compartilhado" (fundo claro, Ê âmbar). */
export function WordMark({ className }: { className?: string }) {
  return (
    <span className={cn("font-brand font-extrabold text-text-strong", className)}>
      Encontra<span className="text-amber">Ê</span>
    </span>
  );
}

/** Cabeçalho da página pública: sem menu lateral nem busca, só marca e entrada. */
export function PublicHeader() {
  const { me, isLoading } = useSession();
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-border bg-surface px-4 sm:px-6 lg:px-20">
      <Link href={routes.home} aria-label="EncontraÊ — início" className="rounded-lg text-2xl">
        <WordMark />
      </Link>
      <nav aria-label="Conta" className="flex items-center gap-3 sm:gap-5">
        {isLoading ? null : me ? (
          <Link
            href={routes.home}
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-extrabold text-on-accent hover:bg-accent-hover"
          >
            Abrir o EncontraÊ
          </Link>
        ) : (
          <>
            <Link href={routes.entrar} className="text-[15px] font-bold text-text-strong hover:underline">
              Entrar
            </Link>
            <Link
              href={routes.cadastro}
              className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-extrabold whitespace-nowrap text-on-accent hover:bg-accent-hover sm:px-5"
            >
              Criar conta grátis
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

/** Rodapé da página pública. `reportHref` leva ao formulário de denúncia do item. */
export function PublicFooter() {
  return (
    <footer className="flex flex-col gap-3 border-t border-border bg-surface px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-20">
      <span className="text-sm text-text-2">
        <b className="text-text-strong">
          Encontra<span className="text-amber">Ê</span>
        </b>{" "}
        — o comércio do seu bairro
      </span>
      <nav aria-label="Informações" className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-semibold">
        <Link href="/institucional/termos" className="text-link hover:underline">
          Termos de uso
        </Link>
        <Link href="/institucional/privacidade" className="text-link hover:underline">
          Privacidade
        </Link>
      </nav>
    </footer>
  );
}

/** Faixa "Fulano te enviou isto". Só com nome real vindo da API (nunca inventado). */
export function SharerBar({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 bg-selected px-4 py-3 text-sm text-text sm:px-6 lg:px-20">
      <span
        aria-hidden
        className="inline-flex size-7 items-center justify-center rounded-full bg-navy text-[13px] font-extrabold text-amber"
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
      <span>
        <b className="text-text-strong">{name}</b> te enviou isto pelo EncontraÊ
      </span>
    </div>
  );
}

/** Grade principal (conteúdo + coluna lateral de 340 px), como no artboard. */
export function PublicMain({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto grid w-full max-w-[1440px] items-start gap-6 px-4 py-8 outline-none sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-20 lg:pb-12"
    >
      <div className="flex min-w-0 flex-col gap-8">{children}</div>
      {aside && <aside className="flex flex-col gap-4 lg:sticky lg:top-6">{aside}</aside>}
    </main>
  );
}

const siteHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : null;
  } catch {
    return null;
  }
})();

/** Coluna lateral: como o link aparece no WhatsApp (dados reais do item) e convite para criar conta. */
export function ShareAside({
  title,
  description,
  imageUrl,
  path,
}: {
  title: string;
  description: string | null;
  imageUrl: string | null;
  path: string;
}) {
  const { isGuest } = useSession();
  return (
    <>
      <section
        aria-labelledby="preview-t"
        className="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-sm"
      >
        <h2 id="preview-t" className="text-[15px] leading-[22px] font-bold text-text-strong">
          Como este link aparece no WhatsApp
        </h2>
        <div className="rounded-xl bg-surface-3 p-3.5">
          <div className="ml-auto max-w-[270px] rounded-[10px] bg-success-soft p-1 shadow-sm">
            <div className="overflow-hidden rounded-lg bg-surface-2">
              <div className="h-[140px] w-full bg-surface-3">
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- imagem do item compartilhado
                  <img src={imageUrl} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="flex flex-col gap-0.5 px-2.5 py-2">
                <span className="line-clamp-2 text-[13px] leading-[18px] font-bold text-text-strong">
                  {title}
                </span>
                {description && (
                  <span className="line-clamp-2 text-xs leading-4 text-text-2">{description}</span>
                )}
                {siteHost && <span className="text-[11px] text-text-muted">{siteHost}</span>}
              </div>
            </div>
            <p className="mx-1.5 mt-1.5 mb-1.5 text-[13px] leading-[18px] break-all text-text">
              Olha isso! <span className="text-link">{siteHost ? `${siteHost}${path}` : path}</span>
            </p>
          </div>
        </div>
        <p className="text-xs leading-[18px] text-text-muted">
          Imagem, título e endereço vêm do item compartilhado. Quem abre não precisa ter conta.
        </p>
      </section>
      {isGuest && (
        <section className="flex flex-col gap-2.5 rounded-2xl bg-navy p-5">
          <WordMark className="text-lg !text-white" />
          <p className="text-[13px] leading-5 text-white">
            Produtos, serviços e ofertas das lojas do seu bairro. Você fala direto com a loja, sem
            intermediário.
          </p>
          <Link
            href={routes.cadastro}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-extrabold text-on-accent hover:bg-accent-hover"
          >
            Criar conta grátis
          </Link>
        </section>
      )}
    </>
  );
}

/** Convite discreto para visitante, abaixo das ações (artboard: faixa âmbar com sino). */
export function CreateAccountNote({ children }: { children: ReactNode }) {
  const { isGuest } = useSession();
  if (!isGuest) return null;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-accent-border bg-accent-soft p-4 sm:flex-row sm:items-center sm:gap-3.5">
      <Bell className="size-6 shrink-0 text-accent-text" aria-hidden />
      <p className="flex-1 text-[13px] leading-5 text-accent-text">{children}</p>
      <Link
        href={routes.cadastro}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-extrabold whitespace-nowrap text-on-accent hover:bg-accent-hover"
      >
        Criar conta
      </Link>
    </div>
  );
}

/** Cartão compacto do artboard (foto de 160 px, nome, preço e linha de contexto). */
export function SharedItemCard({ item }: { item: SearchItem }) {
  const meta = [item.profile?.name, item.distanceKm !== null ? formatKm(item.distanceKm) : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      href={resultHref(item)}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:-translate-y-px hover:border-border-strong"
    >
      <span className="block h-40 bg-surface-3">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem do item
          <img src={item.imageUrl} alt="" className="size-full object-cover" />
        )}
      </span>
      <span className="flex flex-col gap-1 px-3.5 pt-3 pb-3.5">
        <span className="text-sm leading-5 font-semibold text-text">{item.title}</span>
        {item.price ? (
          <span className="text-base font-extrabold text-text-strong">
            {formatMoney(item.price.amountCents)}
          </span>
        ) : (
          <span className="text-sm font-semibold text-text-muted">Preço não informado</span>
        )}
        {meta && <span className="text-xs text-text-muted">{meta}</span>}
      </span>
    </Link>
  );
}

export function ItemGrid({ title, aside, items }: { title: string; aside?: string; items: SearchItem[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl leading-7 font-bold text-text-strong">{title}</h2>
        {aside && <span className="text-[13px] text-text-muted">{aside}</span>}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <li key={`${it.type}-${it.id}`}>
            <SharedItemCard item={it} />
          </li>
        ))}
      </ul>
    </section>
  );
}
