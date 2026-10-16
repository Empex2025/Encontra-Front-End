"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/hooks/use-theme";
import { account, type Profile, type ProfilePatch } from "@/lib/api/account";
import { saveWhatsappMode } from "@/lib/domain/whatsapp";
import { routes } from "@/lib/routes";

import { Card, ChoicePill, errMsg, type ProfileState, ProfileStatus, SettingRow } from "./shared";

export function usePatchProfile() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (patch: ProfilePatch) => account.saveProfile(patch),
    onSuccess: (fresh) => qc.setQueryData(["me", "profile"], fresh),
    onError: (e) => toast(errMsg(e, "Não foi possível salvar."), "info"),
  });
}

export function TabConfig({ profile, profileState }: { profile?: Profile; profileState: ProfileState }) {
  const { theme, system, setTheme, setSystem } = useTheme();
  const mode = system ? "system" : theme;
  const themes = [
    ["light", "Claro"],
    ["dark", "Escuro"],
    ["system", "Do aparelho"],
  ] as const;

  const language = (
    <SettingRow title="Idioma" hint="Português (Brasil)">
      <span className="text-[13px] text-text-subtle">Único disponível por enquanto</span>
    </SettingRow>
  );

  return (
    <Card title="Configurações">
      <div className="flex flex-col">
        <SettingRow title="Aparência" hint="Claro, escuro ou igual ao do seu aparelho.">
          <div role="radiogroup" aria-label="Aparência" className="flex gap-1.5">
            {themes.map(([id, label]) => (
              <ChoicePill
                key={id}
                radio
                on={mode === id}
                onClick={() => (id === "system" ? setSystem() : setTheme(id))}
              >
                {label}
              </ChoicePill>
            ))}
          </div>
        </SettingRow>
        {profile ? (
          <SavedSettings profile={profile} language={language} />
        ) : (
          <>
            <div className="border-t border-surface-2 pt-4">
              <ProfileStatus state={profileState} />
            </div>
            {language}
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-surface-2 pt-4 text-[13px] font-bold text-link">
        <Link href={routes.ajuda} className="inline-flex min-h-8 items-center hover:underline">
          Central de Ajuda
        </Link>
        <Link href={`${routes.institucional}/termos`} className="inline-flex min-h-8 items-center hover:underline">
          Termos de uso
        </Link>
        <Link
          href={`${routes.institucional}/privacidade`}
          className="inline-flex min-h-8 items-center hover:underline"
        >
          Política de privacidade
        </Link>
      </div>
    </Card>
  );
}

/** Preferências gravadas na conta (WhatsApp, vídeos e sons): só aparecem com o perfil carregado. */
function SavedSettings({ profile, language }: { profile: Profile; language: React.ReactNode }) {
  const patch = usePatchProfile();
  const [wa, setWa] = useState(profile.settings.whatsappOpen);
  const pickWa = (v: "app" | "web") => {
    setWa(v);
    saveWhatsappMode(v);
    patch.mutate({ settings: { whatsappOpen: v } });
  };
  return (
    <>
      <SettingRow title="Abrir o WhatsApp" hint="Quando você toca em “WhatsApp” numa loja.">
        <div role="radiogroup" aria-label="Abrir o WhatsApp" className="flex gap-1.5">
          <ChoicePill radio on={wa === "app"} onClick={() => pickWa("app")}>
            No aplicativo
          </ChoicePill>
          <ChoicePill radio on={wa === "web"} onClick={() => pickWa("web")}>
            No WhatsApp Web
          </ChoicePill>
        </div>
      </SettingRow>
      {language}
      <SettingRow
        title="Reproduzir stories e vídeos automaticamente"
        hint="Desligue para economizar internet."
      >
        <Switch
          bare
          label="Reproduzir stories e vídeos automaticamente"
          checked={profile.settings.autoplay}
          onChange={(v) => patch.mutate({ settings: { autoplay: v } })}
        />
      </SettingRow>
      <SettingRow title="Sons de mensagens" hint="Toca um som quando chega resposta no chat.">
        <Switch
          bare
          label="Sons de mensagens"
          checked={profile.settings.sounds}
          onChange={(v) => patch.mutate({ settings: { sounds: v } })}
        />
      </SettingRow>
    </>
  );
}
