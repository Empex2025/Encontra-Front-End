"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, Camera, Check, ChevronDown, Star, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { PageError } from "@/components/catalog/section-state";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/hooks/use-session";
import { uploadFile } from "@/lib/api/chat";
import { ApiError } from "@/lib/api/client";
import { type ReviewType, REVIEW_TYPES, reviews } from "@/lib/api/reviews";
import {
  COMMENT_MAX,
  displayName,
  draftKey,
  highlightsFor,
  MAX_PHOTOS,
  MIN_PHOTOS,
  nextHighlights,
  RATING_LABEL,
  validatePhoto,
  validateReview,
  validateVideo,
} from "@/lib/domain/review-form";
import { routes } from "@/lib/routes";

type Media = { id: string; url: string; status: "uploading" | "done" | "error"; key?: string };
const TITLE: Record<ReviewType, string> = {
  produto: "Avaliar produto",
  servico: "Avaliar serviço",
  loja: "Avaliar loja",
  prestador: "Avaliar prestador",
};

type Saved = { rating: number; text: string; highlights: string[]; showName: boolean };
const readSaved = (key: string): Saved | null => {
  try {
    const v = JSON.parse(window.localStorage.getItem(key) ?? "null");
    return v && typeof v.rating === "number"
      ? {
          rating: v.rating,
          text: String(v.text ?? ""),
          highlights: Array.isArray(v.highlights) ? v.highlights : [],
          showName: v.showName !== false,
        }
      : null;
  } catch {
    return null;
  }
};

export function ReviewForm({ tipo, id }: { tipo: string | undefined; id: string | undefined }) {
  const valid = (REVIEW_TYPES as readonly string[]).includes(tipo ?? "") && !!id;
  const target = useQuery({
    queryKey: ["review-target", tipo, id],
    enabled: valid,
    queryFn: () => reviews.target(tipo as ReviewType, id!),
    retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2,
  });
  if (!valid) return <Missing reason="link" />;
  if (target.isPending)
    return (
      <div
        aria-busy="true"
        aria-label="Carregando o item a avaliar"
        className="mx-auto flex w-full max-w-[800px] animate-pulse flex-col gap-4"
      >
        <div className="h-8 w-1/2 rounded bg-surface-2" />
        <div className="h-20 rounded-2xl bg-surface-2" />
        <div className="h-32 rounded-2xl bg-surface-2" />
      </div>
    );
  if (target.isError)
    return target.error instanceof ApiError && target.error.status === 404 ? (
      <Missing reason="notfound" />
    ) : (
      <PageError
        what="o item a avaliar"
        error={target.error}
        onRetry={() => target.refetch()}
        backHref={routes.explorar}
        backLabel="Buscar no Explorar"
      />
    );
  return <Form type={tipo as ReviewType} slug={id!} target={target.data} />;
}

/** `link`: o endereço veio sem tipo/identificador válidos. `notfound`: o item não existe mais. */
function Missing({ reason }: { reason: "link" | "notfound" }) {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-text-strong">Não encontramos o que você quer avaliar</h1>
      <p className="text-text-muted">
        {reason === "link"
          ? "O endereço está incompleto. Para avaliar, abra um produto, uma loja ou um prestador e toque em “Avaliar”."
          : "O item pode ter sido removido ou o endereço está incorreto."}
      </p>
      <Link
        href={routes.explorar}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-on-primary"
      >
        Buscar no Explorar
      </Link>
    </section>
  );
}

function Form({
  type,
  slug,
  target,
}: {
  type: ReviewType;
  slug: string;
  target: NonNullable<ReturnType<typeof useQuery<Awaited<ReturnType<typeof reviews.target>>>>["data"]>;
}) {
  const router = useRouter();
  const toast = useToast();
  const { me } = useSession();
  const key = draftKey(type, slug);
  const [init] = useState<Saved>(
    () =>
      (typeof window === "undefined" ? null : readSaved(key)) ?? {
        rating: 0,
        text: "",
        highlights: [],
        showName: true,
      },
  );

  const [rating, setRating] = useState(init.rating);
  const [text, setText] = useState(init.text);
  const [highlights, setHighlights] = useState<string[]>(init.highlights);
  const [showName, setShowName] = useState(init.showName);
  const [open, setOpen] = useState(false);
  const [extras, setExtras] = useState<{ service: number; response: number }>({ service: 0, response: 0 });
  const [photos, setPhotos] = useState<Media[]>([]);
  const [video, setVideo] = useState<Media | null>(null);
  const [tried, setTried] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [leave, setLeave] = useState(false);
  const [done, setDone] = useState<{
    rating: number;
    photos: number;
    video: boolean;
    comment: boolean;
  } | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const uploading = photos.some((p) => p.status === "uploading") || video?.status === "uploading";
  const okPhotos = photos.filter((p) => p.status === "done");
  const errors = validateReview({ rating, photos: okPhotos.length, uploading: !!uploading });
  const dirty = rating > 0 || text.trim().length > 0 || photos.length > 0 || !!video || highlights.length > 0;

  useEffect(() => {
    if (!dirty || done) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, done]);

  const setRatingSafe = (n: number) => {
    setHighlights((h) => nextHighlights(h, rating, n));
    setRating(n);
  };

  const upload = (file: File, set: (m: Media) => void, patch: (id: string, p: Partial<Media>) => void) => {
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    set({ id, url, status: "uploading" });
    uploadFile("review", file).then(
      (k) => patch(id, { status: "done", key: k }),
      (e) => {
        patch(id, { status: "error" });
        toast(e instanceof Error ? e.message : "Falha no envio da mídia.", "info");
      },
    );
  };

  const addPhotos = (files: FileList | null) => {
    setMediaError("");
    for (const f of Array.from(files ?? [])) {
      if (photos.length >= MAX_PHOTOS) break;
      const err = validatePhoto(f);
      if (err) {
        setMediaError(err);
        continue;
      }
      upload(
        f,
        (m) => setPhotos((p) => (p.length < MAX_PHOTOS ? [...p, m] : p)),
        (id, patch) => setPhotos((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      );
    }
  };

  const addVideo = async (f: File | undefined) => {
    if (!f) return;
    setMediaError("");
    const seconds = await new Promise<number | null>((res) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => res(v.duration);
      v.onerror = () => res(null);
      v.src = URL.createObjectURL(f);
    });
    const err = validateVideo(f, seconds);
    if (err) return setMediaError(err);
    upload(
      f,
      (m) => setVideo(m),
      (_id, patch) => setVideo((v) => (v ? { ...v, ...patch } : v)),
    );
  };

  const publish = useMutation({
    mutationFn: () =>
      reviews.publish({
        targetType: type,
        targetId: target.id,
        rating,
        photoKeys: okPhotos.map((p) => p.key!),
        videoKey: video?.status === "done" ? video.key : undefined,
        text: text.trim() ? text.trim().slice(0, COMMENT_MAX) : undefined,
        highlights,
        extras:
          extras.service || extras.response
            ? { service: extras.service || undefined, response: extras.response || undefined }
            : undefined,
        showName,
      }),
    onSuccess: () => {
      try {
        window.localStorage.removeItem(key);
      } catch {}
      setDone({
        rating,
        photos: okPhotos.length,
        video: video?.status === "done",
        comment: text.trim().length > 0,
      });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Não foi possível publicar a avaliação.", "info"),
  });

  const onPublish = () => {
    setTried(true);
    if (uploading) return toast("Espere as fotos terminarem de enviar.", "info");
    if (Object.keys(errors).length) return;
    publish.mutate();
  };
  const saveDraft = () => {
    try {
      window.localStorage.setItem(key, JSON.stringify({ rating, text, highlights, showName }));
      toast("Rascunho salvo neste navegador. As fotos não são guardadas.");
    } catch {
      toast("Não foi possível salvar o rascunho.", "info");
    }
  };
  const back = () => (dirty ? setLeave(true) : router.push(target.backHref));

  const moreSub = open
    ? "Toque para fechar"
    : highlights.length || extras.service || extras.response
      ? [
          highlights.length
            ? `${highlights.length} ${highlights.length === 1 ? "destaque" : "destaques"}`
            : null,
          extras.service ? `atendimento ${extras.service}★` : null,
          extras.response ? `resposta ${extras.response}★` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "Toque para abrir";
  const card = "flex flex-col gap-4 rounded-2xl bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-7";
  const photosOk = okPhotos.length >= MIN_PHOTOS;

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col gap-5 pb-28">
      <button
        type="button"
        onClick={back}
        className="inline-flex items-center gap-1 self-start py-1 text-sm font-semibold text-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar {type === "produto" ? "ao produto" : type === "servico" ? "ao serviço" : "ao perfil"}
      </button>
      <div className="flex flex-col gap-1">
        <h1 className="text-[32px] leading-10 font-bold text-text-strong">{TITLE[type]}</h1>
        <p className="text-base leading-6 text-text-2">
          Sua opinião ajuda outras pessoas a encontrar bons produtos e serviços perto delas.
        </p>
      </div>
      <div className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm">
        <span className="size-[72px] shrink-0 overflow-hidden rounded-lg bg-surface-3">
          {target.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={target.imageUrl} alt="" className="size-full object-cover" />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-base leading-6 font-semibold text-text">{target.title}</p>
          {target.subtitle && <p className="truncate text-[13px] leading-5 text-text-2">{target.subtitle}</p>}
          {target.neighborhood && <p className="text-[13px] leading-5 text-text-2">{target.neighborhood}</p>}
        </div>
      </div>
      {tried && Object.keys(errors).length > 0 && (
        <p
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-danger/40 bg-danger-soft px-4 py-3.5 text-sm font-semibold text-danger-text"
        >
          <AlertCircle className="size-[18px] shrink-0" aria-hidden />
          Falta pouco: confira os itens marcados abaixo para publicar.
        </p>
      )}

      <section aria-labelledby="r1" className={card}>
        <StepHead n={1} id="r1" title="Qual nota você dá?" required hint="Toque nas estrelas para avaliar." />
        <div className="flex flex-col gap-3.5 sm:pl-[42px]">
          <div role="radiogroup" aria-label="Nota" className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
                  onClick={() => setRatingSafe(n)}
                  className="flex items-center justify-center p-0.5"
                >
                  <Star
                    className={cn(
                      "size-10",
                      n <= rating ? "fill-accent text-accent-hover" : "text-accent-hover",
                    )}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
            <span className={cn("text-base leading-6 font-bold", labelTone(rating))}>
              {RATING_LABEL[rating] || "Sem nota"}
            </span>
          </div>
          {tried && errors.rating && <FieldError>{errors.rating}</FieldError>}
        </div>
      </section>

      <section aria-labelledby="r2" className={card}>
        <StepHead
          n={2}
          id="r2"
          title="Fotos e vídeo"
          required
          hint={`Mínimo de ${MIN_PHOTOS} fotos, até ${MAX_PHOTOS}. Vídeo opcional de até 60 segundos.`}
        />
        <div className="flex flex-col gap-3.5 sm:pl-[42px]">
          <ul className="flex flex-wrap gap-3">
            {photos.map((p, i) => (
              <li key={p.id} className="relative size-[120px] overflow-hidden rounded-lg bg-surface-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                {p.status !== "done" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                    {p.status === "uploading" ? "Enviando…" : "Falhou"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}
                  aria-label={`Remover foto ${i + 1}`}
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-navy/75 text-white"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
            {video && (
              <li className="relative flex size-[120px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-surface-3 text-center text-xs font-bold text-text-strong">
                <Video className="size-6" aria-hidden />
                {video.status === "uploading"
                  ? "Enviando vídeo…"
                  : video.status === "error"
                    ? "Falha no envio"
                    : "Vídeo adicionado"}
                <button
                  type="button"
                  onClick={() => setVideo(null)}
                  aria-label="Remover vídeo"
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-navy/75 text-white"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            )}
            {photos.length < MAX_PHOTOS && (
              <li>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className={cn(
                    "flex size-[120px] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed bg-bg text-[13px] font-semibold text-text-strong hover:bg-surface-2",
                    tried && errors.photos ? "border-danger" : "border-navy-300",
                  )}
                >
                  <Camera className="size-6" aria-hidden />
                  <span>Adicionar foto</span>
                  <span className="text-[11px] font-medium text-text-muted">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </button>
              </li>
            )}
            {!video && (
              <li>
                <button
                  type="button"
                  onClick={() => videoRef.current?.click()}
                  className="flex size-[120px] flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-navy-300 bg-bg text-[13px] font-semibold text-text-strong hover:bg-surface-2"
                >
                  <Video className="size-6" aria-hidden />
                  <span>Adicionar vídeo</span>
                  <span className="text-[11px] font-medium text-text-muted">opcional</span>
                </button>
              </li>
            )}
          </ul>
          <input
            ref={photoRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void addVideo(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <p className="text-[13px] leading-5 text-text-muted">
            JPG, PNG ou MP4. Evite rostos de outras pessoas e dados pessoais nas imagens.
          </p>
          {tried && errors.photos && <FieldError>{errors.photos}</FieldError>}
          {mediaError && <FieldError>{mediaError}</FieldError>}
        </div>
      </section>

      <section aria-labelledby="r3" className={card}>
        <StepHead
          n={3}
          id="r3"
          title="Quer contar mais?"
          optional
          hint="Fale do que achou do produto ou serviço e do atendimento."
        />
        <div className="flex flex-col gap-3.5 sm:pl-[42px]">
          <textarea
            value={text}
            maxLength={COMMENT_MAX}
            rows={5}
            onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX))}
            aria-label="Seu comentário (opcional)"
            placeholder="Ex.: Fui atendido rápido pelo WhatsApp e era igual ao das fotos…"
            className="min-h-32 w-full resize-y rounded-lg border border-border bg-surface px-4 py-3.5 text-[15px] leading-6 text-text placeholder:text-text-subtle"
          />
          <p className="self-end text-[13px] leading-5 text-text-muted">
            {text.length}/{COMMENT_MAX}
          </p>
        </div>
      </section>

      <section aria-labelledby="r4" className="flex flex-col rounded-2xl bg-surface shadow-sm">
        <button
          type="button"
          id="r4"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center justify-between gap-4 rounded-2xl px-5 py-[22px] text-left sm:px-8"
        >
          <span className="flex items-start gap-3.5">
            <StepBadge n={4} />
            <span className="flex flex-col gap-0.5">
              <span className="text-xl leading-7 font-bold text-text-strong">
                Destaques e atendimento{" "}
                <span className="text-sm font-medium text-text-muted">(opcional)</span>
              </span>
              <span className="text-sm leading-5 text-text-2">{moreSub}</span>
            </span>
          </span>
          <ChevronDown
            className={cn("size-5 shrink-0 text-text-strong transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        {open && (
          <div className="flex flex-col gap-5 px-5 pb-7 sm:pr-8 sm:pl-[74px]">
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-2.5 text-sm leading-5 font-bold text-text">
                O que mais chamou sua atenção?
              </legend>
              <ul className="flex flex-wrap gap-2">
                {highlightsFor(rating).map((h) => {
                  const on = highlights.includes(h);
                  return (
                    <li key={h}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setHighlights((x) => (on ? x.filter((y) => y !== h) : [...x, h]))}
                        className={cn(
                          "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold",
                          on
                            ? "border-primary bg-primary text-on-primary"
                            : "border-border-strong text-text hover:bg-surface-2",
                        )}
                      >
                        {on && <Check className="size-4" aria-hidden />}
                        {h}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <div className="grid gap-x-4 gap-y-3.5 sm:grid-cols-[200px_1fr] sm:items-center">
              {(
                [
                  ["service", "Atendimento da loja"],
                  ["response", "Tempo de resposta"],
                ] as const
              ).map(([k, label]) => (
                <Fragment key={k}>
                  <span className="text-sm leading-5 font-semibold text-text">{label}</span>
                  <div role="radiogroup" aria-label={label} className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={extras[k] === n}
                          aria-label={`${label}: ${n} ${n === 1 ? "estrela" : "estrelas"}`}
                          onClick={() => setExtras((x) => ({ ...x, [k]: x[k] === n ? 0 : n }))}
                          className="flex items-center justify-center p-0.5"
                        >
                          <Star
                            className={cn("size-7 text-accent-hover", n <= extras[k] && "fill-accent")}
                            aria-hidden
                          />
                        </button>
                      ))}
                    </div>
                    <span className={cn("text-base leading-6 font-bold", labelTone(extras[k]))}>
                      {extras[k] ? RATING_LABEL[extras[k]] : ""}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-5 shadow-sm sm:px-8">
        <div className="flex flex-col gap-0.5">
          <span className="text-base leading-6 font-bold text-text-strong">
            Mostrar meu nome na avaliação
          </span>
          <span className="text-[13px] leading-5 text-text-2">
            Será exibido como <strong>{displayName(me?.name, showName)}</strong>
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showName}
          aria-label="Mostrar meu nome na avaliação"
          onClick={() => setShowName((v) => !v)}
          className={cn(
            "relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors",
            showName ? "bg-primary" : "bg-border-strong",
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] size-6 rounded-full bg-white shadow transition-[left]",
              showName ? "left-[25px]" : "left-[3px]",
            )}
          />
        </button>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 py-3 shadow-[0_-4px_6px_rgba(0,0,0,0.06)] max-md:bottom-16 lg:py-4">
        <div className="mx-auto flex max-w-[800px] flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-4 text-[13px] leading-5 font-semibold" aria-live="polite">
            <CheckPill ok={rating > 0} label="Nota" />
            <CheckPill ok={photosOk} label={`Fotos ${Math.min(okPhotos.length, MIN_PHOTOS)}/${MIN_PHOTOS}`} />
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveDraft}
              className="h-12 rounded-lg border border-primary bg-surface px-5 text-base font-medium text-text-strong hover:bg-selected"
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              disabled={publish.isPending}
              aria-disabled={uploading || undefined}
              onClick={onPublish}
              className="h-12 min-w-[210px] rounded-lg bg-primary px-6 text-base font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-80"
            >
              {publish.isPending ? "Publicando…" : uploading ? "Aguardando envio…" : "Publicar avaliação"}
            </button>
          </div>
        </div>
      </div>

      {leave && (
        <Modal title="Sair sem publicar?" onClose={() => setLeave(false)}>
          <p className="text-text-2">
            Você pode salvar como rascunho e terminar depois. Se descartar, a nota, o texto e os destaques
            serão perdidos (as fotos nunca ficam no rascunho).
          </p>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(target.backHref)}
              className="h-11 rounded-lg px-4 font-semibold text-danger-text hover:bg-danger-soft"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => setLeave(false)}
              className="h-11 rounded-lg border border-primary px-4 font-medium text-text-strong hover:bg-selected"
            >
              Continuar editando
            </button>
            <button
              type="button"
              onClick={() => {
                saveDraft();
                router.push(target.backHref);
              }}
              className="h-11 rounded-lg bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover"
            >
              Salvar e sair
            </button>
          </div>
        </Modal>
      )}
      {done && (
        <Modal title="Avaliação enviada!" onClose={() => router.push(target.backHref)}>
          <p className="text-text-2">
            {me?.name ? `Obrigado, ${me.name.split(" ")[0]}. ` : "Obrigado. "}
            Sua avaliação passa por uma checagem rápida e aparece na página em até 24 horas.
          </p>
          <p className="flex flex-wrap justify-center gap-x-5 gap-y-1 rounded-lg bg-bg p-3.5 text-sm text-text">
            <span>
              <strong className="text-accent-text">★ {done.rating}</strong> nota
            </span>
            <span>{done.photos} fotos</span>
            <span>{done.video ? "1 vídeo" : "sem vídeo"}</span>
            <span>{done.comment ? "com comentário" : "sem comentário"}</span>
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => router.push(target.backHref)}
              className="h-12 rounded-lg bg-primary font-semibold text-on-primary hover:bg-primary-hover"
            >
              Voltar {type === "produto" ? "ao produto" : type === "servico" ? "ao serviço" : "ao perfil"}
            </button>
            <button
              type="button"
              onClick={() => router.push(routes.explorar)}
              className="h-12 rounded-lg border border-primary font-medium text-text-strong hover:bg-selected"
            >
              Avaliar outro produto ou serviço
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function labelTone(n: number) {
  return n >= 4
    ? "text-success-text"
    : n === 3
      ? "text-accent-text"
      : n >= 1
        ? "text-danger-text"
        : "text-text-subtle";
}

function StepBadge({ n }: { n: number }) {
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-selected text-[13px] font-bold text-text-strong"
    >
      {n}
    </span>
  );
}

function StepHead({
  n,
  id,
  title,
  hint,
  required,
  optional,
}: {
  n: number;
  id: string;
  title: string;
  hint: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <StepBadge n={n} />
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="text-xl leading-7 font-bold text-text-strong">
          {title}
          {required && (
            <span className="ml-1 text-danger" aria-hidden>
              *
            </span>
          )}
          {optional && <span className="ml-1.5 text-sm font-medium text-text-muted">(opcional)</span>}
        </h2>
        <p className="text-sm leading-5 text-text-2">{hint}</p>
      </div>
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-[13px] leading-5 font-semibold text-danger-text"
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}

function CheckPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn("flex items-center gap-1.5", ok ? "text-success-text" : "text-text-muted")}>
      <span
        aria-hidden
        className={cn(
          "flex size-[18px] items-center justify-center rounded-full text-white",
          ok ? "bg-success" : "bg-border-strong",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      {label}
    </span>
  );
}
