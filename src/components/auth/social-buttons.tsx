import { cn } from "@/components/ui/cn";

const NOTE = "Entrar com Google ou Apple ainda não está disponível.";

/**
 * Botões "Google" e "Apple" do protótipo (Entrar e convite do modo visitante).
 * Decisão de produto 7: o login social não existe na 1ª versão e o back-end não tem a rota; por isso os botões
 * aparecem desabilitados, com a explicação logo abaixo, em vez de um clique que não faz nada.
 */
export function SocialButtons({ compact, className }: { compact?: boolean; className?: string }) {
  const btn = cn(
    "flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border bg-surface text-sm font-semibold text-text-strong opacity-60",
    compact ? "h-11 border-border" : "h-11 border-primary dark:border-border-strong",
  );
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled aria-describedby="social-note" className={btn}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.2 3.3v2.75h3.55c2.08-1.92 3.25-4.74 3.25-8.08z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.75c-.99.66-2.25 1.06-3.73 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.12A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.12V7.04H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.96l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          Google
        </button>
        <button type="button" disabled aria-describedby="social-note" className={btn}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="fill-current">
            <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.64.8-3.33.8-.69 0-1.74-.78-2.87-.76a4.24 4.24 0 0 0-3.58 2.18c-1.53 2.65-.39 6.57 1.1 8.72.73 1.05 1.6 2.23 2.73 2.19 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.07 2.65-2.13a9.4 9.4 0 0 0 1.2-2.47 3.83 3.83 0 0 1-2.3-3.47zM14.2 6.15c.6-.73 1.01-1.75.9-2.76-.87.04-1.92.58-2.54 1.31-.56.65-1.05 1.68-.92 2.67.97.08 1.96-.49 2.56-1.22z" />
          </svg>
          Apple
        </button>
      </div>
      <p id="social-note" className="text-center text-xs leading-4 text-text-subtle">
        {NOTE}
      </p>
    </div>
  );
}
