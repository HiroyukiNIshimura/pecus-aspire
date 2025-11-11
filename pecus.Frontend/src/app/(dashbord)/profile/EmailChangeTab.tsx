"use client";

import { useState } from "react";

interface EmailChangeTabProps {
  currentEmail: string;
  onAlert: (type: "success" | "error" | "info", message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function EmailChangeTab({
  currentEmail,
  onAlert,
  isLoading,
  setIsLoading,
}: EmailChangeTabProps) {
  const [newEmail, setNewEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleEmailChange = async () => {
    if (!newEmail || !password) {
      onAlert("error", "すべての項目を入力してください");
      return;
    }

    if (newEmail === currentEmail) {
      onAlert("error", "新しいメールアドレスが現在と同じです");
      return;
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      onAlert("error", "有効なメールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Server Action を実装
      // const result = await updateUserEmail({ newEmail, password });
      
      // 仮実装
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      onAlert(
        "info",
        "確認メールを送信しました。メールに記載されたリンクをクリックして変更を完了してください。"
      );
      setNewEmail("");
      setPassword("");
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
  };

  return (
    <div className="space-y-6">
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
          className="input input-bordered"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={isLoading}
          required
        />
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
