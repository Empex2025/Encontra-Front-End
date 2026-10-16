/** Rotas do app do consumidor (Documento de entrega › Telas e regras › Índice). */
export const routes = {
  home: "/",
  explorar: "/explorar",
  ofertas: "/ofertas",
  favoritos: "/favoritos",
  comparar: "/comparar",
  compararQuadro: "/comparar/quadro",
  conversas: "/conversas",
  notificacoes: "/notificacoes",
  atividade: "/atividade",
  conta: "/conta",
  ajuda: "/ajuda",
  institucional: "/institucional",
  entrar: "/entrar",
  cadastro: "/cadastro",
} as const;

export const explorarComBusca = (q: string) => `${routes.explorar}?q=${encodeURIComponent(q)}`;

/** Endereços públicos (decisão do Documento de entrega: /p, /l, /s, /o). */
export const produtoHref = (slug: string) => `/p/${encodeURIComponent(slug)}`;
export const lojaHref = (slug: string) => `/l/${encodeURIComponent(slug)}`;
export const prestadorHref = (slug: string) => `/s/${encodeURIComponent(slug)}`;
export const liveHref = (id: string) => `/ao-vivo/${encodeURIComponent(id)}`;

export const conversaHref = (id: string) => `/conversas/${encodeURIComponent(id)}`;
export const avaliarHref = (tipo: "produto" | "loja" | "prestador", slug: string) =>
  `/avaliar?tipo=${tipo}&id=${encodeURIComponent(slug)}`;
export const denunciarHref = (
  tipo: "produto" | "loja" | "prestador" | "avaliacao" | "story" | "live" | "evento" | "lista",
  id: string,
) => `/denunciar?tipo=${tipo}&id=${encodeURIComponent(id)}`;
export const eventoHref = (id: string) => `/eventos/${encodeURIComponent(id)}`;
/** Stories: `perfil` abre só os stories dele; `destaque` abre um destaque; `inicio` começa naquele perfil. */
export const storiesHref = (o: { perfil?: string; destaque?: string; inicio?: string } = {}) => {
  const p = new URLSearchParams();
  if (o.perfil) p.set("perfil", o.perfil);
  if (o.destaque) p.set("destaque", o.destaque);
  if (o.inicio) p.set("inicio", o.inicio);
  const qs = p.toString();
  return `/stories${qs ? `?${qs}` : ""}`;
};
