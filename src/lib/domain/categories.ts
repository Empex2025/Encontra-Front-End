import {
  Beer,
  Car,
  Dumbbell,
  Hammer,
  HeartPulse,
  type LucideIcon,
  PawPrint,
  Scissors,
  Shirt,
  ShoppingCart,
  Smartphone,
  Utensils,
  Wrench,
} from "lucide-react";

/** CAT12 – a lista única de categorias usada em toda a plataforma. */
export const CATEGORY_IDS = [
  "comida",
  "bares",
  "mercado",
  "moda",
  "esporte",
  "beleza",
  "saude",
  "casa",
  "servicos",
  "auto",
  "pet",
  "eletronicos",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = {
  id: CategoryId;
  name: string;
  icon: LucideIcon;
  /** variável CSS com a cor da categoria (troca no modo escuro) */
  colorVar: `var(--cat-${CategoryId})`;
};

const def = (id: CategoryId, name: string, icon: LucideIcon): Category => ({
  id,
  name,
  icon,
  colorVar: `var(--cat-${id})`,
});

export const CATEGORIES: readonly Category[] = [
  def("comida", "Comida e bebida", Utensils),
  def("bares", "Bares e eventos", Beer),
  def("mercado", "Mercado", ShoppingCart),
  def("moda", "Moda", Shirt),
  def("esporte", "Esporte", Dumbbell),
  def("beleza", "Beleza", Scissors),
  def("saude", "Saúde", HeartPulse),
  def("casa", "Casa e construção", Hammer),
  def("servicos", "Serviços", Wrench),
  def("auto", "Automotivo", Car),
  def("pet", "Pet", PawPrint),
  def("eletronicos", "Eletrônicos", Smartphone),
];

export const categoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
