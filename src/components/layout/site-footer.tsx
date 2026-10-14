import Link from "next/link";

import { routes } from "@/lib/routes";

const LINKS = [
  { label: "Como funciona", href: `${routes.institucional}/sobre` },
  { label: "Central de Ajuda", href: routes.ajuda },
  { label: "Termos de Uso", href: `${routes.institucional}/termos` },
  { label: "Privacidade", href: `${routes.institucional}/privacidade` },
  { label: "Cookies", href: `${routes.institucional}/cookies` },
];

/** Rodapé enxuto, igual em todas as telas com menu. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-6 text-sm text-text-muted sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Links do rodapé">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-text-strong hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>© {new Date().getFullYear()} EncontraÊ</p>
      </div>
    </footer>
  );
}
