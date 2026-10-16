import type { Metadata } from "next";

import { CategoryStrip } from "@/components/home/category-strip";
import { HomeHero } from "@/components/home/home-hero";
import { HomeMap } from "@/components/home/home-map";
import { HomeRadar } from "@/components/home/home-radar";
import { HomeSections } from "@/components/home/home-sections";
import { HomeStories } from "@/components/home/home-stories";
import { NeighborhoodRadar } from "@/components/home/neighborhood-radar";

export const metadata: Metadata = { title: "Início" };

/**
 * Home (artboard HomeV2). Ordem do protótipo: busca → atalhos → categorias → mapa → Stories → Promoções e ofertas
 * agora → Produtos → Serviços → Bares, restaurantes, eventos → Meu Radar → Radar do bairro. Largura máxima de 1280 px.
 */
export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
      <section
        aria-label="Busca, categorias e mapa"
        className="flex flex-col gap-6 rounded-2xl border border-border bg-surface p-4 sm:p-8"
      >
        <HomeHero />
        <CategoryStrip />
        <HomeMap />
      </section>
      <HomeStories />
      <HomeSections />
      <HomeRadar />
      <NeighborhoodRadar />
    </div>
  );
}
