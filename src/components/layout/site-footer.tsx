import Link from "next/link";

import { routes } from "@/lib/routes";

const HOW = [
  { label: "Como funciona", href: `${routes.institucional}/sobre` },
  { label: "Explorar", href: routes.explorar },
] as const;

const SUPPORT = [
  { label: "Central de Ajuda", href: routes.ajuda },
  { label: "Termos de Uso", href: `${routes.institucional}/termos` },
  { label: "Privacidade", href: `${routes.institucional}/privacidade` },
  { label: "Cookies", href: `${routes.institucional}/cookies` },
  { label: "Contato", href: `${routes.ajuda}?aba=contato` },
] as const;

/**
 * Endereços que ainda não existem não viram link: "Área do Lojista" e as redes sociais só aparecem quando a
 * hospedagem define as variáveis abaixo. Itens do protótipo marcados como "em breve" (Pontos e Recompensas,
 * Lojas Parceiras) ficam de fora até existirem.
 */
const MERCHANT_URL = process.env.NEXT_PUBLIC_MERCHANT_URL;
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL;

const linkCls = "text-sm leading-5 text-navy-200 hover:text-white hover:underline";

/** Rodapé azul igual em todas as telas com menu (protótipo: 384 px, colunas "Como Funciona" e "Suporte"). */
export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-10 bg-header px-4 pt-10 pb-8 text-navy-200 sm:px-6 lg:px-10 lg:pt-[60px] lg:pb-10 xl:px-20">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 md:flex-row md:justify-between">
        <div className="flex w-full max-w-[300px] flex-col gap-5">
          <span className="font-brand text-[32px] leading-[48px] font-bold text-white">
            Encontra<span className="text-amber">Ê</span>
          </span>
          <p className="text-sm leading-5">
            Descubra produtos, serviços, ofertas e lugares perto de você, e fale direto com quem vende.
          </p>
          {(INSTAGRAM_URL || FACEBOOK_URL) && (
            <div className="flex gap-4">
              {INSTAGRAM_URL && (
                <a href={INSTAGRAM_URL} aria-label="Instagram" className="text-white hover:text-amber">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>
              )}
              {FACEBOOK_URL && (
                <a href={FACEBOOK_URL} aria-label="Facebook" className="text-white hover:text-amber">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-10 sm:flex-row sm:gap-[120px] md:ml-auto lg:gap-[200px]">
          <nav aria-label="Como funciona" className="flex flex-col gap-4">
            <h2 className="text-base leading-6 font-bold text-white">Como Funciona</h2>
            {HOW.map((l) => (
              <Link key={l.label} href={l.href} className={linkCls}>
                {l.label}
              </Link>
            ))}
            {MERCHANT_URL && (
              <a href={MERCHANT_URL} className={linkCls}>
                Área do Lojista
              </a>
            )}
          </nav>
          <nav aria-label="Suporte" className="flex flex-col gap-4">
            <h2 className="text-base leading-6 font-bold text-white">Suporte</h2>
            {SUPPORT.map((l) => (
              <Link key={l.label} href={l.href} className={linkCls}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-2 border-t border-header-border pt-6 text-sm leading-5 text-navy-300 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} EncontraÊ. Todos os direitos reservados.</span>
        <span>Desenvolvido para aproximar você do comércio local.</span>
      </div>
    </footer>
  );
}
