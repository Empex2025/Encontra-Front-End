import { Construction } from "lucide-react";

/** Tela ainda não implementada: mostra o nome e para que servirá. Some conforme cada fluxo é codado. */
export function ScreenPending({ title, purpose }: { title: string; purpose: string }) {
  return (
    <section
      aria-labelledby="t"
      className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-16 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
        <Construction className="size-7" aria-hidden />
      </span>
      <h1 id="t" className="text-2xl font-bold text-text-strong sm:text-[32px] sm:leading-10">
        {title}
      </h1>
      <p className="text-base text-text-muted">{purpose}</p>
      <p className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-text-subtle">
        Em construção
      </p>
    </section>
  );
}
