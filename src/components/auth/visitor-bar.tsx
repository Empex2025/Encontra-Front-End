"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/hooks/use-session";
import { routes } from "@/lib/routes";

/** Faixa azul no topo para quem está explorando sem conta. */
export function VisitorBar() {
  const { isGuest, isError } = useSession();
  const pathname = usePathname();
  // Servidor fora do ar: não dá para saber se a pessoa tem sessão, então não afirmamos "visitante".
  if (!isGuest || isError) return null;
  const back = encodeURIComponent(pathname);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-navy-700 px-4 py-2 text-sm text-white">
      <p>
        Você está explorando como visitante. Crie sua conta grátis para salvar, seguir e conversar.
        {pathname === routes.home && (
          <>
            {" "}
            <Link href="/visitante" className="font-semibold underline">
              O que muda?
            </Link>
          </>
        )}
      </p>
      <div className="flex gap-2">
        <Link
          href={`${routes.entrar}?voltar=${back}`}
          className="inline-flex h-9 items-center rounded-lg px-3 font-semibold hover:bg-white/10"
        >
          Entrar
        </Link>
        <Link
          href={`${routes.cadastro}?voltar=${back}`}
          className="inline-flex h-9 items-center rounded-lg bg-amber px-3 font-bold text-navy hover:bg-amber-400"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
