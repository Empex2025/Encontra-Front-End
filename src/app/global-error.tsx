"use client";

import "./globals.css";

import { ErrorView } from "@/components/system/error-view";

/** Último recurso: erro no próprio layout raiz. Precisa trazer <html> e <body>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh antialiased">
        <main className="px-4 py-6">
          <ErrorView digest={error.digest} onRetry={reset} />
        </main>
      </body>
    </html>
  );
}
