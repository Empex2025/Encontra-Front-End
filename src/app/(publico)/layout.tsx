import { CookieNotice } from "@/components/home/cookie-notice";
import { PublicFooter, PublicHeader } from "@/components/public/public-shell";

/**
 * Páginas abertas por link compartilhado (/o, /listas): sem menu lateral, só marca, entrada e rodapé,
 * como no artboard "Compartilhado". Quem abre o link não precisa ter conta.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <PublicHeader />
      {children}
      <PublicFooter />
      <CookieNotice />
    </>
  );
}
