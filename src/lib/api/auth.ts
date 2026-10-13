import { z } from "zod";

import { api } from "./client";
import { meSchema } from "./schemas";

/** Contrato: docs/contratos/auth.md */

export const otpChallengeSchema = z.object({
  challengeId: z.string(),
  channel: z.enum(["sms", "email"]),
  destinationMasked: z.string(),
  expiresAt: z.string(),
  resendAt: z.string(),
});
export type OtpChallenge = z.infer<typeof otpChallengeSchema>;

const loginResponseSchema = z.object({ user: meSchema, deletionCancelled: z.boolean() });
const userOnlySchema = z.object({ user: meSchema });
const resetTokenSchema = z.object({ resetToken: z.string() });
const channelsSchema = z.object({
  channels: z.array(z.object({ channel: z.enum(["sms", "email"]), destinationMasked: z.string() })),
});
export type RecoveryChannels = z.infer<typeof channelsSchema>["channels"];
const cepSchema = z.object({
  street: z.string().nullable(),
  neighborhood: z.string().nullable(),
  city: z.string(),
  state: z.string().length(2),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
});
export type CepResult = z.infer<typeof cepSchema>;
const reverseSchema = cepSchema.extend({ cep: z.string().nullable() });
const empty = z.undefined();

export const authApi = {
  login: (body: { login: string; password: string; keepSignedIn: boolean }) =>
    api("/auth/login", loginResponseSchema, { method: "POST", body }),
  register: (body: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
    password: string;
    acceptTerms: true;
  }) => api("/auth/register", otpChallengeSchema, { method: "POST", body }),
  verifyRegistration: (body: { challengeId: string; code: string }) =>
    api("/auth/otp/verify", userOnlySchema, { method: "POST", body }),
  verifyReset: (body: { challengeId: string; code: string }) =>
    api("/auth/otp/verify", resetTokenSchema, { method: "POST", body }),
  resend: (body: { challengeId: string; channel?: "sms" | "email" }) =>
    api("/auth/otp/resend", otpChallengeSchema, { method: "POST", body }),
  recoveryChannels: (login: string) =>
    api("/auth/password/channels", channelsSchema, { method: "POST", body: { login } }),
  forgot: (body: { login: string; channel: "sms" | "email" }) =>
    api("/auth/password/forgot", otpChallengeSchema, { method: "POST", body }),
  resetPassword: (body: { resetToken: string; newPassword: string; signOutOtherDevices: boolean }) =>
    api("/auth/password/reset", empty, { method: "POST", body }),
  cep: (cep: string) => api(`/geo/cep/${cep}`, cepSchema),
  reverseGeo: (lat: number, lng: number) => api("/geo/reverse", reverseSchema, { query: { lat, lng } }),
  saveAddress: (body: {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
    lat: number | null;
    lng: number | null;
    main: true;
  }) => api("/me/addresses", empty, { method: "POST", body }),
  saveInterests: (categoryIds: string[]) =>
    api("/me/interests", empty, { method: "PUT", body: { categoryIds } }),
};
