import type { Metadata } from "next";

import { CategoryStrip } from "@/components/home/category-strip";
import { HomeHero } from "@/components/home/home-hero";
import { HomeMap } from "@/components/home/home-map";
import { HomeRadar } from "@/components/home/home-radar";
import { HomeSections } from "@/components/home/home-sections";
import { HomeStories } from "@/components/home/home-stories";
import { NeighborhoodRadar } from "@/components/home/neighborhood-radar";

export const metadata: Metadata = { title: "Início" };

/** Ordem do protótipo (Home v2): busca, categorias e mapa; Stories; blocos; Meu Radar; Radar do bairro. */
export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-10">
      <HomeHero>
        <CategoryStrip />
        <HomeMap />
      </HomeHero>
      <HomeStories />
      <HomeSections />
      <HomeRadar />
      <NeighborhoodRadar />
    </div>
  );
}
