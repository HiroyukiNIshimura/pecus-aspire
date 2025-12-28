'use client';

import { useEffect, useState } from 'react';
import type { CreateOrganizationRequest } from '@/connectors/api/pecus';

type CreateOrganizationForm = Omit<CreateOrganizationRequest, 'name'> & { name: string };

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: CreateOrganizationRequest) => Promise<void>;
}

const initialForm: CreateOrganizationForm = {
  name: '',
  code: '',
  phoneNumber: '',
  email: '',
  representativeName: '',
  description: '',
  adminUsername: '',
  adminEmail: '',
};

export default function CreateOrganizationModal({ isOpen, onClose, onConfirm }: CreateOrganizationModalProps) {
  const [form, setForm] = useState<CreateOrganizationForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateOrganizationForm, string>>>({});

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CreateOrganizationForm, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = '組織名は必須です';
    } else if (form.name.length > 100) {
      newErrors.name = '組織名は100文字以内で入力してください';
    }

    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = '電話番号は必須です';
    } else if (!/^[0-9-]+$/.test(form.phoneNumber)) {
      newErrors.phoneNumber = '電話番号は半角数字とハイフンのみ入力できます';
    }

    if (!form.code?.trim()) {
      newErrors.code = '組織コードは必須です';
    } else if (!/^[a-zA-Z0-9-_]+$/.test(form.code)) {
      newErrors.code = 'コードは半角英数字とハイフン、アンダースコアのみ入力できます';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!form.adminUsername.trim()) {
      newErrors.adminUsername = '管理者ユーザー名は必須です';
    } else if (form.adminUsername.length < 3) {
      newErrors.adminUsername = '管理者ユーザー名は3文字以上で入力してください';
    }

    if (!form.adminEmail.trim()) {
      newErrors.adminEmail = '管理者メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) {
      newErrors.adminEmail = '有効なメールアドレスを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        name: form.name.trim(),
        phoneNumber: form.phoneNumber.trim(),
        code: form.code?.trim(),
        description: form.description?.trim() || undefined,
        representativeName: form.representativeName?.trim() || undefined,
        email: form.email?.trim() || undefined,
        adminUsername: form.adminUsername.trim(),
        adminEmail: form.adminEmail.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    form.name.trim() &&
    form.code?.trim() &&
    form.phoneNumber.trim() &&
    form.adminUsername.trim() &&
    form.adminEmail.trim();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="bg-base-100 rounded-box shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-base-300 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <span className="icon-[mdi--office-building-plus-outline] w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold">組織を新規作成</h2>
              <p className="text-sm text-base-content/70">新しい組織と管理者ユーザーを作成します</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="閉じる"
          >
            <span className="icon-[mdi--close] size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="divider mt-0">組織情報</div>

          <div className="form-control mb-4">
            <label className="label" htmlFor="organization-name">
              <span className="label-text font-semibold">
                組織名 <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="organization-name"
              type="text"
              className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="株式会社サンプル"
              maxLength={100}
              disabled={isSubmitting}
            />
            {errors.name && (
              <div className="label">
                <span className="label-text-alt text-error">{errors.name}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label" htmlFor="organization-code">
                <span className="label-text font-semibold">
                  組織コード <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="organization-code"
                type="text"
                className={`input input-bordered w-full ${errors.code ? 'input-error' : ''}`}
                value={form.code || ''}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="sample-corp"
                disabled={isSubmitting}
              />
              {errors.code && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.code}</span>
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="organization-phone">
                <span className="label-text font-semibold">
                  電話番号 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="organization-phone"
                type="tel"
                className={`input input-bordered w-full ${errors.phoneNumber ? 'input-error' : ''}`}
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="03-1234-5678"
                disabled={isSubmitting}
              />
              {errors.phoneNumber && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label" htmlFor="organization-representative">
                <span className="label-text font-semibold">代表者名</span>
              </label>
              <input
                id="organization-representative"
                type="text"
                className="input input-bordered w-full"
                value={form.representativeName || ''}
                onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
                placeholder="山田 太郎"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="organization-email">
                <span className="label-text font-semibold">組織メールアドレス</span>
              </label>
              <input
                id="organization-email"
                type="email"
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@example.com"
                disabled={isSubmitting}
              />
              {errors.email && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label" htmlFor="organization-description">
              <span className="label-text font-semibold">説明</span>
            </label>
            <textarea
              id="organization-description"
              className="textarea textarea-bordered h-20"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="組織の説明（任意）"
              disabled={isSubmitting}
            />
          </div>

          <div className="divider">管理者ユーザー情報</div>

          <div className="alert alert-soft alert-info mt-4 mb-4">
            <span className="icon-[mdi--information-outline] w-5 h-5" aria-hidden="true" />
            <div>
              <p className="text-sm">管理者ユーザーにはパスワード設定メールが送信されます</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label" htmlFor="admin-username">
                <span className="label-text font-semibold">
                  管理者ユーザー名 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="admin-username"
                type="text"
                className={`input input-bordered w-full ${errors.adminUsername ? 'input-error' : ''}`}
                value={form.adminUsername}
                onChange={(e) => setForm({ ...form, adminUsername: e.target.value })}
                placeholder="admin_user"
                disabled={isSubmitting}
              />
              {errors.adminUsername && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.adminUsername}</span>
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="admin-email">
                <span className="label-text font-semibold">
                  管理者メールアドレス <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="admin-email"
                type="email"
                className={`input input-bordered w-full ${errors.adminEmail ? 'input-error' : ''}`}
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                placeholder="admin@example.com"
                disabled={isSubmitting}
              />
              {errors.adminEmail && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.adminEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 sm:p-6 border-t border-base-300 shrink-0">
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={isSubmitting}>
            キャンセル
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm" aria-hidden="true" />
                作成中...
              </>
            ) : (
              <>
                <span className="icon-[mdi--plus] size-5" aria-hidden="true" />
                組織を作成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
