"use client";

import { ChevronDown, ChevronsLeft, ChevronsRight, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/components/ui/cn";
import { CountBadge } from "@/components/ui/count-badge";
import { useUnreadCount } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";

import { activeIdFor, NAV, NAV_BOTTOM, type NavItem } from "./nav-items";

/** Preferência "menu fixado aberto" (neste navegador). O padrão do protótipo é recolhido, abrindo ao passar o mouse. */
const PIN_KEY = "encontrae_menu_fixado";

/** Largura recolhida (só ícones) e aberta, em px. */
const W_CLOSED = 72;
const W_OPEN = 280;

/**
 * Menu lateral (desktop). Igual ao protótipo: fica recolhido, só com ícones (72 px), e abre por cima do conteúdo
 * ao passar o mouse ou ao receber foco do teclado. "Fixar menu aberto" mantém o menu aberto e empurra o conteúdo.
 */
export function Sidebar() {
  const pathname = usePathname();
  const active = activeIdFor(pathname);
  const unread = useUnreadCount();
  const { theme, toggle } = useTheme();
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const open = pinned || hover;

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preferência só existe no navegador
      setPinned(window.localStorage.getItem(PIN_KEY) === "1");
    } catch {}
  }, []);

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    try {
      window.localStorage.setItem(PIN_KEY, next ? "1" : "0");
    } catch {}
  };

  const countOf = (item: NavItem) =>
    item.badge === "conversations"
      ? (unread.data?.conversations ?? 0)
      : item.badge === "notifications"
        ? (unread.data?.notifications ?? 0)
        : 0;

  const rowCls =
    "relative flex h-11 items-center gap-3 overflow-hidden rounded-lg px-3.5 text-sm whitespace-nowrap";

  const renderItem = (item: NavItem) => {
    const on = item.id === active;
    const Icon = item.icon;
    const n = countOf(item);
    return (
      <li key={item.id}>
        <Link
          href={item.href}
          aria-current={on ? "page" : undefined}
          title={open ? undefined : item.label}
          className={cn(
            rowCls,
            open ? "w-64" : "w-12",
            on ? "bg-selected font-bold text-text-strong" : "font-medium text-text-muted hover:bg-surface-2",
          )}
        >
          <span className="relative flex shrink-0">
            <Icon className="size-5" aria-hidden />
            {n > 0 && !open && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 size-2 rounded-full border-2 border-surface bg-danger"
              />
            )}
          </span>
          <span className={cn("flex-1 truncate transition-opacity", open ? "opacity-100" : "opacity-0")}>
            {item.label}
          </span>
          {n > 0 && !open && <span className="sr-only">{n} não lidas</span>}
          {open && <CountBadge count={n} label="não lidas" />}
          {open && item.subs && (
            <ChevronDown
              aria-hidden
              className={cn("size-4 shrink-0 transition-transform", on && "rotate-180")}
            />
          )}
        </Link>
        {open && on && item.subs && (
          <ul className="flex flex-col gap-0.5 py-0.5 pb-1.5 pl-[46px]">
            {item.subs.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex h-9 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap text-text-muted hover:bg-surface-2"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  const pinLabel = pinned ? "Recolher menu" : "Fixar menu aberto";

  return (
    <>
      {/* Menu fixado ocupa espaço; recolhido, ele flutua sobre o conteúdo (como no protótipo). */}
      <div
        aria-hidden
        className="hidden shrink-0 transition-[width] duration-200 lg:block"
        style={{ width: pinned ? W_OPEN - W_CLOSED : 0 }}
      />
      <aside
        aria-label="Menu lateral"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
        }}
        style={{ width: open ? W_OPEN : W_CLOSED }}
        className={cn(
          "fixed top-[84px] bottom-0 left-0 z-20 hidden overflow-hidden border-r border-border bg-surface transition-[width,box-shadow] duration-200 lg:block",
          open && !pinned && "shadow-pop",
        )}
      >
        <div className="flex h-full w-[280px] flex-col justify-between overflow-y-auto px-3 py-4">
          <nav aria-label="Navegação principal">
            <ul className="flex flex-col gap-1">{NAV.map(renderItem)}</ul>
          </nav>
          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <ul className="flex flex-col gap-1">{NAV_BOTTOM.map(renderItem)}</ul>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Modo escuro"
              title={open ? "Alternar tema" : "Modo escuro"}
              onClick={toggle}
              className={cn(rowCls, "font-medium text-text-muted hover:bg-surface-2", open ? "w-64" : "w-12")}
            >
              {theme === "dark" ? (
                <Sun className="size-5 shrink-0" aria-hidden />
              ) : (
                <Moon className="size-5 shrink-0" aria-hidden />
              )}
              <span className={cn("flex-1 text-left transition-opacity", open ? "opacity-100" : "opacity-0")}>
                Modo escuro
              </span>
              <span
                aria-hidden
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full transition-[background-color,opacity]",
                  theme === "dark" ? "bg-accent" : "bg-border-strong",
                  open ? "opacity-100" : "opacity-0",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white shadow-card transition-[left]",
                    theme === "dark" ? "left-[18px]" : "left-0.5",
                  )}
                />
              </span>
            </button>
            <button
              type="button"
              aria-pressed={pinned}
              aria-label={pinLabel}
              title={pinLabel}
              onClick={togglePin}
              className={cn(rowCls, "font-medium text-text-muted hover:bg-surface-2", open ? "w-64" : "w-12")}
            >
              {pinned ? (
                <ChevronsLeft className="size-5 shrink-0" aria-hidden />
              ) : (
                <ChevronsRight className="size-5 shrink-0" aria-hidden />
              )}
              <span className={cn("flex-1 text-left transition-opacity", open ? "opacity-100" : "opacity-0")}>
                {pinLabel}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
