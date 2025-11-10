"use client";

import { useState } from "react";
import { updateUserPassword } from "@/actions/profile";
import {
  updatePasswordFormSchema,
  type UpdatePasswordFormInput,
} from "@/schemas/profileSchemas";
import { useValidation } from "@/hooks/useValidation";

interface SecurityTabProps {
  onAlert: (type: "success" | "error" | "info", message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

// パスワード要件チェック
const getPasswordRequirements = (password: string) => ({
  minLength: password.length >= 8,
  hasUpperCase: /[A-Z]/.test(password),
  hasLowerCase: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
});

export default function SecurityTab({
  onAlert,
  isLoading,
  setIsLoading,
}: SecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPasswords, setShowPasswords] = useState<boolean>(false);

  const passwordValidation = useValidation(updatePasswordFormSchema);

  const passwordReqs = getPasswordRequirements(newPassword);
  const allRequirementsMet =
    passwordReqs.minLength &&
    passwordReqs.hasUpperCase &&
    passwordReqs.hasLowerCase &&
    passwordReqs.hasNumber;

  const handlePasswordChange = async () => {
    const validationResult = await passwordValidation.validate({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validationResult.success) {
      onAlert("error", passwordValidation.error || "パスワードが無効です");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateUserPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      if (result.success) {
        onAlert("success", "パスワードが変更されました");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        onAlert("error", result.message || "パスワード変更に失敗しました");
      }
    } catch (error) {
      console.error("Password change error:", error);
      onAlert("error", "予期しないエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    passwordValidation.clearErrors();
  };

  return (
    <div className="space-y-4">
      {/* 現在のパスワード */}
      <div className="form-control">
        <label htmlFor="currentPassword" className="label">
          <span className="label-text font-semibold">現在のパスワード</span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <input
          id="currentPassword"
          type={showPasswords ? "text" : "password"}
          placeholder="現在のパスワードを入力"
          className="input input-bordered"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* 新しいパスワード */}
      <div className="form-control">
        <label htmlFor="newPassword" className="label">
          <span className="label-text font-semibold">新しいパスワード</span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <input
          id="newPassword"
          type={showPasswords ? "text" : "password"}
          placeholder="新しいパスワードを入力"
          className="input input-bordered"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* パスワード要件チェックリスト */}
      {newPassword && (
        <div className="bg-base-200 p-4 rounded-lg space-y-2">
          <p className="text-sm font-semibold">パスワード要件:</p>
          <ul className="text-sm space-y-1">
            <li className={`flex items-center gap-2 ${passwordReqs.minLength ? "text-success" : "text-error"}`}>
              <span>{passwordReqs.minLength ? "✔" : "✘"}</span>
              8文字以上
            </li>
            <li
              className={`flex items-center gap-2 ${
                passwordReqs.hasUpperCase ? "text-success" : "text-error"
              }`}
            >
              <span>{passwordReqs.hasUpperCase ? "✔" : "✘"}</span>
              大文字を含む
            </li>
            <li
              className={`flex items-center gap-2 ${
                passwordReqs.hasLowerCase ? "text-success" : "text-error"
              }`}
            >
              <span>{passwordReqs.hasLowerCase ? "✔" : "✘"}</span>
              小文字を含む
            </li>
            <li
              className={`flex items-center gap-2 ${
                passwordReqs.hasNumber ? "text-success" : "text-error"
              }`}
            >
              <span>{passwordReqs.hasNumber ? "✔" : "✘"}</span>
              数字を含む
            </li>
            <li
              className={`flex items-center gap-2 ${
                passwordReqs.hasSpecialChar ? "text-success" : "text-warning"
              }`}
            >
              <span>{passwordReqs.hasSpecialChar ? "✔" : "✘"}</span>
              特殊文字を含む（オプション）
            </li>
          </ul>
        </div>
      )}

      {/* パスワード確認 */}
      <div className="form-control">
        <label htmlFor="confirmPassword" className="label">
          <span className="label-text font-semibold">パスワード確認</span>
          <span className="label-text-alt text-error">*</span>
        </label>
        <input
          id="confirmPassword"
          type={showPasswords ? "text" : "password"}
          placeholder="パスワードを再入力"
          className="input input-bordered"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          checked={showPasswords}
          onChange={() => setShowPasswords(!showPasswords)}
          disabled={isLoading}
        />
      </label>

      {/* エラーメッセージ */}
      {passwordValidation.error && (
        <div className="alert alert-error">
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
              d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m8-8l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2"
            />
          </svg>
          <span>{passwordValidation.error}</span>
        </div>
      )}

      {/* ボタングループ */}
      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-outline flex-1"
          disabled={isLoading}
        >
          クリア
        </button>
        <button
          type="button"
          onClick={handlePasswordChange}
          className="btn btn-primary flex-1"
          disabled={isLoading || !allRequirementsMet}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              変更中...
            </>
          ) : (
            "パスワードを変更"
          )}
        </button>
      </div>
    </div>
  );
}
