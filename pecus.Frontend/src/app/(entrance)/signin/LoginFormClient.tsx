"use client";

import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { login } from "@/actions/auth";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { deviceInfoAtom } from "@/libs/atoms/deviceInfoAtom";
import { loginSchema } from "@/schemas/signInSchemas";
import { getDeviceInfo } from "@/utils/deviceInfo";

/**
 * ログインフォーム (Client Component)
 *
 * 責務:
 * - フォーム入力・送信処理
 * - データバリデーション (Zod)
 * - エラー表示・成功時の処理
 */
export default function LoginFormClient() {
  const router = useRouter();

  // === デバイス情報管理 (Jotai) ===
  const [deviceInfo, setDeviceInfo] = useAtom(deviceInfoAtom);

  // === フォーム入力状態の管理 ===
  const [formData, setFormData] = useState({
    loginIdentifier: "",
    password: "",
  });

  // === ページロード時にデバイス情報を取得 ===
  useEffect(() => {
    const fetchDeviceInfo = async () => {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    };
    fetchDeviceInfo();
  }, [setDeviceInfo]);

  // === API エラー管理（ログイン失敗など） ===
  const [apiError, setApiError] = useState<string | null>(null);

  // === Zod一本化フック ===
  const {
    formRef,
    isSubmitting,
    handleSubmit,
    validateField,
    shouldShowError,
    getFieldError,
  } = useFormValidation({
    schema: loginSchema,
    onSubmit: async (data) => {
      // エラーをクリア
      setApiError(null);

      // === ログイン API 呼び出し ===
      try {
        if (!deviceInfo) {
          setApiError(
            "デバイス情報の取得に失敗しました。ページを再読み込みしてください。",
          );
          return;
        }

        const result = await login({
          loginIdentifier: data.loginIdentifier,
          password: data.password,
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
        setApiError(
          result.error
            ? `ログイン認証に失敗しました。(${result.error})`
            : "ログイン認証に失敗しました。",
        );
      } catch (err: unknown) {
        console.error("ログイン処理中にエラーが発生:", err);
        setApiError("ログイン処理中にエラーが発生しました。");
      }
    },
  });

  // 入力時の検証とフォーム状態更新
  const handleFieldChange = async (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // フィールド検証を実行
    await validateField(fieldName, value);
  };

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

          {/* === ログインフォーム === */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="w-full"
            noValidate
          >
            <div className="form-control w-full mb-4">
              <label htmlFor="loginIdentifier" className="label">
                <span className="label-text font-semibold">
                  ログインID <span className="text-error">*</span>
                </span>
              </label>
              <div className="w-full">
                <input
                  type="text"
                  id="loginIdentifier"
                  name="loginIdentifier"
                  placeholder="ログインIDまたはメールアドレス"
                  className={`input input-bordered w-full ${
                    shouldShowError("loginIdentifier") ? "input-error" : ""
                  }`}
                  value={formData.loginIdentifier}
                  onChange={(event) =>
                    handleFieldChange("loginIdentifier", event.target.value)
                  }
                  disabled={isSubmitting}
                  required
                />
                {shouldShowError("loginIdentifier") && (
                  <span className="label-text-alt text-error">
                    {getFieldError("loginIdentifier")}
                  </span>
                )}
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
                  id="password"
                  name="password"
                  placeholder="パスワード"
                  className={`input input-bordered w-full ${
                    shouldShowError("password") ? "input-error" : ""
                  }`}
                  value={formData.password}
                  onChange={(event) =>
                    handleFieldChange("password", event.target.value)
                  }
                  disabled={isSubmitting}
                  required
                />
                {shouldShowError("password") && (
                  <span className="label-text-alt text-error">
                    {getFieldError("password")}
                  </span>
                )}
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
