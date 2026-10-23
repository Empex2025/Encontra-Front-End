/** Cartão do pedido no topo da conversa: horário agendado, orçamento, solicitação de serviço ou produto combinado.
 *  A plataforma não cobra nem fecha o pedido: o cliente cancela, remarca ou confirma que recebeu/foi atendido, sem custo. */
export type OrderKind = "booking" | "quote" | "service" | "product";
export type OrderStatus = "open" | "rescheduling" | "cancelled" | "done" | "rated";

export type OrderRequest = {
  id: string;
  kind: OrderKind;
  title: string;
  rows: { label: string; value: string }[];
  status: OrderStatus;
  rating?: number | null;
  tags?: string[] | null;
};

export type OrderAction = "done" | "reschedule" | "cancel";

export type OrderCardView = {
  kindLabel: string;
  statusLabel: string;
  tone: "ok" | "warn" | "danger";
  note: string;
  actions: { id: OrderAction; label: string; danger?: boolean }[];
  /** Estrelas para tocar (depois de confirmar). */
  askRating: boolean;
  /** Etiquetas prontas, opcionais, depois da nota. */
  tagOptions: string[];
  cancelConfirm: { title: string; text: string; ok: string };
};

const KIND_LABEL: Record<OrderKind, string> = {
  booking: "Horário agendado",
  quote: "Pedido de orçamento",
  service: "Solicitação de serviço",
  product: "Produto",
};

export function orderCardView(r: OrderRequest, partner: string): OrderCardView {
  const isProduct = r.kind === "product";
  const isBooking = r.kind === "booking";
  const doneLabel = isProduct ? "Recebi meu produto" : "Serviço realizado";
  const cancelLabel = isBooking ? "Cancelar horário" : "Cancelar pedido";
  const open = r.status === "open";

  let statusLabel: string;
  let tone: OrderCardView["tone"] = "ok";
  let note: string;
  switch (r.status) {
    case "rated":
      statusLabel = "Avaliado · obrigado!";
      note = `Sua avaliação aparece no perfil de ${partner}. Obrigado por ajudar outras pessoas.`;
      break;
    case "done":
      statusLabel = isProduct ? "Recebido · você confirmou" : "Concluído · você confirmou";
      note = "Como foi? Toque em uma estrela, leva um segundo.";
      break;
    case "cancelled":
      tone = "danger";
      statusLabel = isBooking ? "Cancelado por você" : "Pedido cancelado";
      note = isBooking ? `O horário foi liberado e ${partner} foi avisado.` : `${partner} foi avisado.`;
      break;
    case "rescheduling":
      tone = "warn";
      statusLabel = "Remarcação pedida";
      note = `Aguardando ${partner} sugerir um novo horário. O horário antigo continua reservado até vocês combinarem.`;
      break;
    default:
      if (isProduct) {
        statusLabel = "Combinando com a loja";
        tone = "warn";
        note = "Combine a retirada ou a entrega aqui na conversa. Quando tiver o produto, confirme com um toque.";
      } else if (isBooking) {
        statusLabel = "Agendado · aguardando confirmação";
        note = "Você pode remarcar ou cancelar a qualquer momento, sem custo.";
      } else {
        statusLabel = r.kind === "quote" ? "Enviado · aguardando o valor" : "Enviado · aguardando resposta";
        tone = "warn";
        note = "Você pode cancelar a qualquer momento, sem custo.";
      }
  }

  const actions: OrderCardView["actions"] = [];
  if (open) {
    actions.push({ id: "done", label: doneLabel });
    if (isBooking) actions.push({ id: "reschedule", label: "Remarcar" });
    if (!isProduct) actions.push({ id: "cancel", label: cancelLabel, danger: true });
  }

  return {
    kindLabel: KIND_LABEL[r.kind],
    statusLabel,
    tone,
    note,
    actions,
    askRating: r.status === "done",
    tagOptions:
      r.status === "rated"
        ? isProduct
          ? ["Produto como anunciado", "Atendimento bom", "Preço justo", "Entrega ou retirada fácil"]
          : ["Pontual", "Atendimento bom", "Preço justo", "Serviço bem feito"]
        : [],
    cancelConfirm: {
      title: isBooking ? "Cancelar este horário?" : "Cancelar este pedido?",
      text: `${isBooking ? `O horário volta para a agenda de ${partner}, que é avisado. ` : `${partner} é avisado e o pedido é encerrado. `}Você pode cancelar a qualquer momento, sem custo.`,
      ok: cancelLabel,
    },
  };
}
