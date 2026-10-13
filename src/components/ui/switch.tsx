import { cn } from "./cn";

/** Chave liga/desliga (role="switch"). `locked` mostra ligada e sem poder mudar. */
export function Switch({
  checked,
  onChange,
  label,
  hint,
  locked,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  locked?: boolean;
  disabled?: boolean;
}) {
  const off = locked || disabled;
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="font-semibold text-text-strong">{label}</p>
        {hint && <p className="text-sm text-text-muted">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={off}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
          checked ? "bg-primary" : "bg-border-strong",
          off && "opacity-60",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-6 rounded-full bg-surface shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
