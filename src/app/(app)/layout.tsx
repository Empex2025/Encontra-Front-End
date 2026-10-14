import { CookieNotice } from "@/components/home/cookie-notice";
import { VisitorBar } from "@/components/auth/visitor-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/** Estrutura das telas com menu: cabeçalho, menu lateral (barra inferior no celular), conteúdo e rodapé. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <VisitorBar />
      <div className="flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
          <main
            id="conteudo"
            tabIndex={-1}
            className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-8"
          >
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
