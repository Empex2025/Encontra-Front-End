"use client";

import { ChevronsLeft, ChevronsRight, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/components/ui/cn";
import { CountBadge } from "@/components/ui/count-badge";
import { useUnreadCount } from "@/hooks/use-session";
import { useTheme } from "@/hooks/use-theme";

import { activeIdFor, NAV, NAV_BOTTOM, type NavItem } from "./nav-items";

const COLLAPSE_KEY = "encontrae_menu_recolhido";

export function Sidebar() {
  const pathname = usePathname();
  const active = activeIdFor(pathname);
  const unread = useUnreadCount();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preferência só existe no navegador
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {}
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {}
  };

  const countOf = (item: NavItem) =>
    item.badge === "conversations"
      ? (unread.data?.conversations ?? 0)
      : item.badge === "notifications"
        ? (unread.data?.notifications ?? 0)
        : 0;

  const renderItem = (item: NavItem) => {
    const on = item.id === active;
    const Icon = item.icon;
    const n = countOf(item);
    return (
      <li key={item.id}>
        <Link
          href={item.href}
          aria-current={on ? "page" : undefined}
          title={collapsed ? item.label : undefined}
          className={cn(
            "relative flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium",
            on ? "bg-selected font-bold text-text-strong" : "text-text-muted hover:bg-surface-2",
          )}
        >
          <Icon className="size-5 shrink-0" aria-hidden />
          {collapsed ? (
            n > 0 && (
              <CountBadge
                count={n}
                label="não lidas"
                className="absolute top-1 left-7 h-4 min-w-4 text-[10px]"
              />
            )
          ) : (
            <>
              <span className="truncate">{item.label}</span>
              <CountBadge count={n} label="não lidas" className="ml-auto" />
            </>
          )}
        </Link>
        {!collapsed && on && item.subs && (
          <ul className="mt-1 ml-11 flex flex-col gap-0.5 border-l border-border pl-3">
            {item.subs.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex h-9 items-center rounded-md px-2 text-sm text-text-muted hover:bg-surface-2"
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

  return (
    <aside
      aria-label="Menu lateral"
      className={cn(
        "sticky top-16 hidden h-[calc(100dvh-64px)] shrink-0 flex-col border-r border-border bg-surface py-4 transition-[width] duration-200 lg:top-[84px] lg:flex lg:h-[calc(100dvh-84px)]",
        collapsed ? "w-[76px] px-3" : "w-64 px-4",
      )}
    >
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1">{NAV.map(renderItem)}</ul>
      </nav>
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <ul className="flex flex-col gap-1">{NAV_BOTTOM.map(renderItem)}</ul>
        <button
          type="button"
          role="switch"
          aria-checked={theme === "dark"}
          onClick={toggle}
          title={collapsed ? "Modo escuro" : undefined}
          className="flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium text-text-muted hover:bg-surface-2"
        >
          {theme === "dark" ? (
            <Sun className="size-5 shrink-0" aria-hidden />
          ) : (
            <Moon className="size-5 shrink-0" aria-hidden />
          )}
          {!collapsed && (
            <>
              <span>Modo escuro</span>
              <span
                aria-hidden
                className={cn(
                  "relative ml-auto h-5 w-9 rounded-full transition-colors",
                  theme === "dark" ? "bg-accent" : "bg-border-strong",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-4 rounded-full bg-white shadow-card transition-[left]",
                    theme === "dark" ? "left-[18px]" : "left-0.5",
                  )}
                />
              </span>
            </>
          )}
          {collapsed && <span className="sr-only">Modo escuro</span>}
        </button>
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="flex h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium text-text-subtle hover:bg-surface-2"
        >
          {collapsed ? (
            <ChevronsRight className="size-5" aria-hidden />
          ) : (
            <ChevronsLeft className="size-5" aria-hidden />
          )}
          {!collapsed && <span>Recolher menu</span>}
        </button>
      </div>
    </aside>
  );
}
