import {
  Bell,
  Compass,
  House,
  type LucideIcon,
  MessageCircleMore,
  Scale,
  Settings,
  Star,
  Tag,
  User,
} from "lucide-react";

import { routes } from "@/lib/routes";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** contador de não lidas que aparece no item */
  badge?: "conversations" | "notifications";
  subs?: { label: string; href: string }[];
};

/** Menu lateral (mesma ordem do protótipo). */
export const NAV: NavItem[] = [
  { id: "inicio", label: "Início", href: routes.home, icon: House },
  { id: "explorar", label: "Explorar", href: routes.explorar, icon: Compass },
  { id: "ofertas", label: "Ofertas & Promoções", href: routes.ofertas, icon: Tag },
  {
    id: "favoritos",
    label: "Meus Favoritos",
    href: routes.favoritos,
    icon: Star,
    subs: [
      { label: "Produtos e serviços", href: `${routes.favoritos}?aba=itens` },
      { label: "Lojas e prestadores", href: `${routes.favoritos}?aba=lojas` },
      { label: "Listas", href: `${routes.favoritos}?aba=listas` },
      { label: "Alertas", href: `${routes.favoritos}?aba=alertas` },
    ],
  },
  { id: "comparacoes", label: "Comparações", href: routes.comparar, icon: Scale },
  {
    id: "conversas",
    label: "Conversas",
    href: routes.conversas,
    icon: MessageCircleMore,
    badge: "conversations",
  },
  {
    id: "notificacoes",
    label: "Notificações",
    href: routes.notificacoes,
    icon: Bell,
    badge: "notifications",
  },
];

export const NAV_BOTTOM: NavItem[] = [
  { id: "conta", label: "Minha Conta", href: routes.conta, icon: User },
  { id: "config", label: "Configurações", href: `${routes.conta}?aba=config`, icon: Settings },
];

/** Barra inferior no celular: o essencial ao alcance do polegar. */
export const NAV_MOBILE = ["inicio", "explorar", "ofertas", "favoritos", "conversas"];

/** Item ativo: o primeiro segmento da rota. Telas de detalhe herdam a seção de onde vieram (definir por página). */
export function activeIdFor(pathname: string) {
  if (pathname === "/") return "inicio";
  const seg = pathname.split("/")[1];
  const map: Record<string, string> = {
    explorar: "explorar",
    ofertas: "ofertas",
    favoritos: "favoritos",
    comparar: "comparacoes",
    conversas: "conversas",
    notificacoes: "notificacoes",
    conta: "conta",
    atividade: "conta",
    ajuda: "conta",
    institucional: "conta",
  };
  return map[seg] ?? "";
}
