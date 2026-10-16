import Link from "next/link";

import { routes } from "@/lib/routes";

const HOW = [
  { label: "Como funciona", href: `${routes.institucional}/sobre` },
  { label: "Explorar", href: routes.explorar },
];
const SUPPORT = [
  { label: "Central de Ajuda", href: routes.ajuda },
  { label: "Termos de Uso", href: `${routes.institucional}/termos` },
  { label: "Privacidade", href: `${routes.institucional}/privacidade` },
  { label: "Cookies", href: `${routes.institucional}/cookies` },
  { label: "Contato", href: routes.ajuda },
];

const linkCls = "text-sm leading-5 text-[#B3BBCF] hover:text-white hover:underline";

/** Rodapé azul do protótipo: marca, "Como funciona" e "Suporte". Sem links que não existem. */
export function SiteFooter() {
  return (
    <footer className="bg-navy px-4 pt-10 pb-8 text-[#B3BBCF] sm:px-6 lg:px-[max(80px,calc((100vw-1280px)/2))] lg:pt-[60px] lg:pb-10">
      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div className="flex max-w-[300px] flex-col gap-5">
          <span className="font-brand text-[32px] leading-[48px] font-bold text-white">
            Encontra<span className="text-amber">Ê</span>
          </span>
          <p className="text-sm leading-5">
            Descubra produtos, serviços, ofertas e lugares perto de você, e fale direto com quem vende.
          </p>
        </div>
        <nav aria-label="Como funciona" className="flex flex-col gap-4 md:mr-[200px] md:ml-auto">
          <h2 className="text-base leading-6 font-bold text-white">Como Funciona</h2>
          {HOW.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls}>
              {l.label}
            </Link>
          ))}
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
      <div className="mt-10 flex flex-col gap-2 border-t border-[#26397F] pt-6 text-sm leading-5 text-[#808DAF] md:flex-row md:justify-between">
        <span>© {new Date().getFullYear()} EncontraÊ. Todos os direitos reservados.</span>
        <span>Desenvolvido para aproximar você do comércio local.</span>
      </div>
    </footer>
  );
}
