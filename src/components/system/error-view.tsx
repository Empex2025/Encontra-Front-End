"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

import { SystemCard, sysBtnOutline, sysBtnPrimary } from "@/components/system/system-card";
import { routes } from "@/lib/routes";

/** 500 (Estados.dc.html › Erro ao carregar). O "ref." é o digest do erro: some se o Next não gerar um. */
export function ErrorView({ digest, onRetry }: { digest?: string; onRetry: () => void }) {
  return (
    <SystemCard
      tone="danger"
      icon={<TriangleAlert className="size-10" aria-hidden />}
      title="Algo deu errado do nosso lado"
      text="Não conseguimos carregar esta página agora. Não é você, é a gente. Tente de novo em alguns segundos."
      foot={
        <p className="mt-1 text-xs text-text-subtle">
          Código do erro: 500{digest ? ` · ref. ${digest}` : ""}
        </p>
      }
    >
      <div className="mt-2 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Link href={`${routes.ajuda}?aba=contato`} className={sysBtnOutline}>
          Falar com o suporte
        </Link>
        <button type="button" onClick={onRetry} className={sysBtnPrimary}>
          Tentar de novo
        </button>
      </div>
    </SystemCard>
  );
}
