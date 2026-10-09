import Image from "next/image";
import Link from "next/link";

import { routes } from "@/lib/routes";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href={routes.home}
      aria-label="EncontraÊ — início"
      className="flex shrink-0 items-center gap-2 rounded-lg"
    >
      <Image
        src="/brand/simbolo.png"
        alt=""
        width={44}
        height={44}
        className="size-10 rounded-xl lg:size-11"
        priority
      />
      {!compact && (
        <span className="font-brand text-2xl leading-8 font-bold text-white">
          Encontra<span className="text-[28px] text-amber">Ê</span>
        </span>
      )}
    </Link>
  );
}
