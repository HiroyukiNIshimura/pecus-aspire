'use client';

import { useEffect, useState } from 'react';
import DatePicker from '@/components/common/filters/DatePicker';
import type { SystemNotificationType } from '@/connectors/api/pecus';

interface CreateNotificationForm {
  subject: string;
  body: string;
  type: SystemNotificationType;
  publishDate: string;
  publishTime: string;
  endDate: string;
  endTime: string;
}

interface CreateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    subject: string;
    body: string;
    type: SystemNotificationType;
    publishAt: string;
    endAt?: string;
  }) => Promise<void>;
}

const notificationTypeLabels: Record<string, string> = {
  EmergencyMaintenance: '緊急メンテナンス',
  ScheduledMaintenance: '定期メンテナンス',
  Important: '重要',
  Info: 'お知らせ',
  IncidentReport: '障害報告',
};

const notificationTypeDescriptions: Record<string, string> = {
  EmergencyMaintenance: '緊急のシステムメンテナンス情報を通知',
  ScheduledMaintenance: '事前に予定されたメンテナンス情報を通知',
  Important: 'ユーザーに重要な情報を通知',
  Info: '一般的なお知らせを通知',
  IncidentReport: 'システム障害や問題の報告を通知',
};

const initialForm: CreateNotificationForm = {
  subject: '',
  body: '',
  type: 'Info',
  publishDate: '',
  publishTime: '09:00',
  endDate: '',
  endTime: '23:59',
};

export default function CreateNotificationModal({ isOpen, onClose, onConfirm }: CreateNotificationModalProps) {
  const [form, setForm] = useState<CreateNotificationForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateNotificationForm, string>>>({});

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
    const newErrors: Partial<Record<keyof CreateNotificationForm, string>> = {};

    if (!form.subject.trim()) {
      newErrors.subject = '件名は必須です';
    } else if (form.subject.length > 200) {
      newErrors.subject = '件名は200文字以内で入力してください';
    }

    if (!form.body.trim()) {
      newErrors.body = '本文は必須です';
    }

    if (!form.publishDate) {
      newErrors.publishDate = '公開日は必須です';
    } else if (form.publishTime) {
      const publishDateTime = new Date(`${form.publishDate}T${form.publishTime}`);
      const now = new Date();
      if (publishDateTime < now) {
        newErrors.publishDate = '公開日時は現在以降の日時を設定してください';
      }
    }

    if (!form.publishTime) {
      newErrors.publishTime = '公開時間は必須です';
    }

    if (form.endDate && !form.endTime) {
      newErrors.endTime = '終了日を設定した場合、終了時間も必須です';
    }

    if (form.publishDate && form.endDate) {
      const publishDateTime = new Date(`${form.publishDate}T${form.publishTime}`);
      const endDateTime = new Date(`${form.endDate}T${form.endTime || '23:59'}`);
      if (endDateTime <= publishDateTime) {
        newErrors.endDate = '終了日時は公開日時より後に設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const publishAt = `${form.publishDate}T${form.publishTime}:00`;
      const endAt = form.endDate ? `${form.endDate}T${form.endTime || '23:59'}:00` : undefined;

      await onConfirm({
        subject: form.subject.trim(),
        body: form.body.trim(),
        type: form.type,
        publishAt,
        endAt,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = form.subject.trim() && form.body.trim() && form.publishDate && form.publishTime;

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
              <span className="icon-[mdi--bell-plus-outline] w-6 h-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold">システム通知を作成</h2>
              <p className="text-sm text-base-content/70">全ユーザーに配信される通知を作成します</p>
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
          <div className="form-control mb-4">
            <label className="label" htmlFor="notification-type">
              <span className="label-text font-semibold">通知種類</span>
            </label>
            <select
              id="notification-type"
              className="select select-bordered w-full"
              value={form.type || 'Info'}
              onChange={(e) => setForm({ ...form, type: e.target.value as SystemNotificationType })}
              disabled={isSubmitting}
            >
              {Object.entries(notificationTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                {form.type ? notificationTypeDescriptions[form.type] : ''}
              </span>
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label" htmlFor="notification-subject">
              <span className="label-text font-semibold">
                件名 <span className="text-error">*</span>
              </span>
            </label>
            <input
              id="notification-subject"
              type="text"
              className={`input input-bordered w-full ${errors.subject ? 'input-error' : ''}`}
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="通知の件名を入力"
              maxLength={200}
              disabled={isSubmitting}
            />
            {errors.subject && (
              <div className="label">
                <span className="label-text-alt text-error">{errors.subject}</span>
              </div>
            )}
          </div>

          <div className="form-control mb-4">
            <label className="label" htmlFor="notification-body">
              <span className="label-text font-semibold">
                本文 <span className="text-error">*</span>
              </span>
            </label>
            <textarea
              id="notification-body"
              className={`textarea textarea-bordered h-32 ${errors.body ? 'textarea-error' : ''}`}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="通知の本文を入力..."
              disabled={isSubmitting}
            />
            {errors.body && (
              <div className="label">
                <span className="label-text-alt text-error">{errors.body}</span>
              </div>
            )}
          </div>

          <div className="divider">配信スケジュール</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label" htmlFor="notification-publish-date">
                <span className="label-text font-semibold">
                  公開日 <span className="text-error">*</span>
                </span>
              </label>
              <DatePicker
                value={form.publishDate}
                onChange={(date) => setForm({ ...form, publishDate: date })}
                disabled={isSubmitting}
                placeholder="公開日を選択"
                error={!!errors.publishDate}
              />
              {errors.publishDate && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.publishDate}</span>
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="notification-publish-time">
                <span className="label-text font-semibold">
                  公開時間 <span className="text-error">*</span>
                </span>
              </label>
              <input
                id="notification-publish-time"
                type="time"
                className={`input input-bordered w-full ${errors.publishTime ? 'input-error' : ''}`}
                value={form.publishTime}
                onChange={(e) => setForm({ ...form, publishTime: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.publishTime && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.publishTime}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="form-control">
              <label className="label" htmlFor="notification-end-date">
                <span className="label-text font-semibold">終了日（任意）</span>
              </label>
              <DatePicker
                value={form.endDate}
                onChange={(date) => setForm({ ...form, endDate: date })}
                disabled={isSubmitting}
                placeholder="終了日を選択"
                error={!!errors.endDate}
              />
              {errors.endDate && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.endDate}</span>
                </div>
              )}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="notification-end-time">
                <span className="label-text font-semibold">終了時間</span>
              </label>
              <input
                id="notification-end-time"
                type="time"
                className={`input input-bordered w-full ${errors.endTime ? 'input-error' : ''}`}
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                disabled={isSubmitting || !form.endDate}
              />
              {errors.endTime && (
                <div className="label">
                  <span className="label-text-alt text-error">{errors.endTime}</span>
                </div>
              )}
            </div>
          </div>

          <div className="alert alert-soft alert-info">
            <span className="icon-[mdi--information-outline] w-5 h-5" aria-hidden="true" />
            <div>
              <p className="text-sm">
                公開日時になると、Hangfireジョブにより全ユーザーに通知が配信されます。
                終了日時を設定すると、その日時以降は通知が非表示になります。
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-6 border-t border-base-300 mt-6">
            <button type="button" className="btn btn-outline" onClick={handleClose} disabled={isSubmitting}>
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
                  <span className="loading loading-spinner loading-sm"></span>
                  作成中...
                </>
              ) : (
                <>
                  <span className="icon-[mdi--check] w-4 h-4" aria-hidden="true" />
                  作成する
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
