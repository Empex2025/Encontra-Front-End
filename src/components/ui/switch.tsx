import { cn } from "./cn";

/**
 * Chave liga/desliga (role="switch"), no formato do protótipo: linha com título 15/600, apoio de 13 px e
 * chave 44×26. Verde ligada, cinza desligada, azul-acinzentada quando fixa (`locked`).
 * `bare` devolve só a chave (para quem monta a linha por conta própria).
 */
export function Switch({
  checked,
  onChange,
  label,
  hint,
  locked,
  disabled,
  bare,
  onLocked,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  locked?: boolean;
  disabled?: boolean;
  bare?: boolean;
  /** Chamado ao tocar numa chave fixa (para explicar por que ela não muda). */
  onLocked?: () => void;
}) {
  const off = locked || disabled;
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={off || undefined}
      onClick={() => (locked ? onLocked?.() : !off && onChange(!checked))}
      className={cn(
        "flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        locked ? "bg-navy-300" : checked ? "bg-success" : "bg-border-strong",
        locked ? "cursor-not-allowed" : disabled && "cursor-not-allowed opacity-60",
        checked ? "justify-end" : "justify-start",
      )}
    >
      <span className="size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
    </button>
  );
  if (bare) return control;
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 py-3.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-[15px] font-semibold text-text">{label}</p>
        {hint && <p className="text-[13px] leading-[18px] text-text-subtle">{hint}</p>}
      </div>
      {control}
    </div>
  );
}
