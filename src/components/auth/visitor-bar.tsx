"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSession } from "@/hooks/use-session";
import { routes } from "@/lib/routes";

/** Faixa azul no alto do conteúdo (protótipo: cartão de 14 px de raio) para quem está explorando sem conta. */
export function VisitorBar() {
  const { isGuest, isError } = useSession();
  const pathname = usePathname();
  // Servidor fora do ar: não dá para saber se a pessoa tem sessão, então não afirmamos "visitante".
  if (!isGuest || isError) return null;
  const back = encodeURIComponent(pathname);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-[14px] bg-navy px-[18px] py-3 text-white">
      <p className="text-sm">
        Você está explorando como <b>visitante</b>.{" "}
        <span className="text-[13px] text-navy-200">
          Crie sua conta grátis para salvar, seguir e conversar.
        </span>{" "}
        {pathname === routes.home && (
          <Link href="/visitante" className="text-[13px] font-bold text-amber-400 hover:underline">
            O que muda?
          </Link>
        )}
      </p>
      <div className="ml-auto flex gap-2">
        <Link
          href={`${routes.entrar}?voltar=${back}`}
          className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold hover:bg-white/10"
        >
          Entrar
        </Link>
        <Link
          href={`${routes.cadastro}?voltar=${back}`}
          className="inline-flex h-9 items-center rounded-lg bg-amber px-3 text-sm font-bold text-navy hover:bg-amber-400"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
