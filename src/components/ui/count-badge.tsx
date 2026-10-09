import { cn } from "./cn";

/** Bolinha de contagem (não lidas). Some quando é zero; acima de 99 mostra "99+". */
export function CountBadge({
  count,
  label,
  className,
}: {
  count: number;
  label: string;
  className?: string;
}) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] leading-none font-bold text-white",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only"> {label}</span>
    </span>
  );
}
