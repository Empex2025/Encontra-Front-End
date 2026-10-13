import type { Metadata } from "next";

import { CategoryStrip } from "@/components/home/category-strip";
import { HomeHero } from "@/components/home/home-hero";
import { HomeSections } from "@/components/home/home-sections";

export const metadata: Metadata = { title: "Início" };

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <HomeHero />
      <CategoryStrip />
      <HomeSections />
    </div>
  );
}
