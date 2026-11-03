import { z } from 'zod';

export const loginIdentifierSchema = z
  .string()
  .min(1, 'ログインIDまたはメールアドレスは必須です。')
  .max(255, 'ログインIDまたはメールアドレスは255文字以内で入力してください。');

const deviceTypeSchema = z
  .enum(['Browser', 'MobileApp', 'DesktopApp', 'Other'], { error: 'デバイスタイプが不正です。' })
  .nullable();

const osPlatformSchema = z
  .enum(['Unknown', 'Windows', 'MacOS', 'Linux', 'iOS', 'Android'], { error: 'OS情報が不正です。' })
  .nullable();

export const passkeyLoginOptionsInputSchema = z.object({
  loginIdentifier: loginIdentifierSchema,
});

export const passkeyLoginVerifyInputSchema = z.object({
  challengeId: z.string().min(1, 'チャレンジIDは必須です。'),
  assertion: z.object({
    id: z.string().min(1),
    rawId: z.string().min(1),
    type: z.string().min(1),
    response: z.object({
      authenticatorData: z.string().min(1),
      signature: z.string().min(1),
      clientDataJSON: z.string().min(1),
      userHandle: z.string().optional(),
    }),
  }),
  deviceName: z.string().max(100).optional(),
  deviceType: deviceTypeSchema,
  os: osPlatformSchema,
  userAgent: z.string().max(1000).optional(),
  appVersion: z.string().max(100).optional(),
  timezone: z.string().max(100).optional(),
  location: z.string().max(255).optional(),
});

export const setupRegistrationOptionsInputSchema = z
  .object({
    token: z.string().max(128).optional(),
    recoveryToken: z.string().max(64).optional(),
  })
  .refine((data) => Boolean(data.token || data.recoveryToken), {
    error: 'セットアップトークンまたはリカバリートークンが必要です。',
  });

export const registrationVerifyInputSchema = z.object({
  challengeId: z.string().min(1, 'チャレンジIDは必須です。'),
  credential: z.object({
    id: z.string().min(1),
    rawId: z.string().min(1),
    type: z.string().min(1),
    response: z.object({
      attestationObject: z.string().min(1),
      clientDataJSON: z.string().min(1),
      transports: z.array(z.string()).optional(),
    }),
  }),
  name: z.string().max(100).optional(),
  deviceId: z.number().int().positive().optional(),
});

export const recoveryCodeInputSchema = z.object({
  loginIdentifier: loginIdentifierSchema,
  code: z.string().min(1, 'リカバリーコードは必須です。').max(32),
});

export type PasskeyLoginOptionsInput = z.infer<typeof passkeyLoginOptionsInputSchema>;
export type PasskeyLoginVerifyInput = z.infer<typeof passkeyLoginVerifyInputSchema>;
export type SetupRegistrationOptionsInput = z.infer<typeof setupRegistrationOptionsInputSchema>;
export type RegistrationVerifyInput = z.infer<typeof registrationVerifyInputSchema>;
export type RecoveryCodeInput = z.infer<typeof recoveryCodeInputSchema>;
