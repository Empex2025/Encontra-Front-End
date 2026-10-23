"use client";

import { OrderCard } from "./order-card";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  BellOff,
  EllipsisVertical,
  Flag,
  MessageCircle,
  Paperclip,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { LockedBody, useAccess } from "@/components/auth/session-gate";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/list-states";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { type Conversation, type ConversationDetail, chat, type Message, uploadFile } from "@/lib/api/chat";
import { queryKeys } from "@/lib/api/endpoints";
import {
  canSend,
  clipMessage,
  listTimeLabel,
  MESSAGE_MAX,
  previewText,
  REPORT_REASONS,
  type ReportReason,
  validateChatImage,
  validateReport,
} from "@/lib/domain/chat";
import { QUICK_QUESTIONS, whatsappUrl } from "@/lib/domain/whatsapp";
import { formatMoney } from "@/lib/format";
import { conversaHref, produtoHref, routes } from "@/lib/routes";

const LIST_KEY = ["conversations"] as const;
const time = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Maceio",
});

/** Iniciais de duas letras ("Esporte M Loja" → "EM"). */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ||
  name.trim().slice(0, 2).toUpperCase() ||
  "?";

/** Avatar redondo com iniciais (protótipo › Conversas). */
function Initials({ name, url, size }: { name: string; url: string | null; size: 44 | 48 }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-extrabold text-on-primary",
        size === 48 ? "size-12 text-[15px]" : "size-11 text-sm",
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- imagens vêm de vários domínios das lojas
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}

function WhatsappGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Z" />
    </svg>
  );
}

/** Conversas: lista + conversa aberta num cartão só. No celular, uma tela por vez (`/conversas` e `/conversas/{id}`). */
export function ConversationsView({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const access = useAccess();
  const member = access === "member";
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");
  const [onlyUnread, setOnlyUnread] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setQ(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  const list = useQuery({
    queryKey: [...LIST_KEY, q, onlyUnread],
    queryFn: () => chat.list({ q, unread: onlyUnread }),
    refetchInterval: 30_000,
    enabled: member,
  });
  const first = list.data?.items[0]?.id;
  // Sem conversa pedida, no computador abre a primeira da lista.
  useEffect(() => {
    if (member && !activeId && first && window.matchMedia("(min-width: 768px)").matches)
      router.replace(conversaHref(first));
  }, [member, activeId, first, router]);

  const noConversationsAtAll = !!list.data && list.data.items.length === 0 && !q && !onlyUnread;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <header className={cn("flex flex-col gap-1", activeId && "max-md:hidden")}>
        <h1 className="text-[32px] leading-10 font-bold text-text-strong">Conversas</h1>
        <p className="text-base text-text-muted">
          Suas conversas com lojas e prestadores. Tudo combinado aqui, sem precisar do WhatsApp.
        </p>
      </header>
      <div className="grid h-[78dvh] min-h-[28rem] overflow-hidden rounded-2xl bg-surface shadow-raised md:h-[720px] md:grid-cols-[380px_minmax(0,1fr)]">
        <aside
          className={cn("flex min-h-0 flex-col border-border md:border-r", activeId && "max-md:hidden")}
          aria-label="Lista de conversas"
        >
          <div className="flex flex-col gap-2.5 border-b border-surface-3 p-4">
            <label className="flex h-11 items-center gap-2 rounded-full border border-surface-3 bg-bg px-3.5">
              <Search className="size-4 shrink-0 text-text-subtle" aria-hidden />
              <span className="sr-only">Buscar conversa</span>
              <input
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                disabled={!member}
                placeholder="Buscar loja ou produto"
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none disabled:opacity-60"
              />
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                aria-pressed={!onlyUnread}
                disabled={!member}
                onClick={() => setOnlyUnread(false)}
                className={chip(!onlyUnread)}
              >
                Todas
              </button>
              <button
                type="button"
                aria-pressed={onlyUnread}
                disabled={!member}
                onClick={() => setOnlyUnread(true)}
                className={chip(onlyUnread)}
              >
                Não lidas ({list.data ? list.data.unreadTotal : "—"})
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!member ? (
              <div className="p-4">
                <LockedBody
                  access={access}
                  area="conversas"
                  hint="Suas conversas ficam salvas e você recebe a resposta mesmo se sair da página. O WhatsApp continua liberado."
                />
              </div>
            ) : list.isPending ? (
              <div className="p-4">
                <ListSkeleton label="Carregando conversas…" rows={4} />
              </div>
            ) : list.isError ? (
              <div className="p-4">
                <ErrorState
                  title="Não foi possível carregar suas conversas"
                  error={list.error}
                  onRetry={() => list.refetch()}
                />
              </div>
            ) : list.data.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-subtle">
                {q || onlyUnread ? "Nenhuma conversa encontrada." : "Nenhuma conversa"}
              </p>
            ) : (
              <ul>
                {list.data.items.map((c) => (
                  <Row key={c.id} c={c} active={c.id === activeId} />
                ))}
              </ul>
            )}
          </div>
        </aside>
        <section aria-label="Conversa aberta" className={cn("min-h-0 min-w-0", !activeId && "max-md:hidden")}>
          {activeId && !member ? (
            <div className="p-4">
              <LockedBody
                access={access}
                area="conversas"
                hint="Suas conversas ficam salvas e você recebe a resposta mesmo se sair da página. O WhatsApp continua liberado."
              />
            </div>
          ) : activeId ? (
            <Thread key={activeId} id={activeId} />
          ) : noConversationsAtAll ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
              <span className="flex size-[72px] items-center justify-center rounded-full bg-surface-2">
                <MessageCircle className="size-8 text-text-subtle" aria-hidden />
              </span>
              <h2 className="text-xl font-bold text-text-strong">Nenhuma conversa</h2>
              <p className="max-w-sm text-sm leading-[21px] text-text-muted">
                Quando você falar com uma loja ou prestador pelo chat da EncontraÊ, a conversa aparece aqui.
              </p>
              <Link
                href={routes.explorar}
                className="inline-flex h-10 items-center rounded-lg bg-primary px-[18px] text-sm font-bold text-on-primary hover:bg-primary-hover"
              >
                Explorar lojas
              </Link>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
              <span className="flex size-[72px] items-center justify-center rounded-full bg-surface-2">
                <MessageCircle className="size-8 text-text-subtle" aria-hidden />
              </span>
              <p className="max-w-sm text-sm leading-[21px] text-text-muted">
                Escolha uma conversa, ou abra uma pelo perfil de uma loja ou produto.
              </p>
              <Link href={routes.explorar} className="text-sm font-semibold text-link hover:underline">
                Buscar no Explorar
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const chip = (on: boolean) =>
  cn(
    "h-[30px] rounded-full border px-3 text-xs font-bold disabled:opacity-60",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text-2 hover:border-navy-300",
  );

function Row({ c, active }: { c: Conversation; active: boolean }) {
  return (
    <li>
      <Link
        href={conversaHref(c.id)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 border-b border-surface-2 px-4 py-3.5 hover:bg-surface-2",
          active && "bg-selected/50 shadow-[inset_3px_0_0_var(--primary)]",
        )}
      >
        <span className="relative shrink-0">
          <Initials name={c.profile.name} url={c.profile.avatarUrl} size={48} />
          {c.online && (
            <span
              className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface bg-success"
              role="img"
              aria-label="Online"
            />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm leading-5 font-bold text-text">{c.profile.name}</span>
            <span className="flex shrink-0 items-center gap-1">
              {c.muted && <BellOff className="size-[13px] text-text-subtle" aria-label="Silenciada" />}
              {c.last && (
                <span className={cn("text-[11px]", c.unread > 0 ? "text-danger" : "text-text-subtle")}>
                  {listTimeLabel(c.last.at)}
                </span>
              )}
            </span>
          </span>
          <span className="truncate text-xs leading-4 text-text-subtle">{c.context ?? "Conversa"}</span>
          <span className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-[13px] leading-[18px]",
                c.unread > 0 ? "font-bold text-text" : "text-text-subtle",
              )}
            >
              {previewText(c)}
            </span>
            {c.unread > 0 && (
              <span
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white"
                aria-label={`${c.unread} não lidas`}
              >
                {c.unread}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}

type Dialog = null | "block" | "report" | "delete";

function Thread({ id }: { id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ file: File; url: string } | null>(null);
  const [fileError, setFileError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const detail = useQuery({
    queryKey: [...LIST_KEY, id],
    queryFn: () => chat.detail(id),
    retry: (n, e) => !(e as { status?: number }).status && n < 2,
  });
  const draft = detail.data?.draft ?? null;
  const [draftUsed, setDraftUsed] = useState(false);
  useEffect(() => {
    if (draft && !draftUsed)
      queueMicrotask(() => {
        setText(clipMessage(draft));
        setDraftUsed(true);
      });
  }, [draft, draftUsed]);

  const msgs = useInfiniteQuery({
    queryKey: [...LIST_KEY, id, "messages"],
    queryFn: ({ pageParam }) => chat.messages(id, pageParam),
    initialPageParam: undefined as string | undefined,
    // Páginas mais antigas: `before` = id da mensagem mais antiga já carregada.
    getNextPageParam: (last) => (last.hasMore ? last.items[0]?.id : undefined),
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible" ? 5000 : false,
  });
  // Mais antiga primeiro: as páginas vêm da mais nova para a mais antiga.
  const messages: Message[] = [...(msgs.data?.pages ?? [])].reverse().flatMap((p) => p.items);
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    // Rola só a lista de mensagens (não a página inteira).
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lastId]);

  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: LIST_KEY });
    void qc.invalidateQueries({ queryKey: queryKeys.unread });
  };
  useEffect(() => {
    if (detail.data) void qc.invalidateQueries({ queryKey: queryKeys.unread });
  }, [detail.data, qc]);

  const send = useMutation({
    mutationFn: async () => {
      const imageKey = file ? await uploadFile("chat", file.file) : undefined;
      return chat.send(id, { text: text.trim() || undefined, imageKey });
    },
    onSuccess: () => {
      setText("");
      if (file) URL.revokeObjectURL(file.url);
      setFile(null);
      refreshAll();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível enviar a mensagem.", "info"),
  });
  const quick = useMutation({
    mutationFn: (t: string) => chat.send(id, { text: t }),
    onSuccess: refreshAll,
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível enviar.", "info"),
  });
  const mute = useMutation({
    mutationFn: (m: boolean) => chat.mute(id, m),
    onSuccess: (_d, m) => {
      toast(m ? "Conversa silenciada." : "Avisos desta conversa ligados.");
      refreshAll();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível alterar.", "info"),
  });

  if (detail.isPending)
    return (
      <div className="p-4">
        <ListSkeleton label="Carregando conversa…" rows={4} />
      </div>
    );
  if (detail.isError) {
    const notFound = (detail.error as { status?: number }).status === 404;
    return notFound ? (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="font-bold text-text-strong">Conversa não encontrada</p>
        <Link href={routes.conversas} className="text-sm font-semibold text-link hover:underline">
          Voltar às conversas
        </Link>
      </div>
    ) : (
      <div className="p-4">
        <ErrorState
          title="Não foi possível abrir a conversa"
          error={detail.error}
          onRetry={() => detail.refetch()}
        />
      </div>
    );
  }
  const c: ConversationDetail = detail.data;
  const wa = whatsappUrl(c.whatsapp, `Olá, ${c.profile.name}! Vi no EncontraÊ e gostaria de conversar.`);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = validateChatImage(f);
    setFileError(err ?? "");
    if (err) return;
    if (file) URL.revokeObjectURL(file.url);
    setFile({ file: f, url: URL.createObjectURL(f) });
    setTimeout(() => inputRef.current?.focus(), 30);
  };
  const ready = !c.blocked && canSend(text, !!file) && !send.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-surface-3 px-3 py-3.5 sm:gap-3 sm:px-5">
        <Link
          href={routes.conversas}
          aria-label="Voltar às conversas"
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-surface-2 md:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Initials name={c.profile.name} url={c.profile.avatarUrl} size={44} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-1.5 text-base leading-6 font-bold text-text-strong">
            <span className="truncate">{c.profile.name}</span>
            {c.muted && (
              <BellOff className="size-3.5 shrink-0 text-text-subtle" aria-label="Notificações silenciadas" />
            )}
          </span>
          <span
            className={cn(
              "truncate text-xs leading-4",
              c.blocked ? "text-danger-text" : c.status.online ? "text-success-text" : "text-text-subtle",
            )}
          >
            {c.blocked
              ? "Bloqueada"
              : c.status.online
                ? `● Online${c.status.responseText ? ` · ${c.status.responseText}` : ""}`
                : `Offline${c.status.responseText ? ` · ${c.status.responseText}` : ""}`}
          </span>
        </div>
        <Link
          href={c.profileHref}
          className="inline-flex h-[38px] shrink-0 items-center rounded-lg border border-primary px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2"
        >
          {c.profile.kind === "provider" ? "Ver perfil" : "Ver loja"}
        </Link>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track({
                type: "WHATSAPP_CLICK",
                targetType: c.profile.kind === "provider" ? "PROVIDER" : "STORE",
                targetId: c.profile.id,
              })
            }
            className="inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-lg bg-success px-3 text-[13px] font-bold text-white hover:opacity-90 sm:px-3.5"
          >
            <WhatsappGlyph />
            <span className="max-sm:sr-only">WhatsApp</span>
          </a>
        )}
        <KebabMenu
          items={[
            {
              label: c.muted ? "Reativar notificações" : "Silenciar notificações",
              icon: BellOff,
              onSelect: () => mute.mutate(!c.muted),
            },
            { label: "Denunciar", icon: Flag, onSelect: () => setDialog("report") },
            {
              label: c.blocked ? "Desbloquear" : "Bloquear",
              icon: Ban,
              onSelect: () => (c.blocked ? unblock() : setDialog("block")),
            },
            { label: "Apagar conversa", icon: Trash2, onSelect: () => setDialog("delete"), danger: true },
          ]}
        />
      </header>

      {c.product && (
        <div className="flex items-center gap-3 border-b border-surface-3 bg-bg px-3 py-2.5 sm:px-5">
          <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-primary">
            {c.product.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.product.imageUrl} alt="" className="size-full object-cover" />
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] leading-[18px] font-semibold text-text">
              {c.product.title}
            </span>
            {c.product.priceCents !== null && (
              <span className="text-[13px] leading-[18px] font-extrabold text-text-strong">
                {formatMoney(c.product.priceCents)}
              </span>
            )}
          </span>
          <Link
            href={produtoHref(c.product.slug)}
            className="text-[13px] font-bold whitespace-nowrap text-link hover:underline"
          >
            Ver anúncio →
          </Link>
        </div>
      )}
      {c.blocked && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 border-b border-danger/40 bg-danger-soft px-3 py-2.5 sm:px-5"
        >
          <span className="flex items-center gap-2 text-sm leading-5 font-semibold text-danger-text">
            <Ban className="size-4 shrink-0" aria-hidden />
            <span>Você bloqueou {c.profile.name}.</span>
          </span>
          <button
            type="button"
            onClick={unblock}
            className="h-8 shrink-0 rounded-lg border border-primary bg-surface px-3.5 text-[13px] font-bold text-text-strong hover:bg-surface-2"
          >
            Desbloquear
          </button>
        </div>
      )}

      <div
        ref={logRef}
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-5"
        aria-live="polite"
        aria-label="Mensagens"
      >
        <span className="self-center rounded-full bg-surface-2 px-3 py-1 text-center text-[11px] text-text-subtle">
          🔒 Conversa protegida na EncontraÊ · nunca compartilhe senhas ou códigos
        </span>
        {detail.data.request && (
          <OrderCard
            conversationId={id}
            request={detail.data.request}
            partner={detail.data.profile.name}
            reviewHref={null}
            onChanged={refreshAll}
          />
        )}
        {msgs.hasNextPage && (
          <button
            type="button"
            disabled={msgs.isFetchingNextPage}
            onClick={() => msgs.fetchNextPage()}
            className="self-center rounded-full border border-border-strong px-4 py-1.5 text-xs font-semibold hover:bg-surface-2"
          >
            {msgs.isFetchingNextPage ? "Carregando…" : "Ver mensagens anteriores"}
          </button>
        )}
        {msgs.isPending ? (
          <ListSkeleton label="Carregando mensagens…" rows={2} />
        ) : msgs.isError && messages.length === 0 ? (
          <ErrorState
            title="Não foi possível carregar as mensagens"
            error={msgs.error}
            onRetry={() => msgs.refetch()}
          />
        ) : messages.length === 0 ? (
          <span className="mt-6 self-center text-[13px] text-text-subtle">
            Nenhuma mensagem ainda. Mande a primeira!
          </span>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn("flex flex-col gap-0.5", m.mine ? "items-end" : "items-start")}>
              {m.imageUrl && (
                <span
                  className={cn(
                    "flex max-w-[260px] p-1",
                    m.mine
                      ? "rounded-[16px_16px_4px_16px] bg-primary"
                      : "rounded-[16px_16px_16px_4px] bg-surface-2",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.imageUrl}
                    alt="Foto enviada"
                    className="block max-h-[260px] max-w-[252px] rounded-xl object-cover"
                  />
                </span>
              )}
              {m.text && (
                <span
                  className={cn(
                    "max-w-[min(460px,85%)] px-3.5 py-2.5 text-sm leading-5 break-words whitespace-pre-wrap",
                    m.mine
                      ? "rounded-[16px_16px_4px_16px] bg-primary text-on-primary"
                      : "rounded-[16px_16px_16px_4px] bg-surface-2 text-text",
                  )}
                >
                  {m.text}
                </span>
              )}
              <span className="text-[11px] text-text-subtle">
                {m.mine ? "Você" : c.profile.name} · {time.format(new Date(m.at))}
              </span>
            </div>
          ))
        )}
      </div>

      {!c.blocked && (
        <ul className="flex flex-wrap gap-1.5 px-5 pb-2.5" aria-label="Respostas rápidas">
          {QUICK_QUESTIONS.map((t) => (
            <li key={t}>
              <button
                type="button"
                disabled={quick.isPending}
                onClick={() => quick.mutate(t)}
                className="h-[30px] rounded-full border border-navy-200 bg-surface px-3 text-xs font-semibold text-text-strong hover:bg-surface-2 disabled:opacity-60"
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}

      {file && !c.blocked && (
        <div className="flex items-center gap-2.5 border-t border-surface-3 px-5 pt-2.5">
          <span className="relative size-16 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={file.url}
              alt="Prévia da foto anexada"
              className="size-16 rounded-lg border border-border object-cover"
            />
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(file.url);
                setFile(null);
              }}
              aria-label="Remover foto"
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border-2 border-surface bg-text text-surface"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] leading-[18px] font-semibold text-text">
              {file.file.name}
            </span>
            <span className="text-xs leading-4 text-text-subtle">
              {Math.max(1, Math.round(file.file.size / 1024))} KB · escreva uma legenda se quiser
            </span>
          </span>
        </div>
      )}
      {fileError && (
        <p
          role="alert"
          className="mx-5 mt-2.5 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-[13px] leading-[18px] text-danger-text"
        >
          {fileError}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) send.mutate();
        }}
        className={cn(
          "flex items-center gap-2.5 px-3 pt-3 pb-4 sm:px-5",
          !file && !fileError && "border-t border-surface-3",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={c.blocked || !!file}
          onClick={() => fileRef.current?.click()}
          aria-label="Anexar foto"
          title="Anexar foto"
          className="flex size-[46px] shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:bg-surface-2 disabled:opacity-55"
        >
          <Paperclip className="size-[18px]" aria-hidden />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={c.blocked}
          maxLength={MESSAGE_MAX}
          aria-label="Mensagem"
          placeholder={
            c.blocked
              ? "Você bloqueou esta loja. Desbloqueie para mandar mensagens."
              : file
                ? "Escreva uma legenda (opcional)…"
                : "Escreva sua mensagem…"
          }
          onChange={(e) => setText(clipMessage(e.target.value))}
          className="h-[46px] min-w-0 flex-1 rounded-full border border-border bg-bg px-4 text-sm text-text outline-none focus-visible:border-navy-300 disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={!ready}
          aria-label="Enviar"
          className={cn(
            "flex size-[46px] shrink-0 items-center justify-center rounded-full text-white",
            ready ? "bg-primary hover:bg-primary-hover" : "bg-border-strong",
          )}
        >
          <Send className="size-[18px]" aria-hidden />
        </button>
      </form>

      {dialog === "block" && (
        <BlockDialog id={id} name={c.profile.name} onClose={() => setDialog(null)} onDone={refreshAll} />
      )}
      {dialog === "report" && (
        <ReportDialog
          id={id}
          name={c.profile.name}
          blocked={c.blocked}
          onClose={() => setDialog(null)}
          onDone={refreshAll}
        />
      )}
      {dialog === "delete" && (
        <DeleteDialog
          id={id}
          name={c.profile.name}
          onClose={() => setDialog(null)}
          onDone={() => {
            refreshAll();
            router.replace(routes.conversas);
          }}
        />
      )}
    </div>
  );

  function unblock() {
    chat.block(id, false).then(
      () => {
        toast(`${c.profile.name} foi desbloqueada. Vocês podem conversar de novo.`);
        refreshAll();
      },
      (e) => toast(e instanceof Error ? e.message : "Não foi possível desbloquear.", "info"),
    );
  }
}

type MenuItem = {
  label: string;
  icon: typeof Flag;
  onSelect: () => void;
  danger?: boolean;
};

function KebabMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const close = () => {
    setOpen(false);
    btnRef.current?.focus();
  };
  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [open]);
  const onKey = (e: React.KeyboardEvent) => {
    const btns = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      btns[(i + 1) % btns.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      btns[(i - 1 + btns.length) % btns.length]?.focus();
    }
  };
  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções da conversa"
        onClick={() => setOpen((o) => !o)}
        className="flex size-[38px] items-center justify-center rounded-lg border border-border bg-surface text-text-strong hover:bg-surface-2"
      >
        <EllipsisVertical className="size-[18px]" aria-hidden />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul
            ref={listRef}
            role="menu"
            aria-label="Opções da conversa"
            onKeyDown={onKey}
            className="absolute top-[46px] right-0 z-20 flex w-[248px] flex-col rounded-xl border border-border bg-surface p-1.5 shadow-pop"
          >
            {items.map((it, i) => (
              <li key={it.label} role="none" className="contents">
                {i === items.length - 1 && <span role="separator" className="mx-0 my-1 h-px bg-surface-3" />}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    it.onSelect();
                  }}
                  className={cn(
                    "flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-surface-2",
                    it.danger ? "font-semibold text-danger-text" : "text-text",
                  )}
                >
                  <it.icon
                    className={cn("size-4 shrink-0", it.danger ? "text-danger-text" : "text-text-muted")}
                    aria-hidden
                  />
                  {it.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Botões do rodapé das janelas: cancelar (contorno) e a ação (cor da ação), alinhados à direita. */
function DialogActions({
  confirm,
  onConfirm,
  onCancel,
  pending,
  tone = "danger",
}: {
  confirm: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  tone?: "danger" | "primary";
}) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-surface-2"
      >
        Cancelar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onConfirm}
        className={cn(
          "h-10 rounded-lg px-[18px] text-sm font-bold text-white disabled:opacity-60",
          tone === "danger" ? "bg-danger hover:opacity-90" : "bg-primary hover:bg-primary-hover",
        )}
      >
        {confirm}
      </button>
    </div>
  );
}

function BlockDialog({
  id,
  name,
  onClose,
  onDone,
}: {
  id: string;
  name: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const m = useMutation({
    mutationFn: () => chat.block(id, true),
    onSuccess: () => {
      toast(`Você bloqueou ${name}.`);
      onDone();
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível bloquear.", "info"),
  });
  return (
    <Modal title={`Bloquear ${name}?`} onClose={onClose}>
      <span className="flex size-[52px] items-center justify-center rounded-full bg-danger-soft text-danger-text">
        <Ban className="size-6" aria-hidden />
      </span>
      <p className="text-sm leading-[21px] text-text-muted">
        A loja não poderá mais enviar mensagens para você por aqui, e você também não poderá responder
        enquanto ela estiver bloqueada. A loja não é avisada. Você pode desbloquear quando quiser.
      </p>
      <DialogActions
        confirm="Bloquear"
        onConfirm={() => m.mutate()}
        onCancel={onClose}
        pending={m.isPending}
      />
    </Modal>
  );
}

function DeleteDialog({
  id,
  name,
  onClose,
  onDone,
}: {
  id: string;
  name: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const m = useMutation({
    mutationFn: () => chat.remove(id),
    onSuccess: () => {
      toast(`Conversa com ${name} apagada.`);
      onDone();
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível apagar.", "info"),
  });
  return (
    <Modal title={`Apagar conversa com ${name}?`} onClose={onClose}>
      <p className="text-sm leading-[21px] text-text-muted">
        As mensagens e fotos desta conversa serão apagadas só para você. Essa ação não pode ser desfeita.
      </p>
      <DialogActions
        confirm="Apagar conversa"
        onConfirm={() => m.mutate()}
        onCancel={onClose}
        pending={m.isPending}
      />
    </Modal>
  );
}

function ReportDialog({
  id,
  name,
  blocked,
  onClose,
  onDone,
}: {
  id: string;
  name: string;
  blocked: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(!blocked);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const m = useMutation({
    // O bloqueio opcional é pedido na etapa seguinte (protótipo): aqui só a denúncia.
    mutationFn: () =>
      chat.report({
        conversationId: id,
        reason: reason!,
        details: details.trim() || undefined,
        alsoBlock: false,
      }),
    onSuccess: () => {
      setSent(true);
      onDone();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível enviar a denúncia.", "info"),
  });
  const finish = useMutation({
    mutationFn: async () => {
      if (alsoBlock && !blocked) await chat.block(id, true);
    },
    onSuccess: () => {
      toast(
        alsoBlock && !blocked
          ? `Denúncia enviada e ${name} bloqueada.`
          : "Denúncia enviada. Obrigado por avisar.",
      );
      onDone();
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível bloquear.", "info"),
  });
  if (sent)
    return (
      <Modal title="Recebemos sua denúncia. Nossa equipe vai analisar." onClose={onClose}>
        <p className="text-sm leading-[21px] text-text-muted">
          Obrigado por ajudar a manter a EncontraÊ segura. Você recebe um aviso quando a análise terminar.
        </p>
        {!blocked && (
          <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-border bg-bg px-3.5 py-3 text-sm text-text">
            <input
              type="checkbox"
              className="size-[18px] accent-primary"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
            />
            <span className="flex flex-col">
              <b>Também bloquear esta loja</b>
              <span className="text-xs leading-4 text-text-subtle">
                {name} não poderá mais enviar mensagens para você.
              </span>
            </span>
          </label>
        )}
        <button
          type="button"
          disabled={finish.isPending}
          onClick={() => finish.mutate()}
          className="h-11 rounded-lg bg-primary text-[15px] font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
        >
          Concluir
        </button>
      </Modal>
    );
  return (
    <Modal title={`Denunciar ${name}`} onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const er = validateReport(reason, details);
          setErrors(er);
          if (!Object.keys(er).length) m.mutate();
        }}
        className="flex flex-col gap-4"
      >
        <p className="text-sm leading-[21px] text-text-muted">
          Por que você está denunciando esta conversa? A loja não fica sabendo quem denunciou.
        </p>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Motivo da denúncia</legend>
          {REPORT_REASONS.map((r) => (
            <label
              key={r.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-3 text-sm leading-5 text-text",
                reason === r.id ? "border-primary bg-selected/50" : "border-border bg-surface",
              )}
            >
              <input
                type="radio"
                name="reason"
                className="size-[18px] accent-primary"
                checked={reason === r.id}
                onChange={() => {
                  setReason(r.id);
                  setErrors({});
                }}
              />
              {r.label}
            </label>
          ))}
        </fieldset>
        {reason === "other" && (
          <label className="flex flex-col gap-1.5 text-[13px] font-bold text-text">
            Conte o que aconteceu
            <textarea
              value={details}
              maxLength={400}
              rows={3}
              placeholder="Descreva rapidamente o problema"
              onChange={(e) => setDetails(e.target.value)}
              aria-invalid={!!errors.details}
              className="resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm leading-5 font-normal text-text"
            />
          </label>
        )}
        {(errors.reason || errors.details) && (
          <p role="alert" className="text-[13px] leading-[18px] text-danger-text">
            {errors.reason ?? errors.details}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-surface-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={m.isPending}
            className="h-10 rounded-lg bg-primary px-[18px] text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            Enviar denúncia
          </button>
        </div>
      </form>
    </Modal>
  );
}
