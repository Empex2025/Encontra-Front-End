/**
 * Ações que pedem conta e o convite de cada uma (Documento de entrega › Fluxo 1 › Modo visitante).
 * Título e texto são os da tabela do documento; cada tela declara a ação, nunca pelo texto do botão.
 */
export const AUTH_ACTIONS = {
  favorite: {
    title: "Entre para salvar nos favoritos",
    text: "Guarde produtos e lugares e receba aviso quando o preço baixar.",
  },
  follow: {
    title: "Entre para seguir esta loja",
    text: "Veja primeiro os stories, lives e ofertas de quem você segue.",
  },
  chat: {
    title: "Entre para conversar com a loja",
    text: "Suas conversas ficam salvas e você recebe a resposta mesmo se sair da página. O WhatsApp continua liberado.",
  },
  review: {
    title: "Entre para avaliar",
    text: "Só quem tem conta pode avaliar — assim as opiniões são de pessoas reais.",
  },
  alert: {
    title: "Entre para criar alertas",
    text: "Avisamos por notificação quando o preço baixar ou o produto voltar.",
  },
  coupon: {
    title: "Entre para pegar este cupom",
    text: "O cupom fica guardado em Meus cupons até você usar na loja.",
  },
  quote: {
    title: "Entre para pedir orçamento",
    text: "O prestador responde no chat e você acompanha em Minha atividade.",
  },
  saveComparison: {
    title: "Entre para salvar a comparação",
    text: "Sem conta você compara na hora; com conta, a comparação fica salva em Favoritos.",
  },
  want: {
    title: "Entre para pedir em promoção",
    text: "Avisamos as lojas e prestadores perto de você e você é avisado quando alguém criar a oferta.",
  },
  ask: {
    title: "Entre para perguntar às lojas",
    text: "Lojas e prestadores perto respondem no chat, e você acompanha em Conversas.",
  },
  reserve: {
    title: "Entre para reservar",
    text: "A reserva fica guardada na sua conta para você acompanhar.",
  },
  like: {
    title: "Entre para curtir",
    text: "Com uma conta, suas curtidas ficam guardadas.",
  },
  helpful: {
    title: "Entre para marcar como útil",
    text: "Cada pessoa vota uma vez; por isso pedimos uma conta.",
  },
  comment: {
    title: "Entre para comentar na live",
    text: "Com uma conta, a loja sabe com quem está falando.",
  },
  attend: {
    title: "Entre para confirmar presença",
    text: "A confirmação fica guardada na sua conta.",
  },
  interest: {
    title: "Entre para marcar interesse",
    text: "Avisamos você quando o evento estiver perto.",
  },
  reminder: {
    title: "Entre para criar o lembrete",
    text: "Você recebe o aviso na hora certa.",
  },
  openChats: {
    title: "Entre para ver suas conversas",
    text: "Suas conversas com lojas e prestadores ficam salvas na sua conta. O WhatsApp continua liberado.",
  },
  openNotifications: {
    title: "Entre para ver suas notificações",
    text: "Avisos de preço, ofertas e respostas das lojas chegam aqui.",
  },
  openFavorites: {
    title: "Entre para ver seus favoritos",
    text: "Guarde produtos, lojas e listas e acompanhe tudo num lugar só.",
  },
  openAccount: {
    title: "Entre para acessar sua conta",
    text: "Com uma conta grátis você salva, segue e conversa com as lojas.",
  },
} as const;

/** Itens do menu que pedem conta → convite que abre ao clicar (Comparações e as demais ficam livres). */
export const NAV_GUARDS: Record<string, AuthActionType> = {
  conversas: "openChats",
  notificacoes: "openNotifications",
  favoritos: "openFavorites",
  conta: "openAccount",
  config: "openAccount",
};

export type AuthActionType = keyof typeof AUTH_ACTIONS;

/** Motivo de cada área da conta travada para visitante: "Entre para {motivo}". */
export const LOCKED_AREAS = {
  conversas: "ver suas conversas",
  favoritos: "ver seus favoritos",
  atividade: "ver sua atividade",
  notificacoes: "ver suas notificações",
  conta: "acessar sua conta",
  avaliar: "avaliar",
} as const;
export type LockedArea = keyof typeof LOCKED_AREAS;

export type PendingAction = { type: AuthActionType; returnTo: string; targetId?: string };

const KEY = "encontrae_acao_pendente";

/** A ação que a pessoa tentou antes de entrar. Fica só nesta aba e sem dados pessoais. */
export function savePendingAction(action: PendingAction) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(action));
  } catch {}
}

export function readPendingAction(): PendingAction | null {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(KEY) ?? "null") as Partial<PendingAction> | null;
    if (v && typeof v.type === "string" && v.type in AUTH_ACTIONS && typeof v.returnTo === "string") {
      return { type: v.type as AuthActionType, returnTo: v.returnTo, targetId: v.targetId };
    }
  } catch {}
  return null;
}

/** Lê e apaga: cada ação pendente só é concluída uma vez, pela tela que a pediu. */
export function takePendingAction(type?: AuthActionType): PendingAction | null {
  const p = readPendingAction();
  if (!p || (type && p.type !== type)) return null;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {}
  return p;
}
