"use client";

import { Ellipsis } from "lucide-react";
import { usePathname } from "next/navigation";
import { useId, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { CountBadge } from "@/components/ui/count-badge";
import { useDismiss } from "@/components/ui/use-dismiss";
import { useUnreadCount } from "@/hooks/use-session";

import { NAV_GUARDS } from "@/lib/domain/auth-actions";

import { GuardedLink } from "./guarded-link";
import { activeIdFor, NAV, NAV_BOTTOM, NAV_MOBILE } from "./nav-items";

const SHORT: Record<string, string> = { ofertas: "Ofertas", favoritos: "Favoritos" };

/**
 * Barra de navegação inferior (celular e tablet). Os 5 atalhos principais ficam na barra; o resto do menu lateral
 * (Comparações, Notificações, Minha Conta, Configurações) abre em "Mais", para nenhuma tela ficar sem caminho.
 */
export function MobileNav() {
  const pathname = usePathname();
  const active = activeIdFor(pathname);
  const unread = useUnreadCount();
  const items = NAV.filter((i) => NAV_MOBILE.includes(i.id));
  const more = [...NAV.filter((i) => !NAV_MOBILE.includes(i.id)), ...NAV_BOTTOM];
  const moreActive = more.some((i) => i.id === active);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const close = () => setOpen(false);
  useDismiss(ref, open, close);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div ref={ref} className="relative">
        {open && (
          <ul
            id={menuId}
            aria-label="Mais opções"
            className="absolute right-2 bottom-full mb-2 flex w-60 flex-col rounded-2xl border border-border bg-surface p-2 shadow-pop"
          >
            {more.map((item) => {
              const Icon = item.icon;
              const n = item.badge === "notifications" ? (unread.data?.notifications ?? 0) : 0;
              return (
                <li key={item.id}>
                  <GuardedLink
                    guard={NAV_GUARDS[item.id]}
                    href={item.href}
                    onClick={close}
                    aria-current={item.id === active ? "page" : undefined}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                      item.id === active
                        ? "bg-selected font-bold text-text-strong"
                        : "text-text hover:bg-surface-2",
                    )}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden />
                    <span className="truncate">{item.label}</span>
                    <CountBadge count={n} label="não lidas" className="ml-auto" />
                  </GuardedLink>
                </li>
              );
            })}
          </ul>
        )}
        <ul className="mx-auto grid max-w-lg grid-cols-6">
          {items.map((item) => {
            const on = item.id === active;
            const Icon = item.icon;
            const n = item.badge === "conversations" ? (unread.data?.conversations ?? 0) : 0;
            return (
              <li key={item.id}>
                <GuardedLink
                  guard={NAV_GUARDS[item.id]}
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
                </GuardedLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={open ? menuId : undefined}
              onClick={() => setOpen((o) => !o)}
              className={cn(
                "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                open || moreActive ? "text-text-strong" : "text-text-subtle",
              )}
            >
              <Ellipsis className="size-6" aria-hidden />
              <span>Mais</span>
              {moreActive && (
                <span aria-hidden className="absolute top-0 h-[3px] w-8 rounded-b-full bg-accent" />
              )}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
