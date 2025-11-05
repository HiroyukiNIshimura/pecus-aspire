"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { login } from "@/actions/auth";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useValidation } from "@/hooks/useValidation";
import { loginSchema } from "@/schemas/signInSchemas";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { getDeviceInfo } from "@/utils/deviceInfo";
import { deviceInfoAtom } from "@/libs/atoms/deviceInfoAtom";

/**
 * ログインフォーム (Client Component)
 *
 * 責務:
 * - フォーム入力・送信処理
 * - データバリデーション (Pristine.js + Zod)
 * - エラー表示・成功時の処理
 *
 * 注: EditWorkspaceClient と同じパターンで実装
 * - useFormValidation で UI バリデーション管理（Pristine.js）
 * - useValidation で Zod バリデーション
 * - Server Action (login) で API 呼び出し
 * - LoadingOverlay で送信中表示
 */
export default function LoginFormClient() {
  const router = useRouter();

  // === デバイス情報管理 (Jotai) ===
  const [deviceInfo, setDeviceInfo] = useAtom(deviceInfoAtom);

  // === フォーム入力状態の管理 ===
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // === ページロード時にデバイス情報を取得 ===
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };
    fetchDeviceInfo();
  }, [setDeviceInfo]);

  // === データバリデーション: Zod スキーマを使用 ===
  const validation = useValidation(loginSchema);

  // === API エラー管理（ログイン失敗など） ===
  const [apiError, setApiError] = useState<string | null>(null);

  // === UI バリデーション管理（useFormValidation + Pristine.js） ===
  const { formRef, isSubmitting, validateField, handleSubmit } = useFormValidation({
    onSubmit: async () => {
      // エラーをクリア
      setApiError(null);
      validation.clearErrors();

      // === データバリデーション (Zod): ビジネスロジック検証 ===
      const validationResult = await validation.validate({
        loginIdentifier,
        password,
      });

      if (!validationResult.success) {
        // Zod バリデーションエラーがある場合は処理を中断
        return;
      }

      // === ログイン API 呼び出し ===
      try {
        if (!deviceInfo) {
          setApiError("デバイス情報の取得に失敗しました。ページを再読み込みしてください。");
          return;
        }

        const result = await login({
          loginIdentifier,
          password,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          os: deviceInfo.os,
          userAgent: deviceInfo.userAgent,
          appVersion: deviceInfo.appVersion,
          timezone: deviceInfo.timezone,
          location: deviceInfo.location ?? undefined,
          // ipAddress はサーバー側で取得するため送信しない
        });

        if (result.success) {
          router.push("/");
          return;
        }

        // === ログイン失敗時のエラー表示 ===
        setApiError(result.error ? `ログイン認証に失敗しました。(${result.error})` : "ログイン認証に失敗しました。",)
      } catch (err: unknown) {
        console.error("ログイン処理中にエラーが発生:", err);
        setApiError("ログイン処理中にエラーが発生しました。");
      }
    },
  });

  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} message="ログイン中..." />

      <div className="card w-full max-w-md shadow-lg bg-base-100">
        <div className="card-body">
          <h1 className="card-title text-center">ログイン</h1>

        {/* === API エラー表示エリア（ログイン失敗など） === */}
        {apiError && (
          <div className="alert alert-error" role="alert">
            {apiError}
          </div>
        )}

        {/* Zod検証エラー表示 */}
        {validation.hasErrors && (
          <div className="alert alert-error">
            <div className="flex flex-col gap-1">
              {validation.errors.map((err, idx) => (
                <div key={idx} className="text-sm">{err}</div>
              ))}
            </div>
          </div>
        )}

        {/* === ログインフォーム === */}
          <form ref={formRef} onSubmit={handleSubmit} className="w-full" noValidate>
            <div className="form-control w-full mb-4">
              <label htmlFor="loginIdentifier" className="label">
                <span className="label-text font-semibold">
                  ログインID <span className="text-error">*</span>
                </span>
              </label>
              <div className="w-full">
                <input
                  type="text"
                  name="loginIdentifier"
                  id="loginIdentifier"
                  placeholder="ログインIDまたはメールアドレス"
                  className="input input-bordered w-full"
                  value={loginIdentifier}
                  onChange={(event) => setLoginIdentifier(event.target.value)}
                  onBlur={(e) => validateField(e.target)}
                  disabled={isSubmitting}
                  required
                  data-pristine-required-message="ログインIDまたはメールアドレスは必須です。"
                  maxLength={255}
                  data-pristine-maxlength-message="ログインIDまたはメールアドレスは255文字以内で入力してください。"
                />
              </div>
            </div>

            <div className="form-control w-full mb-4">
              <label htmlFor="password" className="label">
                <span className="label-text font-semibold">
                  パスワード <span className="text-error">*</span>
                </span>
              </label>
              <div className="w-full">
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="パスワード"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={(e) => validateField(e.target)}
                  disabled={isSubmitting}
                  required
                  data-pristine-required-message="パスワードは必須です。"
                  maxLength={255}
                  data-pristine-maxlength-message="パスワードは255文字以内で入力してください。"
                />
              </div>
            </div>

            <div className="w-full mt-6">
              <button
                className="btn btn-accent w-full"
                type="submit"
                disabled={isSubmitting}
              >
                ログイン
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <a href="/forgot-password" className="link link-primary">
              パスワードを忘れた
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
