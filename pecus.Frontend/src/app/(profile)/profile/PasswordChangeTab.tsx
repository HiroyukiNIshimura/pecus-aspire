'use client';

import { useState } from 'react';
import { updateUserPassword } from '@/actions/profile';
import PasswordRequirementIndicator, {
  isPasswordValid,
} from '@/components/common/forms/PasswordRequirementIndicator.server';
import { useFormValidation } from '@/hooks/useFormValidation';
import { updatePasswordFormSchema } from '@/schemas/profileSchemas';

interface PasswordChangeTabProps {
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function PasswordChangeTab({ notify, isLoading, setIsLoading }: PasswordChangeTabProps) {
  const [showPasswords, setShowPasswords] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: updatePasswordFormSchema,
    onSubmit: async (data) => {
      setIsLoading(true);
      try {
        const result = await updateUserPassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        });

        if (result.success) {
          notify.success('パスワードを変更しました。');
          formRef.current?.reset();
          setNewPassword('');
        } else {
          notify.error(result.message || 'パスワード変更に失敗しました');
        }
      } catch (error) {
        console.error('Password change error:', error);
        notify.error('予期しないエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    },
  });

  const allRequirementsMet = isPasswordValid(newPassword);

  const handleFieldChange = async (fieldName: string, value: string) => {
    if (fieldName === 'newPassword') {
      setNewPassword(value);
    }
    // フィールド検証を実行
    await validateField(fieldName, value);
  };

  const handleReset = () => {
    formRef.current?.reset();
    setNewPassword('');
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
          name="currentPassword"
          type={showPasswords ? 'text' : 'password'}
          placeholder="現在のパスワードを入力"
          className={`input input-bordered ${shouldShowError('currentPassword') ? 'input-error' : ''}`}
          onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
          disabled={isLoading || isSubmitting}
          required
        />
        {shouldShowError('currentPassword') && (
          <div className="label">
            <span className="label-text-alt text-error">{getFieldError('currentPassword')}</span>
          </div>
        )}
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
          name="newPassword"
          type={showPasswords ? 'text' : 'password'}
          placeholder="新しいパスワードを入力"
          className={`input input-bordered ${shouldShowError('newPassword') ? 'input-error' : ''}`}
          onChange={(e) => handleFieldChange('newPassword', e.target.value)}
          disabled={isLoading || isSubmitting}
          required
        />
        {shouldShowError('newPassword') && (
          <div className="label">
            <span className="label-text-alt text-error">{getFieldError('newPassword')}</span>
          </div>
        )}
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
          name="confirmPassword"
          type={showPasswords ? 'text' : 'password'}
          placeholder="パスワードを再入力"
          className={`input input-bordered ${shouldShowError('confirmPassword') ? 'input-error' : ''}`}
          onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
          disabled={isLoading || isSubmitting}
          required
        />
        {shouldShowError('confirmPassword') && (
          <div className="label">
            <span className="label-text-alt text-error">{getFieldError('confirmPassword')}</span>
          </div>
        )}
      </div>

      {/* パスワード表示/非表示トグル */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showPasswords"
          className="checkbox"
          checked={showPasswords}
          onChange={() => setShowPasswords(!showPasswords)}
          disabled={isLoading || isSubmitting}
        />
        <label htmlFor="showPasswords" className="cursor-pointer">
          パスワードを表示
        </label>
      </div>

      {/* ボタングループ */}
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={handleReset} className="btn btn-outline" disabled={isLoading || isSubmitting}>
          クリア
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading || isSubmitting || !allRequirementsMet}>
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              変更中...
            </>
          ) : (
            'パスワードを変更'
          )}
        </button>
      </div>
    </form>
  );
}
