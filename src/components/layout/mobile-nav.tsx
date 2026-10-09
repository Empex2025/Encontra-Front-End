"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/components/ui/cn";
import { CountBadge } from "@/components/ui/count-badge";
import { useUnreadCount } from "@/hooks/use-session";

import { activeIdFor, NAV, NAV_MOBILE } from "./nav-items";

const SHORT: Record<string, string> = { ofertas: "Ofertas", favoritos: "Favoritos" };

/** Barra de navegação inferior (celular e tablet). */
export function MobileNav() {
  const active = activeIdFor(usePathname());
  const unread = useUnreadCount();
  const items = NAV.filter((i) => NAV_MOBILE.includes(i.id));

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const on = item.id === active;
          const Icon = item.icon;
          const n = item.badge === "conversations" ? (unread.data?.conversations ?? 0) : 0;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                  on ? "text-text-strong" : "text-text-subtle",
                )}
              >
                <Icon className="size-6" aria-hidden />
                <span>{SHORT[item.id] ?? item.label}</span>
                {on && <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-accent" />}
                <CountBadge
                  count={n}
                  label="não lidas"
                  className="absolute top-2 left-1/2 ml-1 h-4 min-w-4 text-[10px]"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
