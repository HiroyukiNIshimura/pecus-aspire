"use client";

import { useState } from "react";
import { requestEmailChange } from "@/actions/profile";
import type { PendingEmailChangeResponse } from "@/connectors/api/pecus";
import { useFormValidation } from "@/hooks/useFormValidation";
import { updateEmailFormSchema } from "@/schemas/profileSchemas";

interface EmailChangeTabProps {
  currentEmail: string;
  pendingEmailChange: PendingEmailChangeResponse | null;
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EmailChangeTab({
  currentEmail,
  pendingEmailChange: initialPendingEmailChange,
  notify,
  isLoading,
  setIsLoading,
}: EmailChangeTabProps) {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(
    initialPendingEmailChange?.newEmail || null,
  );
  const [pendingExpiresAt, setPendingExpiresAt] = useState<Date | null>(
    initialPendingEmailChange
      ? new Date(initialPendingEmailChange.expiresAt)
      : null,
  );

  const {
    formRef,
    isSubmitting,
    handleSubmit,
    validateField,
    shouldShowError,
    getFieldError,
  } = useFormValidation({
    schema: updateEmailFormSchema,
    onSubmit: async (data) => {
      if (data.newEmail === currentEmail) {
        notify.error("新しいメールアドレスが現在と同じです");
        return;
      }

      setIsLoading(true);
      try {
        const result = await requestEmailChange({
          newEmail: data.newEmail,
          currentPassword: data.currentPassword,
        });

        if (result.success) {
          notify.info(
            result.data.message ||
              "確認メールを送信しました。メールに記載されたリンクをクリックして変更を完了してください。",
          );
          setPendingEmail(result.data.newEmail);
          setPendingExpiresAt(new Date(result.data.expiresAt));
          formRef.current?.reset();
        } else {
          notify.error(
            result.message || "メールアドレス変更リクエストに失敗しました",
          );
        }
      } catch (error) {
        console.error("Email change error:", error);
        notify.error("メールアドレス変更に失敗しました");
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleReset = () => {
    formRef.current?.reset();
  };

  const handleFieldChange = async (fieldName: string, value: string) => {
    // フィールド検証を実行
    await validateField(fieldName, value);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* 保留中のメールアドレス変更 */}
      {pendingEmail && pendingExpiresAt && (
        <div className="alert alert-warning">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">
              確認待ちのメールアドレス変更があります
            </h3>
            <div className="text-sm">
              <p>
                新しいメールアドレス: <strong>{pendingEmail}</strong>
              </p>
              <p>有効期限: {pendingExpiresAt.toLocaleString("ja-JP")}</p>
              <p className="mt-1">
                メールに記載されたリンクをクリックして変更を完了してください。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 説明 */}
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>
          新しいメールアドレスに確認メールを送信します。メール内のリンクをクリックして変更を完了してください。
        </span>
      </div>

      {/* 現在のメールアドレス */}
      <div className="form-control">
        <label htmlFor="currentEmail" className="label">
          <span className="label-text font-semibold text-base-content">
            現在のメールアドレス
          </span>
        </label>
        <input
          id="currentEmail"
          type="email"
          className="input input-bordered bg-base-200"
          value={currentEmail}
          disabled
          readOnly
        />
      </div>

      {/* 新しいメールアドレス */}
      <div className="form-control">
        <label htmlFor="newEmail" className="label">
          <span className="label-text font-semibold text-base-content">
            新しいメールアドレス
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          id="newEmail"
          name="newEmail"
          type="email"
          placeholder="new-email@example.com"
          className={`input input-bordered ${
            shouldShowError("newEmail") ? "input-error" : ""
          }`}
          onChange={(e) => handleFieldChange("newEmail", e.target.value)}
          disabled={isLoading || isSubmitting}
          required
        />
        {shouldShowError("newEmail") && (
          <label className="label">
            <span className="label-text-alt text-error">
              {getFieldError("newEmail")}
            </span>
          </label>
        )}
      </div>

      {/* パスワード確認 */}
      <div className="form-control">
        <label htmlFor="currentPassword" className="label">
          <span className="label-text font-semibold text-base-content">
            現在のパスワード（確認用）
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type={showPassword ? "text" : "password"}
          placeholder="現在のパスワードを入力"
          className={`input input-bordered ${
            shouldShowError("currentPassword") ? "input-error" : ""
          }`}
          onChange={(e) => handleFieldChange("currentPassword", e.target.value)}
          disabled={isLoading || isSubmitting}
          required
        />
        {shouldShowError("currentPassword") && (
          <label className="label">
            <span className="label-text-alt text-error">
              {getFieldError("currentPassword")}
            </span>
          </label>
        )}
      </div>

      {/* パスワード表示/非表示トグル */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showPassword"
          className="checkbox"
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
          disabled={isLoading || isSubmitting}
        />
        <label htmlFor="showPassword" className="cursor-pointer">
          パスワードを表示
        </label>
      </div>

      {/* ボタングループ */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-outline"
          disabled={isLoading || isSubmitting}
        >
          クリア
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              送信中...
            </>
          ) : (
            "確認メールを送信"
          )}
        </button>
      </div>
    </form>
  );
}
