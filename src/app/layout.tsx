import "./globals.css";

import type { Metadata, Viewport } from "next";

import { themeInitScript } from "@/lib/theme";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: { default: "EncontraÊ", template: "%s · EncontraÊ" },
  description: "Produtos, serviços e ofertas das lojas do seu bairro. Você fala direto com a loja.",
  icons: { icon: "/brand/simbolo.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00154f" },
    { media: "(prefers-color-scheme: dark)", color: "#081530" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#conteudo"
          className="sr-only z-[100] rounded-lg bg-accent px-4 py-3 font-bold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
