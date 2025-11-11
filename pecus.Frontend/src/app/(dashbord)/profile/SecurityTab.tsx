"use client";

import { useState } from "react";
import { updateUserPassword } from "@/actions/profile";
import {
  updatePasswordFormSchema,
  type UpdatePasswordFormInput,
} from "@/schemas/profileSchemas";
import { useValidation } from "@/hooks/useValidation";
import PasswordRequirementIndicator, {
  isPasswordValid,
} from "@/components/common/PasswordRequirementIndicator";

interface SecurityTabProps {
  onAlert: (type: "success" | "error" | "info", message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

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

  const allRequirementsMet = isPasswordValid(newPassword);

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
    <div className="space-y-6 bg-base-100">
      {/* 現在のパスワード */}
      <div className="form-control">
        <label htmlFor="currentPassword" className="label">
          <span className="label-text font-semibold text-base-content">
            現在のパスワード
            <span className="text-error ml-1">*</span>
          </span>
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
          <span className="label-text font-semibold text-base-content">
            新しいパスワード
            <span className="text-error ml-1">*</span>
          </span>
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
        {/* パスワード要件インジケーター */}
        <PasswordRequirementIndicator password={newPassword} />
      </div>

      {/* パスワード確認 */}
      <div className="form-control">
        <label htmlFor="confirmPassword" className="label">
          <span className="label-text font-semibold text-base-content">
            パスワード確認
            <span className="text-error ml-1">*</span>
          </span>
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
          onClick={handlePasswordChange}
          className="btn btn-primary"
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
