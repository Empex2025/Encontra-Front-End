import { CookieNotice } from "@/components/home/cookie-notice";
import { VisitorBar } from "@/components/auth/visitor-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Estrutura das telas com menu, como no protótipo: cabeçalho de 84 px, faixa de ícones à esquerda que abre
 * por cima do conteúdo (barra inferior no celular), conteúdo com até 1280 px e rodapé azul.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <VisitorBar />
      <Sidebar />
      <div className="flex min-h-[calc(100dvh-84px)] min-w-0 flex-col pb-16 lg:pb-0">
        <main
          id="conteudo"
          tabIndex={-1}
          className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-[max(80px,calc((100vw-1280px)/2))] lg:pt-5 lg:pb-20"
        >
          {children}
        </main>
        <SiteFooter />
      </div>
      <MobileNav />
      <CookieNotice />
    </>
  );
}
