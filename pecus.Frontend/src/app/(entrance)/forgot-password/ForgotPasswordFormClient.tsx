"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordResetAction } from "@/actions/password";
import { useFormValidation } from "@/hooks/useFormValidation";
import { requestPasswordResetSchema } from "@/schemas/signInSchemas";

export default function ForgotPasswordFormClient() {
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: requestPasswordResetSchema,
    onSubmit: async (data) => {
      const result = await requestPasswordResetAction(data);
      if (result.success) {
        setSuccessMessage(result.message);
        // フォームをリセット
        formRef.current?.reset();
        setEmail("");
        // 5秒後にメッセージをクリア
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      }
    },
  });

  return (
    <div className="card w-full max-w-sm shadow-lg bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-center w-full mb-6">パスワードをリセット</h2>

        {/* 成功メッセージ */}
        {successMessage && (
          <div className="alert alert-success shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="w-full" noValidate>
          {/* メールアドレス入力フィールド */}
          <div className="form-control w-full mb-4">
            <label htmlFor="email" className="label">
              <span className="label-text font-semibold">
                メールアドレス<span className="text-error"> *</span>
              </span>
            </label>
            <div className="w-full">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="example@example.com"
                className={`input input-bordered w-full ${shouldShowError("email") ? "input-error" : ""}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateField("email", e.target.value);
                }}
                disabled={isSubmitting}
                required
              />
              {shouldShowError("email") && (
                <div className="label">
                  <span className="label-text-alt text-error">{getFieldError("email")}</span>
                </div>
              )}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="w-full mt-6">
            <button className="btn btn-accent w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  送信中...
                </>
              ) : (
                "リセットメールを送信"
              )}
            </button>
          </div>
        </form>

        {/* ナビゲーションリンク */}
        <div className="text-center mt-6 space-y-2">
          <div>
            <Link href="/signin" className="link link-primary text-sm">
              ログインページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
