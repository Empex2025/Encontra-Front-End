"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BellOff,
  EllipsisVertical,
  ImagePlus,
  MessageCircle,
  Phone,
  Search,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/catalog/avatar";
import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/track";
import { type Conversation, type ConversationDetail, chat, type Message, uploadFile } from "@/lib/api/chat";
import { queryKeys } from "@/lib/api/endpoints";
import {
  canSend,
  clipMessage,
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
const dayTime = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Maceio",
});
const shortTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = dayTime.format(new Date()) === dayTime.format(d);
  return today ? time.format(d) : dayTime.format(d);
};

/** Conversas: lista + conversa aberta. No celular, uma tela por vez (`/conversas` e `/conversas/{id}`). */
export function ConversationsView({ activeId }: { activeId?: string }) {
  const router = useRouter();
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
  });
  const first = list.data?.items[0]?.id;
  // Sem conversa pedida, no computador abre a primeira da lista.
  useEffect(() => {
    if (!activeId && first && window.matchMedia("(min-width: 768px)").matches)
      router.replace(conversaHref(first));
  }, [activeId, first, router]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <header className={cn("flex flex-col gap-1", activeId && "max-md:hidden")}>
        <h1 className="text-2xl font-bold text-text-strong">Conversas</h1>
        <p className="text-text-muted">
          Suas conversas com lojas e prestadores. Tudo combinado aqui, sem precisar do WhatsApp.
        </p>
      </header>
      <div className="grid min-h-[70dvh] gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
        <aside
          className={cn("flex flex-col gap-3", activeId && "max-md:hidden")}
          aria-label="Lista de conversas"
        >
          <label className="relative block">
            <span className="sr-only">Buscar conversa</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-subtle"
              aria-hidden
            />
            <input
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar loja ou produto"
              className="h-11 w-full rounded-lg border border-border-strong bg-surface pr-3 pl-9 text-text"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={!onlyUnread}
              onClick={() => setOnlyUnread(false)}
              className={chip(!onlyUnread)}
            >
              Todas
            </button>
            <button
              type="button"
              aria-pressed={onlyUnread}
              onClick={() => setOnlyUnread(true)}
              className={chip(onlyUnread)}
            >
              Não lidas{list.data && list.data.unreadTotal > 0 ? ` (${list.data.unreadTotal})` : ""}
            </button>
          </div>
          {list.isPending ? (
            <p className="text-text-muted">Carregando…</p>
          ) : list.isError ? (
            <ErrorState error={list.error} onRetry={() => list.refetch()} />
          ) : list.data.items.length === 0 ? (
            <p className="rounded-2xl border border-border p-6 text-center font-semibold text-text-strong">
              {q || onlyUnread ? "Nenhuma conversa encontrada." : "Nenhuma conversa"}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {list.data.items.map((c) => (
                <Row key={c.id} c={c} active={c.id === activeId} />
              ))}
            </ul>
          )}
        </aside>
        <section aria-label="Conversa aberta" className={cn("min-w-0", !activeId && "max-md:hidden")}>
          {activeId ? (
            <Thread key={activeId} id={activeId} />
          ) : (
            <div className="flex h-full min-h-60 flex-col items-center justify-center gap-2 rounded-2xl border border-border p-8 text-center text-text-muted">
              <MessageCircle className="size-8" aria-hidden />
              <p>Escolha uma conversa, ou abra uma pelo perfil de uma loja ou produto.</p>
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
    "h-10 rounded-full border px-4 text-sm font-semibold",
    on
      ? "border-primary bg-primary text-on-primary"
      : "border-border bg-surface text-text hover:bg-surface-2",
  );

function Row({ c, active }: { c: Conversation; active: boolean }) {
  return (
    <li>
      <Link
        href={conversaHref(c.id)}
        aria-current={active ? "page" : undefined}
        className={cn("flex gap-3 rounded-xl p-3 hover:bg-surface-2", active && "bg-surface-2")}
      >
        <span className="relative shrink-0">
          <Avatar name={c.profile.name} url={c.profile.avatarUrl} size={48} />
          {c.online && (
            <span
              className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface bg-success"
              role="img"
              aria-label="Online"
            />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5">
            <span className={cn("truncate text-text-strong", c.unread > 0 && "font-bold")}>
              {c.profile.name}
            </span>
            {c.muted && <BellOff className="size-3.5 shrink-0 text-text-subtle" aria-label="Silenciada" />}
            {c.last && (
              <span
                className={cn(
                  "ml-auto shrink-0 text-xs",
                  c.unread > 0 ? "font-bold text-danger-text" : "text-text-subtle",
                )}
              >
                {shortTime(c.last.at)}
              </span>
            )}
          </span>
          <span className="truncate text-xs text-text-subtle">{c.context ?? "Conversa"}</span>
          <span className="flex items-center gap-2">
            <span className={cn("truncate text-sm text-text-muted", c.unread > 0 && "font-bold text-text")}>
              {previewText(c)}
            </span>
            {c.unread > 0 && (
              <span
                className="ml-auto shrink-0 rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary"
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
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    endRef.current?.scrollIntoView({ block: "end" });
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

  if (detail.isPending) return <p className="text-text-muted">Carregando conversa…</p>;
  if (detail.isError) {
    const notFound = (detail.error as { status?: number }).status === 404;
    return notFound ? (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-border p-8 text-center">
        <p className="font-bold text-text-strong">Conversa não encontrada</p>
        <Link href={routes.conversas} className="text-sm font-semibold text-link hover:underline">
          Voltar às conversas
        </Link>
      </div>
    ) : (
      <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
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
  };

  return (
    <div className="flex h-[78dvh] min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <header className="flex items-center gap-3 border-b border-border p-3">
        <Link
          href={routes.conversas}
          aria-label="Voltar às conversas"
          className="flex size-10 items-center justify-center rounded-full hover:bg-surface-2 md:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Avatar name={c.profile.name} url={c.profile.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate font-bold text-text-strong">
            {c.profile.name}
            {c.muted && <BellOff className="size-3.5 text-text-subtle" aria-label="Silenciada" />}
          </p>
          <p className="text-xs text-text-muted">
            {c.blocked
              ? "Bloqueada"
              : c.status.online
                ? `● Online${c.status.responseText ? ` · ${c.status.responseText}` : ""}`
                : `Offline${c.status.responseText ? ` · ${c.status.responseText}` : ""}`}
          </p>
        </div>
        <Link
          href={c.profileHref}
          className="hidden h-10 items-center rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2 sm:flex"
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
            className="flex h-10 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2"
          >
            <Phone className="size-4" aria-hidden />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sr-only sm:hidden">WhatsApp</span>
          </a>
        )}
        <KebabMenu
          items={[
            { label: c.muted ? "Reativar avisos" : "Silenciar", onSelect: () => mute.mutate(!c.muted) },
            {
              label: c.blocked ? "Desbloquear" : "Bloquear",
              onSelect: () => (c.blocked ? unblock() : setDialog("block")),
            },
            { label: "Denunciar", onSelect: () => setDialog("report") },
            { label: "Apagar conversa", onSelect: () => setDialog("delete"), danger: true },
          ]}
        />
      </header>

      {c.product && (
        <Link
          href={produtoHref(c.product.slug)}
          className="flex items-center gap-3 border-b border-border bg-surface-2 p-3 text-sm hover:bg-border"
        >
          <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-surface">
            {c.product.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.product.imageUrl} alt="" className="size-full object-cover" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-text-strong">{c.product.title}</span>
            {c.product.priceCents !== null && (
              <span className="text-text-muted">{formatMoney(c.product.priceCents)}</span>
            )}
          </span>
          <span className="font-semibold text-link">Ver anúncio →</span>
        </Link>
      )}
      {c.blocked && (
        <p className="bg-danger-bg px-3 py-2 text-sm font-semibold text-danger-text">
          Você bloqueou esta loja. Desbloqueie para mandar mensagens.
        </p>
      )}
      <p className="border-b border-border px-3 py-1.5 text-xs text-text-subtle">
        Conversa protegida na EncontraÊ · nunca compartilhe senhas ou códigos
      </p>

      <div
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
        aria-live="polite"
        aria-label="Mensagens"
      >
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
          <p className="text-text-muted">Carregando…</p>
        ) : messages.length === 0 ? (
          <p className="m-auto text-sm text-text-muted">Nenhuma mensagem ainda. Diga olá!</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex max-w-[82%] flex-col gap-1 rounded-2xl px-3 py-2",
                m.mine ? "self-end bg-primary text-on-primary" : "self-start bg-surface-2 text-text",
              )}
            >
              {m.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imageUrl} alt="Foto enviada" className="max-h-64 rounded-lg object-cover" />
              )}
              {m.text && <p className="break-words whitespace-pre-wrap">{m.text}</p>}
              <p className={cn("text-[11px]", m.mine ? "text-on-primary/80" : "text-text-subtle")}>
                {m.mine ? "Você" : c.profile.name} · {time.format(new Date(m.at))}
              </p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {!c.blocked && (
        <ul
          className="flex gap-2 overflow-x-auto border-t border-border px-3 py-2"
          aria-label="Respostas rápidas"
        >
          {QUICK_QUESTIONS.map((t) => (
            <li key={t} className="shrink-0">
              <button
                type="button"
                disabled={quick.isPending}
                onClick={() => quick.mutate(t)}
                className="h-9 rounded-full border border-border bg-surface px-3 text-sm hover:bg-surface-2 disabled:opacity-60"
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}

      {file && (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt="Prévia da foto" className="size-14 rounded-lg object-cover" />
          <p className="flex-1 text-sm text-text-muted">Escreva uma legenda (opcional)…</p>
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(file.url);
              setFile(null);
            }}
            aria-label="Remover foto"
            className="flex size-9 items-center justify-center rounded-full hover:bg-surface-2"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}
      {fileError && (
        <p role="alert" className="px-3 pb-1 text-xs font-semibold text-danger-text">
          {fileError}
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!c.blocked && canSend(text, !!file) && !send.isPending) send.mutate();
        }}
        className="flex items-end gap-2 border-t border-border p-3"
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
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-strong hover:bg-surface-2 disabled:opacity-50"
        >
          <ImagePlus className="size-5" aria-hidden />
        </button>
        <textarea
          value={text}
          disabled={c.blocked}
          rows={1}
          maxLength={MESSAGE_MAX}
          aria-label="Mensagem"
          placeholder={c.blocked ? "Você bloqueou esta loja. Desbloqueie para mandar mensagens." : "Mensagem"}
          onChange={(e) => setText(clipMessage(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-text disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={c.blocked || !canSend(text, !!file) || send.isPending}
          aria-label="Enviar"
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden />
          <span className="hidden sm:inline">Enviar</span>
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
        toast("Loja desbloqueada.");
        refreshAll();
      },
      (e) => toast(e instanceof Error ? e.message : "Não foi possível desbloquear.", "info"),
    );
  }
}

function KebabMenu({ items }: { items: { label: string; onSelect: () => void; danger?: boolean }[] }) {
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
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções da conversa"
        onClick={() => setOpen((o) => !o)}
        className="flex size-10 items-center justify-center rounded-full hover:bg-surface-2"
      >
        <EllipsisVertical className="size-5" aria-hidden />
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
            onKeyDown={onKey}
            className="absolute top-11 right-0 z-20 w-52 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-pop"
          >
            {items.map((it) => (
              <li key={it.label} role="none">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    it.onSelect();
                  }}
                  className={cn(
                    "flex h-11 w-full items-center px-4 text-left text-sm hover:bg-surface-2",
                    it.danger && "text-danger-text",
                  )}
                >
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
      toast(`${name} bloqueada.`);
      onDone();
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível bloquear.", "info"),
  });
  return (
    <Modal title="Bloquear esta loja?" onClose={onClose}>
      <p className="text-text">
        A loja não poderá mais enviar mensagens para você por aqui, e você também não poderá responder
        enquanto ela estiver bloqueada. A loja não é avisada. Você pode desbloquear quando quiser.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={m.isPending}
          onClick={() => m.mutate()}
          className="h-11 flex-1 rounded-lg bg-danger font-bold text-white disabled:opacity-60"
        >
          Bloquear
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-lg border border-border-strong px-5 font-semibold"
        >
          Cancelar
        </button>
      </div>
    </Modal>
  );
}

function DeleteDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const m = useMutation({
    mutationFn: () => chat.remove(id),
    onSuccess: () => {
      toast("Conversa apagada.");
      onDone();
      onClose();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível apagar.", "info"),
  });
  return (
    <Modal title="Apagar conversa?" onClose={onClose}>
      <p className="text-text">
        As mensagens e fotos desta conversa serão apagadas só para você. Essa ação não pode ser desfeita.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={m.isPending}
          onClick={() => m.mutate()}
          className="h-11 flex-1 rounded-lg bg-danger font-bold text-white disabled:opacity-60"
        >
          Apagar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-lg border border-border-strong px-5 font-semibold"
        >
          Cancelar
        </button>
      </div>
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
    mutationFn: () =>
      chat.report({ conversationId: id, reason: reason!, details: details.trim() || undefined, alsoBlock }),
    onSuccess: () => {
      setSent(true);
      onDone();
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível enviar a denúncia.", "info"),
  });
  if (sent)
    return (
      <Modal title="Recebemos sua denúncia" onClose={onClose}>
        <p className="text-text">
          Nossa equipe vai analisar. Obrigado por ajudar a manter a EncontraÊ segura. Você recebe um aviso
          quando a análise terminar.
        </p>
        <button
          type="button"
          onClick={() => {
            toast(
              alsoBlock ? `Denúncia enviada e ${name} bloqueada.` : "Denúncia enviada. Obrigado por avisar.",
            );
            onClose();
          }}
          className="h-11 rounded-lg bg-primary font-bold text-on-primary"
        >
          Concluir
        </button>
      </Modal>
    );
  return (
    <Modal title="Denunciar conversa" onClose={onClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const er = validateReport(reason, details);
          setErrors(er);
          if (!Object.keys(er).length) m.mutate();
        }}
        className="flex flex-col gap-3"
      >
        <p className="text-sm text-text-muted">
          Por que você está denunciando esta conversa? A loja não fica sabendo quem denunciou.
        </p>
        <fieldset className="flex flex-col gap-1">
          <legend className="sr-only">Motivo</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.id} className="flex min-h-11 items-center gap-3">
              <input
                type="radio"
                name="reason"
                className="size-5"
                checked={reason === r.id}
                onChange={() => {
                  setReason(r.id);
                  setErrors({});
                }}
              />
              {r.label}
            </label>
          ))}
          {errors.reason && (
            <p role="alert" className="text-xs font-semibold text-danger-text">
              {errors.reason}
            </p>
          )}
        </fieldset>
        {reason === "other" && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Conte o que aconteceu
            <textarea
              value={details}
              maxLength={400}
              rows={3}
              onChange={(e) => setDetails(e.target.value)}
              aria-invalid={!!errors.details}
              className="rounded-lg border border-border-strong bg-surface p-3 font-normal"
            />
            {errors.details && (
              <span role="alert" className="text-xs font-semibold text-danger-text">
                {errors.details}
              </span>
            )}
          </label>
        )}
        {!blocked && (
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              className="size-5"
              checked={alsoBlock}
              onChange={(e) => setAlsoBlock(e.target.checked)}
            />
            Também bloquear esta loja
          </label>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={m.isPending}
            className="h-11 flex-1 rounded-lg bg-primary font-bold text-on-primary disabled:opacity-60"
          >
            Enviar denúncia
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-border-strong px-5 font-semibold"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
