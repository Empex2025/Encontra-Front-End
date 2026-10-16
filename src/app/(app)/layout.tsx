import { CookieNotice } from "@/components/home/cookie-notice";
import { VisitorBar } from "@/components/auth/visitor-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Estrutura das telas com menu (igual em todos os artboards do protótipo): cabeçalho de 84 px, menu lateral que flutua
 * sobre o conteúdo (72 px recolhido), conteúdo com 80 px de margem em 1440 px, rodapé azul de largura total.
 * No celular o menu vira a barra inferior.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
          <main
            id="conteudo"
            tabIndex={-1}
            className="flex-1 px-4 py-6 outline-none sm:px-6 lg:pt-6 lg:pr-10 lg:pb-20 lg:pl-24 xl:px-20"
          >
            <div className="mx-auto w-full max-w-[1280px]">
              <VisitorBar />
            </div>
            {children}
          </main>
          <SiteFooter />
        </div>
      </div>
      <MobileNav />
      <CookieNotice />
    </>
  );
}
