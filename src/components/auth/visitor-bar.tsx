"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/hooks/use-session";
import { routes } from "@/lib/routes";

/**
 * Faixa azul de visitante no topo do conteúdo (artboards HomeV2 e Visitante): fica no fluxo da página, acima do
 * título, para nunca cobrir conteúdo. Some quando há sessão ou quando não dá para confirmar a sessão.
 */
export function VisitorBar() {
  const { isGuest, isError } = useSession();
  const pathname = usePathname();
  // Servidor fora do ar: não dá para saber se a pessoa tem sessão, então não afirmamos "visitante".
  if (!isGuest || isError) return null;
  const back = encodeURIComponent(pathname);
  return (
    <div
      role="region"
      aria-label="Modo visitante"
      className="mb-6 flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-[14px] bg-navy px-[18px] py-3 text-white"
    >
      <span className="text-sm">
        Você está explorando como <b>visitante</b>.
      </span>
      <span className="text-[13px] text-navy-200">
        Crie sua conta grátis para salvar, seguir e conversar.
      </span>
      {pathname === routes.home && (
        <Link
          href="/visitante"
          className="inline-flex min-h-6 items-center text-[13px] font-bold text-amber-400 hover:underline"
        >
          O que muda?
        </Link>
      )}
      <div className="flex w-full gap-2 sm:ml-auto sm:w-auto sm:gap-3.5">
        <Link
          href={`${routes.entrar}?voltar=${back}`}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-white/50 px-3.5 text-[13px] font-bold hover:bg-white/10 sm:h-9 sm:flex-none"
        >
          Entrar
        </Link>
        <Link
          href={`${routes.cadastro}?voltar=${back}`}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-amber px-3.5 text-[13px] font-extrabold text-navy hover:bg-amber-400 sm:h-9 sm:flex-none"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
