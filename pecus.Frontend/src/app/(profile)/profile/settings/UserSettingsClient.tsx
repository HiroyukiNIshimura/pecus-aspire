'use client';

import { useState } from 'react';
import { updateUserSetting } from '@/actions/profile';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { Slider } from '@/components/common/Slider';
import type { FocusScorePriority, LandingPage, UserSettingResponse } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { type UserSettingInput, userSettingSchema } from '@/schemas/userSettingSchemas';
import { LANDING_PAGE_OPTIONS } from '@/utils/landingPage';

interface UserSettingsClientProps {
  initialSettings: UserSettingResponse;
  fetchError?: string | null;
}

const FOCUS_SCORE_PRIORITY_OPTIONS: { value: NonNullable<FocusScorePriority>; label: string; description: string }[] = [
  { value: 'Priority', label: '優先度重視', description: 'タスクの優先度を最も重視してスコアリングします' },
  { value: 'Deadline', label: '期限重視', description: 'タスクの期限を最も重視してスコアリングします' },
  {
    value: 'SuccessorImpact',
    label: '後続タスク影響重視',
    description: '後続タスクへの影響を最も重視してスコアリングします',
  },
];

export default function UserSettingsClient({ initialSettings, fetchError }: UserSettingsClientProps) {
  const notify = useNotify();
  const [rowVersion, setRowVersion] = useState<number>(initialSettings.rowVersion ?? 0);
  const [formData, setFormData] = useState<UserSettingInput>({
    canReceiveEmail: initialSettings.canReceiveEmail ?? true,
    canReceiveRealtimeNotification: initialSettings.canReceiveRealtimeNotification ?? true,
    timeZone: initialSettings.timeZone,
    language: initialSettings.language,
    landingPage: initialSettings.landingPage ?? undefined,
    focusScorePriority: initialSettings.focusScorePriority ?? undefined,
    focusTasksLimit: initialSettings.focusTasksLimit ?? 10,
    waitingTasksLimit: initialSettings.waitingTasksLimit ?? 10,
  });

  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError, resetForm } =
    useFormValidation({
      schema: userSettingSchema,
      onSubmit: async (data) => {
        try {
          const result = await updateUserSetting({
            canReceiveEmail: data.canReceiveEmail,
            canReceiveRealtimeNotification: data.canReceiveRealtimeNotification,
            timeZone: data.timeZone,
            language: data.language,
            landingPage: data.landingPage as LandingPage | undefined,
            focusScorePriority: data.focusScorePriority as FocusScorePriority | undefined,
            focusTasksLimit: data.focusTasksLimit,
            waitingTasksLimit: data.waitingTasksLimit,
            rowVersion,
          });

          if (result.success) {
            syncWithResponse(result.data);
            notify.success('設定を保存しました');
            return;
          }

          if (!result.success && result.error === 'conflict' && 'latest' in result && result.latest) {
            const latest = result.latest.data as UserSettingResponse;
            syncWithResponse(latest);
            notify.error(result.message || '他のユーザーが同時に更新しました。最新の設定を反映しました。');
            return;
          }

          notify.error(result.message || '保存に失敗しました');
        } catch (error) {
          console.error('Settings update error:', error);
          notify.error('予期しないエラーが発生しました');
        }
      },
    });

  const syncWithResponse = (setting: UserSettingResponse) => {
    setRowVersion(setting.rowVersion ?? 0);
    setFormData({
      canReceiveEmail: setting.canReceiveEmail ?? true,
      canReceiveRealtimeNotification: setting.canReceiveRealtimeNotification ?? true,
      timeZone: setting.timeZone,
      language: setting.language,
      landingPage: setting.landingPage ?? undefined,
      focusScorePriority: setting.focusScorePriority ?? undefined,
      focusTasksLimit: setting.focusTasksLimit ?? 10,
      waitingTasksLimit: setting.waitingTasksLimit ?? 10,
    });
  };

  const handleFieldChange = async (fieldName: keyof UserSettingInput, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value as never,
    }));
    await validateField(fieldName, value);
  };

  return (
    <>
      <LoadingOverlay isLoading={isSubmitting} message="保存中..." />
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">ユーザー設定</h1>
          <p className="text-base-content/70">通知設定などの個人設定を管理してください</p>
        </div>

        {fetchError && (
          <div className="alert alert-soft alert-error mb-4">
            <span className="icon-[mdi--alert-circle] size-5" aria-hidden="true" />
            <span>{fetchError}</span>
          </div>
        )}

        <div className="card bg-base-100">
          <div className="card-body">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label htmlFor="canReceiveEmail" className="label cursor-pointer justify-start gap-4">
                  <input
                    id="canReceiveEmail"
                    name="canReceiveEmail"
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={!!formData.canReceiveEmail}
                    onChange={(e) => handleFieldChange('canReceiveEmail', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <div>
                    <span className="label-text font-semibold">メール通知を受信する</span>
                    <p className="text-sm text-base-content/70 mt-1">システムからの通知メールを受信します</p>
                  </div>
                </label>
              </div>

              <div className="form-control">
                <label htmlFor="landingPage" className="label">
                  <span className="label-text font-semibold">ログイン後の表示ページ</span>
                </label>
                <select
                  id="landingPage"
                  name="landingPage"
                  className={`select select-bordered w-full ${shouldShowError('landingPage') ? 'select-error' : ''}`}
                  value={formData.landingPage ?? 'Dashboard'}
                  onChange={(e) => handleFieldChange('landingPage', e.target.value)}
                  disabled={isSubmitting}
                >
                  {LANDING_PAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {shouldShowError('landingPage') && (
                  <span className="label-text-alt text-error">{getFieldError('landingPage')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">ログイン後に最初に表示されるページを選択できます</p>
              </div>

              <div className="divider my-6">フォーカス推奨設定</div>

              <div className="form-control">
                <label htmlFor="focusScorePriority" className="label">
                  <span className="label-text font-semibold">スコアリング優先要素</span>
                </label>
                <select
                  id="focusScorePriority"
                  name="focusScorePriority"
                  className={`select select-bordered w-full ${shouldShowError('focusScorePriority') ? 'select-error' : ''}`}
                  value={formData.focusScorePriority ?? 'Deadline'}
                  onChange={(e) => handleFieldChange('focusScorePriority', e.target.value)}
                  disabled={isSubmitting}
                >
                  {FOCUS_SCORE_PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {shouldShowError('focusScorePriority') && (
                  <span className="label-text-alt text-error">{getFieldError('focusScorePriority')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">
                  {
                    FOCUS_SCORE_PRIORITY_OPTIONS.find(
                      (opt) => opt.value === (formData.focusScorePriority ?? 'Deadline'),
                    )?.description
                  }
                </p>
              </div>

              <div className="form-control">
                <Slider
                  min={5}
                  max={20}
                  step={1}
                  name="focusTasksLimit"
                  value={formData.focusTasksLimit}
                  onChange={(value) => handleFieldChange('focusTasksLimit', value)}
                  label="フォーカス推奨タスクの表示件数"
                  showValue
                  valueFormatter={(value) => `${value}件`}
                  disabled={isSubmitting}
                  ariaLabel="フォーカス推奨タスクの表示件数"
                />
                {shouldShowError('focusTasksLimit') && (
                  <span className="label-text-alt text-error">{getFieldError('focusTasksLimit')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">
                  着手可能なタスクのうち、上位何件を表示するか設定します
                </p>
              </div>

              <div className="form-control">
                <Slider
                  min={5}
                  max={20}
                  step={1}
                  name="waitingTasksLimit"
                  value={formData.waitingTasksLimit}
                  onChange={(value) => handleFieldChange('waitingTasksLimit', value)}
                  label="待機中タスクの表示件数"
                  showValue
                  valueFormatter={(value) => `${value}件`}
                  disabled={isSubmitting}
                  ariaLabel="待機中タスクの表示件数"
                />
                {shouldShowError('waitingTasksLimit') && (
                  <span className="label-text-alt text-error">{getFieldError('waitingTasksLimit')}</span>
                )}
                <p className="text-sm text-base-content/70 mt-1">
                  先行タスクが未完了で待機中のタスクのうち、上位何件を表示するか設定します
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    resetForm();
                    syncWithResponse(initialSettings);
                  }}
                  disabled={isSubmitting}
                >
                  リセット
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
