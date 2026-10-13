import { BadgeCheck, MapPin, Star } from "lucide-react";
import Link from "next/link";

import { categoryById } from "@/lib/domain/categories";
import { firstName } from "@/lib/domain/validation";

import { AuthCard } from "./auth-card";

/** Etapa final: resumo do que foi configurado, com os dados reais gravados. */
export function RegisterPronto({
  name,
  phoneMasked,
  locationLabel,
  interestIds,
}: {
  name: string;
  phoneMasked: string;
  locationLabel: string;
  interestIds: string[];
}) {
  const interests = interestIds
    .map((id) => categoryById(id)?.name)
    .filter(Boolean)
    .join(", ");
  return (
    <AuthCard title={`Tudo pronto, ${firstName(name)}!`} subtitle="Sua conta foi criada.">
      <ul className="flex flex-col gap-3 text-base text-text-2">
        <li className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 size-5 shrink-0 text-success-text" aria-hidden />
          <span>
            Celular confirmado <span className="text-text-muted">({phoneMasked})</span>
          </span>
        </li>
        <li className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-link" aria-hidden />
          <span>{locationLabel}</span>
        </li>
        <li className="flex items-start gap-3">
          <Star className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
          <span>{interests}</span>
        </li>
      </ul>
      <Link
        href="/boas-vindas"
        className="flex h-12 items-center justify-center rounded-lg bg-primary text-base font-bold text-on-primary hover:bg-primary-hover"
      >
        Continuar
      </Link>
    </AuthCard>
  );
}
