import { cn } from "@/components/ui/cn";

/** Avatar arredondado; sem foto mostra a inicial. `ring`: borda de destaque (ao vivo, segue). */
export function Avatar({
  name,
  url,
  size = 48,
  ring,
  className,
}: {
  name: string;
  url: string | null;
  size?: number;
  ring?: "live" | "following" | "default";
  className?: string;
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
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[28%] bg-surface-3 font-bold text-text-2 ring-offset-2 ring-offset-surface",
        ringCls,
        className,
      )}
      style={{ width: size, height: size, fontSize: size / 2.4 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{name.trim().charAt(0).toUpperCase() || "?"}</span>
      )}
    </span>
  );
}
