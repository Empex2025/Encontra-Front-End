import { cn } from "@/components/ui/cn";

/** "Esporte M Loja" → "EM"; "Maria" → "M". */
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : (parts[0]?.slice(0, 2) ?? "?");
  return letters.toUpperCase();
}

/** Avatar arredondado; sem foto mostra a inicial. `ring`: borda de destaque (ao vivo, segue). */
export function Avatar({
  name,
  url,
  size = 48,
  ring,
  className,
  shape = "squircle",
  tone = "neutral",
}: {
  name: string;
  url: string | null;
  size?: number;
  ring?: "live" | "following" | "default";
  className?: string;
  /** `circle`: redondo (tela do produto e cards); `squircle`: cantos arredondados (padrão). */
  shape?: "squircle" | "circle";
  /** `navy`: fundo azul-marinho com as iniciais em branco (como no protótipo). */
  tone?: "neutral" | "navy";
}) {
  const ringCls =
    ring === "live"
      ? "ring-2 ring-danger"
      : ring === "following"
        ? "ring-2 ring-accent"
        : ring === "default"
          ? "ring-2 ring-link"
          : "";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden font-bold ring-offset-2 ring-offset-surface",
        tone === "navy" ? "bg-navy text-white" : "bg-surface-3 text-text-2",
        shape === "circle" ? "rounded-full" : "rounded-[28%]",
        ringCls,
        className,
      )}
      style={{ width: size, height: size, fontSize: tone === "navy" ? size * 0.3 : size / 2.4 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>
          {tone === "navy" ? initialsOf(name) : name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      )}
    </span>
  );
}
