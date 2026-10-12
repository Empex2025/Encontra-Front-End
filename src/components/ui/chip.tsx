import { cn } from "./cn";

type ChipProps = {
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: "md" | "sm";
  leading?: React.ReactNode;
};

/** Pílula de filtro com contagem (lentes, tipo, onde atende, serviço…). */
export function Chip({ label, count, selected, onClick, disabled, size = "md", leading }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border font-semibold whitespace-nowrap transition-colors disabled:opacity-40",
        size === "md" ? "h-10 px-4 text-sm" : "h-9 px-3 text-[13px]",
        selected
          ? "border-primary bg-primary text-on-primary"
          : "border-border bg-surface text-text-2 hover:border-navy-300",
      )}
    >
      {leading}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
            selected ? "bg-accent text-on-accent" : "bg-surface-2 text-text-muted",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
