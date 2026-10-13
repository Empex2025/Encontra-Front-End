"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Star, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/components/ui/cn";
import { ErrorState } from "@/components/ui/error-state";
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
  if (!valid) return <Missing />;
  if (target.isPending) return <p className="text-text-muted">Carregando…</p>;
  if (target.isError)
    return target.error instanceof ApiError && target.error.status === 404 ? (
      <Missing />
    ) : (
      <ErrorState error={target.error} onRetry={() => target.refetch()} />
    );
  return <Form type={tipo as ReviewType} slug={id!} target={target.data} />;
}

function Missing() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-2xl font-bold text-text-strong">Não encontramos o que você quer avaliar</h1>
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 pb-28">
      <button
        type="button"
        onClick={back}
        className="inline-flex items-center gap-1.5 self-start py-2 text-sm font-semibold text-link hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar {type === "produto" ? "ao produto" : "ao perfil"}
      </button>
      <h1 className="text-2xl font-bold text-text-strong">{TITLE[type]}</h1>
      <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
        <span className="size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
          {target.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={target.imageUrl} alt="" className="size-full object-cover" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-text-strong">{target.title}</p>
          {target.subtitle && <p className="truncate text-sm text-text-muted">{target.subtitle}</p>}
          {target.neighborhood && <p className="text-xs text-text-subtle">{target.neighborhood}</p>}
        </div>
      </div>
      {tried && Object.keys(errors).length > 0 && (
        <p role="alert" className="bg-danger-bg rounded-lg px-3 py-2 text-sm font-semibold text-danger-text">
          Falta pouco: confira os itens marcados abaixo para publicar.
        </p>
      )}

      <section aria-labelledby="r1" className="flex flex-col gap-2">
        <h2 id="r1" className="font-bold text-text-strong">
          1 · Qual nota você dá? *
        </h2>
        <div role="radiogroup" aria-label="Nota" className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
              onClick={() => setRatingSafe(n)}
              className="flex size-11 items-center justify-center"
            >
              <Star
                className={cn("size-8", n <= rating ? "fill-accent text-accent" : "text-border-strong")}
                aria-hidden
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-text-muted">{RATING_LABEL[rating]}</span>
        </div>
        {tried && errors.rating && (
          <p role="alert" className="text-xs font-semibold text-danger-text">
            {errors.rating}
          </p>
        )}
      </section>

      <section aria-labelledby="r2" className="flex flex-col gap-2">
        <h2 id="r2" className="font-bold text-text-strong">
          2 · Fotos e vídeo *
        </h2>
        <p className="text-sm text-text-muted">
          Mínimo de {MIN_PHOTOS} fotos, até {MAX_PHOTOS}. Vídeo opcional de até 60 segundos.
        </p>
        <ul
          className={cn(
            "flex flex-wrap gap-2 rounded-xl p-1",
            tried && errors.photos && "ring-2 ring-danger",
          )}
        >
          {photos.map((p, i) => (
            <li key={p.id} className="relative size-20 overflow-hidden rounded-lg bg-surface-2">
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
                className="absolute top-0.5 right-0.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
          {photos.length < MAX_PHOTOS && (
            <li>
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong text-xs font-semibold text-text-muted hover:bg-surface-2"
              >
                <ImagePlus className="size-5" aria-hidden />
                Adicionar foto {photos.length}/{MAX_PHOTOS}
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
        {tried && errors.photos && (
          <p role="alert" className="text-xs font-semibold text-danger-text">
            {errors.photos}
          </p>
        )}
        {video ? (
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-2 text-sm">
            <Video className="size-4" aria-hidden />
            <span className="flex-1">
              {video.status === "uploading"
                ? "Enviando vídeo…"
                : video.status === "error"
                  ? "Falha no envio do vídeo"
                  : "Vídeo adicionado"}
            </span>
            <button
              type="button"
              onClick={() => setVideo(null)}
              aria-label="Remover vídeo"
              className="flex size-8 items-center justify-center rounded-full hover:bg-border"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            className="inline-flex h-10 items-center gap-1.5 self-start rounded-lg border border-border-strong px-3 text-sm font-semibold hover:bg-surface-2"
          >
            <Video className="size-4" aria-hidden />
            Adicionar vídeo (opcional)
          </button>
        )}
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
        {mediaError && (
          <p role="alert" className="text-xs font-semibold text-danger-text">
            {mediaError}
          </p>
        )}
        <p className="text-xs text-text-subtle">
          JPG, PNG ou MP4. Evite rostos de outras pessoas e dados pessoais nas imagens.
        </p>
      </section>

      <section aria-labelledby="r3" className="flex flex-col gap-2">
        <h2 id="r3" className="font-bold text-text-strong">
          3 · Quer contar mais? (opcional)
        </h2>
        <textarea
          value={text}
          maxLength={COMMENT_MAX}
          rows={4}
          onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX))}
          aria-label="Comentário"
          className="rounded-lg border border-border-strong bg-surface p-3 text-text"
        />
        <p className="self-end text-xs text-text-subtle">
          {text.length}/{COMMENT_MAX}
        </p>
      </section>

      <section aria-labelledby="r4" className="flex flex-col gap-2">
        <button
          type="button"
          id="r4"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 items-center justify-between rounded-lg border border-border px-3 text-left font-bold text-text-strong hover:bg-surface-2"
        >
          4 · Destaques e atendimento (opcional)<span aria-hidden>{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="flex flex-col gap-4 p-1">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-text-strong">
                O que mais chamou sua atenção?
              </legend>
              <ul className="flex flex-wrap gap-2">
                {highlightsFor(rating).map((h) => (
                  <li key={h}>
                    <button
                      type="button"
                      aria-pressed={highlights.includes(h)}
                      onClick={() =>
                        setHighlights((x) => (x.includes(h) ? x.filter((y) => y !== h) : [...x, h]))
                      }
                      className={cn(
                        "h-10 rounded-full border px-3 text-sm font-semibold",
                        highlights.includes(h)
                          ? "border-primary bg-primary text-on-primary"
                          : "border-border-strong text-text hover:bg-surface-2",
                      )}
                    >
                      {h}
                    </button>
                  </li>
                ))}
              </ul>
            </fieldset>
            {(
              [
                ["service", "Atendimento da loja"],
                ["response", "Tempo de resposta"],
              ] as const
            ).map(([k, label]) => (
              <div key={k} role="radiogroup" aria-label={label} className="flex items-center gap-2">
                <span className="w-44 text-sm font-semibold text-text-strong">{label}</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={extras[k] === n}
                    aria-label={`${label}: ${n}`}
                    onClick={() => setExtras((x) => ({ ...x, [k]: x[k] === n ? 0 : n }))}
                    className={cn(
                      "size-10 rounded-full border text-sm font-bold",
                      extras[k] === n
                        ? n <= 2
                          ? "border-danger bg-danger text-white"
                          : n === 3
                            ? "border-warning bg-warning text-on-accent"
                            : "border-success bg-success text-white"
                        : "border-border-strong text-text-2",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <label className="flex items-start gap-3 rounded-xl border border-border p-3">
        <input
          type="checkbox"
          role="switch"
          checked={showName}
          onChange={(e) => setShowName(e.target.checked)}
          className="mt-0.5 size-5"
        />
        <span>
          <span className="block font-semibold text-text-strong">Mostrar meu nome na avaliação</span>
          <span className="text-sm text-text-muted">
            Será exibido como <b>{displayName(me?.name, showName)}</b>
          </span>
        </span>
      </label>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface p-3 max-md:bottom-16">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-3">
          <p className="text-xs text-text-muted" aria-live="polite">
            {rating > 0 ? "✓" : "○"} Nota · {okPhotos.length >= MIN_PHOTOS ? "✓" : "○"} Fotos{" "}
            {Math.min(okPhotos.length, MIN_PHOTOS)}/{MIN_PHOTOS}
          </p>
          <button
            type="button"
            onClick={saveDraft}
            className="ml-auto h-11 rounded-lg border border-border-strong px-4 text-sm font-semibold hover:bg-surface-2"
          >
            Salvar rascunho
          </button>
          <button
            type="button"
            disabled={publish.isPending}
            aria-disabled={uploading || undefined}
            onClick={onPublish}
            className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            {publish.isPending ? "Publicando…" : uploading ? "Aguardando envio…" : "Publicar avaliação"}
          </button>
        </div>
      </div>

      {leave && (
        <Modal title="Sair sem publicar?" onClose={() => setLeave(false)}>
          <p className="text-text">
            Você preencheu parte da avaliação. Se sair agora, o que escreveu se perde (a não ser que salve um
            rascunho).
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push(target.backHref)}
              className="h-11 flex-1 rounded-lg bg-danger font-bold text-white"
            >
              Sair
            </button>
            <button
              type="button"
              onClick={() => setLeave(false)}
              className="h-11 rounded-lg border border-border-strong px-5 font-semibold"
            >
              Continuar avaliando
            </button>
          </div>
        </Modal>
      )}
      {done && (
        <Modal title="Avaliação enviada!" onClose={() => router.push(target.backHref)}>
          <p className="text-text">Ela aparece na página em até 24 horas, depois de passar pela análise.</p>
          <p className="rounded-lg bg-surface-2 p-3 text-sm font-semibold text-text-strong">
            ★ {done.rating} · {done.photos} fotos · {done.video ? "1 vídeo" : "sem vídeo"} ·{" "}
            {done.comment ? "com comentário" : "sem comentário"}
          </p>
          <button
            type="button"
            onClick={() => router.push(target.backHref)}
            className="h-11 rounded-lg bg-primary font-bold text-on-primary"
          >
            Voltar
          </button>
        </Modal>
      )}
    </div>
  );
}
