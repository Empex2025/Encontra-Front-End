"use client";

import { LogIn, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/hooks/use-session";
import { routes } from "@/lib/routes";

import { HeaderSearch } from "./header-search";
import { LocationPicker } from "./location-picker";
import { Logo } from "./logo";

/** Telas que têm a própria busca em destaque não repetem a busca do cabeçalho. */
const OWN_SEARCH: ReadonlySet<string> = new Set([routes.home, routes.explorar]);

export function SiteHeader() {
  const pathname = usePathname();
  const { me, isLoading } = useSession();
  const showSearch = !OWN_SEARCH.has(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-header-border bg-header">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-[84px] lg:gap-4 lg:px-10">
        <div className="flex min-w-0 items-center gap-1 lg:gap-4">
          <span className="shrink-0 sm:hidden">
            <Logo compact />
          </span>
          <span className="hidden shrink-0 sm:block">
            <Logo />
          </span>
          <LocationPicker />
        </div>

        {showSearch && <HeaderSearch className="mx-auto hidden w-full max-w-xl min-w-0 lg:block" />}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {showSearch && (
            <Link
              href={routes.explorar}
              aria-label="Buscar"
              className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden"
            >
              <Search className="size-5" aria-hidden />
            </Link>
          )}
          {!isLoading &&
            (me ? (
              <Link
                href={routes.conta}
                className="flex h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-white hover:bg-white/10 sm:px-3"
              >
                <User className="size-5" aria-hidden />
                <span className="hidden sm:inline">Minha Conta</span>
                <span className="sr-only sm:hidden">Minha Conta</span>
              </Link>
            ) : (
              <Link
                href={routes.entrar}
                className="flex h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-on-accent hover:bg-accent-hover"
              >
                <LogIn className="size-4" aria-hidden />
                Entrar
              </Link>
            ))}
        </div>
      </div>
    </header>
  );
}
