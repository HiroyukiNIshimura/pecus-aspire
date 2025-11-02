"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/actions/auth";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useValidation } from "@/hooks/useValidation";
import { loginSchema } from "@/schemas/signInSchemas";
import LoadingOverlay from "@/components/common/LoadingOverlay";

/**
 * ログインフォーム (Client Component)
 *
 * 責務:
 * - フォーム入力・送信処理
 * - データバリデーション (Zod)
 * - エラー表示・成功時の処理
 *
 * 注: EditWorkspaceClient と同じパターンで実装
 * - useFormValidation で UI バリデーション管理
 * - useValidation で Zod バリデーション
 * - Server Action (login) で API 呼び出し
 * - LoadingOverlay で送信中表示
 */
export default function LoginFormClient() {
  const router = useRouter();

  // === フォーム入力状態の管理 ===
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // === データバリデーション: Zod スキーマを使用 ===
  const validation = useValidation(loginSchema);

  // === 個別フィールドエラー管理 ===
  const [fieldErrors, setFieldErrors] = useState<{
    loginIdentifier?: string;
    password?: string;
    general?: string;
  }>({});

  // === UI バリデーション管理（useFormValidation） ===
  const { formRef, isSubmitting, handleSubmit } = useFormValidation({
    onSubmit: async () => {
      // エラーをクリア
      setFieldErrors({});
      validation.clearErrors();

      // === データバリデーション (Zod): ビジネスロジック検証 ===
      const validationResult = await validation.validate({
        loginIdentifier,
        password,
      });

      if (!validationResult.success) {
        // Zod バリデーションエラーを個別フィールドに割り当て
        const errors: typeof fieldErrors = {};
        validationResult.errors.forEach((err) => {
          if (err.includes("ログインID")) {
            errors.loginIdentifier = err;
          } else if (err.includes("パスワード")) {
            errors.password = err;
          }
        });
        setFieldErrors(errors);
        return;
      }

      // === ログイン API 呼び出し ===
      try {
        const result = await login({
          loginIdentifier,
          password,
        });

        if (result.success) {
          router.push("/admin");
          return;
        }

        // === ログイン失敗時のエラー表示 ===
        setFieldErrors({
          general: result.error || "ログイン認証に失敗しました。",
        });
      } catch (err: unknown) {
        console.error("ログイン処理中にエラーが発生:", err);
        setFieldErrors({
          general: "ログイン処理中にエラーが発生しました。",
        });
      }
    },
  });

  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} message="ログイン中..." />

      <div className="card w-full max-w-lg shadow-lg bg-base-100">
        <div className="card-body">
          <h1 className="card-title text-center">ログイン</h1>

        {/* === 全体エラー表示エリア（ログイン失敗など） === */}
        {fieldErrors.general && (
          <div className="alert alert-error" role="alert">
            {fieldErrors.general}
          </div>
        )}

        {/* === ログインフォーム === */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="form-control">
              <label className="label-text" htmlFor="loginIdentifier">
                ログインID
              </label>
              <input
                type="text"
                name="loginIdentifier"
                id="loginIdentifier"
                placeholder="ログインIDまたはメールアドレス"
                className={`input input-bordered w-full ${fieldErrors.loginIdentifier ? "input-error" : ""}`}
                value={loginIdentifier}
                onChange={(event) => setLoginIdentifier(event.target.value)}
                disabled={isSubmitting}
              />
              <div className="min-h-[1.5rem]">
                {fieldErrors.loginIdentifier ? (
                  <span className="text-error text-sm block mt-1">
                    {fieldErrors.loginIdentifier}
                  </span>
                ) : (
                  <span className="helper-text text-end block">
                    ログインIDまたはメールアドレスを入力してください
                  </span>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label-text" htmlFor="password">
                パスワード
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="パスワード"
                className={`input input-bordered w-full ${fieldErrors.password ? "input-error" : ""}`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <div className="min-h-[1.5rem]">
                {fieldErrors.password ? (
                  <span className="text-error text-sm block mt-1">
                    {fieldErrors.password}
                  </span>
                ) : (
                  <span className="helper-text text-end block">
                    パスワードを入力してください
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn btn-accent w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </button>
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
