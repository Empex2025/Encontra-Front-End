"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/components/ui/cn";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/hooks/use-theme";
import { account, type Profile, type ProfilePatch } from "@/lib/api/account";
import { saveWhatsappMode } from "@/lib/domain/whatsapp";
import { routes } from "@/lib/routes";

import { Card, errMsg, type ProfileState, ProfileStatus } from "./shared";

export function usePatchProfile() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => account.saveProfile(patch),
    onSuccess: (fresh) => qc.setQueryData(["me", "profile"], fresh),
    onError: (e) => toast(errMsg(e, "Não foi possível salvar."), "info"),
  });
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg border border-border-strong p-1"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-10 rounded-md px-4 text-sm font-semibold",
            value === o.id ? "bg-primary text-on-primary" : "text-text-2 hover:bg-surface-2",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TabConfig({ profile, profileState }: { profile?: Profile; profileState: ProfileState }) {
  const { theme, system, setTheme, setSystem } = useTheme();
  const mode = system ? "system" : theme;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Aparência">
        <Segmented
          label="Aparência"
          value={mode}
          options={[
            { id: "light", label: "Claro" },
            { id: "dark", label: "Escuro" },
            { id: "system", label: "Do aparelho" },
          ]}
          onChange={(v) => (v === "system" ? setSystem() : setTheme(v))}
        />
      </Card>
      {profile ? (
        <SavedSettings profile={profile} />
      ) : (
        <>
          <Card title="Abrir o WhatsApp">
            <ProfileStatus state={profileState} />
          </Card>
          <Card title="Mídia e sons">
            <ProfileStatus state={profileState} />
          </Card>
        </>
      )}
      <Card title="Idioma">
        <p className="text-text">Português (Brasil)</p>
        <p className="text-sm text-text-muted">Por enquanto a EncontraÊ só está disponível em português.</p>
      </Card>
      <Card title="Sobre">
        <ul className="flex flex-col gap-1 text-link">
          {[
            ["Como funciona", "sobre"],
            ["Termos de Uso", "termos"],
            ["Privacidade", "privacidade"],
            ["Cookies", "cookies"],
          ].map(([l, d]) => (
            <li key={d}>
              <Link
                href={`${routes.institucional}/${d}`}
                className="inline-flex min-h-11 items-center font-semibold hover:underline"
              >
                {l}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={routes.ajuda}
              className="inline-flex min-h-11 items-center font-semibold hover:underline"
            >
              Central de Ajuda
            </Link>
          </li>
        </ul>
      </Card>
    </div>
  );
}

/** Preferências gravadas na conta (WhatsApp, vídeos e sons): só aparecem com o perfil carregado. */
function SavedSettings({ profile }: { profile: Profile }) {
  const patch = usePatchProfile();
  const [wa, setWa] = useState(profile.settings.whatsappOpen);
  return (
    <>
      <Card title="Abrir o WhatsApp">
        <Segmented
          label="Abrir o WhatsApp"
          value={wa}
          options={[
            { id: "app", label: "No aplicativo" },
            { id: "web", label: "No navegador" },
          ]}
          onChange={(v) => {
            setWa(v);
            saveWhatsappMode(v);
            patch.mutate({ settings: { whatsappOpen: v } });
          }}
        />
        <p className="text-sm text-text-muted">
          Vale para os botões “Chamar no WhatsApp” de lojas e prestadores.
        </p>
      </Card>
      <Card title="Mídia e sons" className="divide-y divide-border">
        <Switch
          label="Reproduzir vídeos automaticamente"
          checked={profile.settings.autoplay}
          onChange={(v) => patch.mutate({ settings: { autoplay: v } })}
        />
        <Switch
          label="Sons do aplicativo"
          checked={profile.settings.sounds}
          onChange={(v) => patch.mutate({ settings: { sounds: v } })}
        />
      </Card>
    </>
  );
}
