import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "./cn";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "className"> & {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  hintTone?: "neutral" | "ok" | "bad";
  className?: string;
};

const inputCls = (error?: string) =>
  cn(
    "h-12 w-full rounded-lg border bg-surface px-3 text-base text-text outline-none placeholder:text-text-subtle focus:border-primary focus:ring-2 focus:ring-focus/40",
    error ? "border-danger" : "border-border-strong",
  );

/** Campo com rótulo, dica e erro (o erro só chega depois da 1ª tentativa de enviar). */
export function TextField({ label, error, hint, hintTone = "neutral", className, ...rest }: Props) {
  const id = useId();
  const msgId = `${id}-msg`;
  const message = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-bold text-text-strong">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={message ? msgId : undefined}
        className={inputCls(error)}
        {...rest}
      />
      {message && (
        <p
          id={msgId}
          role={error ? "alert" : undefined}
          className={cn(
            "text-sm",
            error || hintTone === "bad"
              ? "text-danger-text"
              : hintTone === "ok"
                ? "text-success-text"
                : "text-text-muted",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}

/** Campo de senha com botão "Mostrar senha"/"Ocultar senha". */
export function PasswordField({ label, error, hint, hintTone = "neutral", className, ...rest }: Props) {
  const id = useId();
  const msgId = `${id}-msg`;
  const [shown, setShown] = useState(false);
  const message = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-bold text-text-strong">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={shown ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={message ? msgId : undefined}
          className={cn(inputCls(error), "pr-12")}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={shown}
          className="absolute top-0 right-0 flex size-12 items-center justify-center text-text-muted hover:text-text-strong"
        >
          {shown ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      {message && (
        <p
          id={msgId}
          role={error ? "alert" : undefined}
          className={cn(
            "text-sm",
            error || hintTone === "bad"
              ? "text-danger-text"
              : hintTone === "ok"
                ? "text-success-text"
                : "text-text-muted",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
