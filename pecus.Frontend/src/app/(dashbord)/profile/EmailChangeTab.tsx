"use client";

import { useState, useEffect } from "react";
import type { PendingEmailChangeResponse } from "@/connectors/api/pecus";
import { requestEmailChange } from "@/actions/profile";
import { useValidation } from "@/hooks/useValidation";
import { updateEmailFormSchema } from "@/schemas/profileSchemas";

interface EmailChangeTabProps {
  currentEmail: string;
  pendingEmailChange: PendingEmailChangeResponse | null;
  onAlert: (type: "success" | "error" | "info", message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EmailChangeTab({
  currentEmail,
  pendingEmailChange: initialPendingEmailChange,
  onAlert,
  isLoading,
  setIsLoading,
}: EmailChangeTabProps) {
  const [newEmail, setNewEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(initialPendingEmailChange?.newEmail || null);
  const [pendingExpiresAt, setPendingExpiresAt] = useState<Date | null>(
    initialPendingEmailChange ? new Date(initialPendingEmailChange.expiresAt) : null
  );

  // バリデーション
  const validation = useValidation(updateEmailFormSchema);

  const handleEmailChange = async () => {
    // クライアント側バリデーション
    const validationResult = await validation.validate({
      newEmail,
      currentPassword: password,
    });

    if (!validationResult.success) {
      onAlert("error", validationResult.errors[0] || "入力内容を確認してください");
      return;
    }

    if (newEmail === currentEmail) {
      onAlert("error", "新しいメールアドレスが現在と同じです");
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestEmailChange({
        newEmail,
        currentPassword: password,
      });

      if (result.success) {
        onAlert(
          "info",
          result.data.message || "確認メールを送信しました。メールに記載されたリンクをクリックして変更を完了してください。"
        );
        setPendingEmail(result.data.newEmail);
        setPendingExpiresAt(new Date(result.data.expiresAt));
        setNewEmail("");
        setPassword("");
        validation.clearErrors();
      } else {
        onAlert("error", result.message || "メールアドレス変更リクエストに失敗しました");
      }
    } catch (error) {
      console.error("Email change error:", error);
      onAlert("error", "メールアドレス変更に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setNewEmail("");
    setPassword("");
    validation.clearErrors();
  };

  return (
    <div className="space-y-6">
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
            <h3 className="font-bold">確認待ちのメールアドレス変更があります</h3>
            <div className="text-sm">
              <p>新しいメールアドレス: <strong>{pendingEmail}</strong></p>
              <p>有効期限: {pendingExpiresAt.toLocaleString("ja-JP")}</p>
              <p className="mt-1">メールに記載されたリンクをクリックして変更を完了してください。</p>
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
          type="email"
          placeholder="new-email@example.com"
          className={`input input-bordered ${
            validation.hasErrors ? "input-error" : ""
          }`}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        {validation.error && (
          <label className="label">
            <span className="label-text-alt text-error">
              {validation.error}
            </span>
          </label>
        )}
      </div>

      {/* パスワード確認 */}
      <div className="form-control">
        <label htmlFor="password" className="label">
          <span className="label-text font-semibold text-base-content">
            現在のパスワード（確認用）
            <span className="text-error ml-1">*</span>
          </span>
        </label>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="現在のパスワードを入力"
          className="input input-bordered"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* パスワード表示/非表示トグル */}
      <label className="label cursor-pointer">
        <span className="label-text">パスワードを表示</span>
        <input
          type="checkbox"
          className="checkbox"
          checked={showPassword}
          onChange={() => setShowPassword(!showPassword)}
          disabled={isLoading}
        />
      </label>

      {/* ボタングループ */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-outline"
          disabled={isLoading}
        >
          クリア
        </button>
        <button
          type="button"
          onClick={handleEmailChange}
          className="btn btn-primary"
          disabled={isLoading || !newEmail || !password}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              送信中...
            </>
          ) : (
            "確認メールを送信"
          )}
        </button>
      </div>
    </div>
  );
}
