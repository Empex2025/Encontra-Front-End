import Link from "next/link";

import { cn } from "./cn";

/**
 * Estado vazio no formato do protótipo: cartão branco com sombra leve, título, orientação e um botão.
 * `action` pode ser um link (`href`) ou um botão (`onClick`).
 */
export function EmptyCard({
  title,
  hint,
  icon,
  href,
  onClick,
  cta,
  className,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  cta?: string;
  className?: string;
}) {
  const btn =
    "inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-2xl bg-surface px-4 py-12 text-center shadow-card",
        className,
      )}
    >
      {icon}
      <p className="text-base font-bold text-text-strong">{title}</p>
      {hint && <p className="max-w-md text-sm leading-[21px] text-text-muted">{hint}</p>}
      {cta && href && (
        <Link href={href} className={btn}>
          {cta}
        </Link>
      )}
      {cta && !href && onClick && (
        <button type="button" onClick={onClick} className={btn}>
          {cta}
        </button>
      )}
    </div>
  );
}
