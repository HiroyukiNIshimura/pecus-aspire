'use client';

import { useCallback, useEffect, useState } from 'react';
import DatePicker from '@/components/common/filters/DatePicker';
import type { AgendaAttendeeRequest, AgendaResponse, RecurrenceType } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useLimitsSettings } from '@/providers/AppSettingsProvider';
import { createAgendaSchema } from '@/schemas/agendaSchemas';
import AttendeeSelector, { type SelectedAttendee, toAgendaAttendeeRequests } from './AttendeeSelector';

export interface AgendaFormData {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  location: string;
  url: string;
  recurrenceType: RecurrenceType;
  recurrenceInterval: number;
  recurrenceEndDate: string | null;
  recurrenceCount: number | null;
  reminders: number[];
  attendees: AgendaAttendeeRequest[];
  sendNotification: boolean;
}

interface AgendaFormProps {
  initialData?: AgendaResponse;
  onSubmit: (data: AgendaFormData) => void;
  isPending: boolean;
  submitLabel: string;
  /** 現在のユーザーID（主催者）- 参加者選択で除外するため */
  currentUserId: number;
  /** 繰り返し設定を非表示にする（「この回のみ」編集時） */
  hideRecurrence?: boolean;
  /** 参加者設定を非表示にする（「この回のみ」編集時） */
  hideAttendees?: boolean;
}

const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
  { value: 'None', label: '繰り返しなし' },
  { value: 'Daily', label: '毎日' },
  { value: 'Weekly', label: '毎週' },
  { value: 'Biweekly', label: '隔週' },
  { value: 'MonthlyByDate', label: '毎月（日付）' },
  { value: 'MonthlyByWeekday', label: '毎月（曜日）' },
  { value: 'Yearly', label: '毎年' },
];

const reminderOptions: { value: number; label: string }[] = [
  { value: 1440, label: '1日前' },
  { value: 60, label: '1時間前' },
  { value: 30, label: '30分前' },
  { value: 15, label: '15分前' },
  { value: 0, label: '開始時' },
];

/** ISO文字列をローカル日時入力用にフォーマット */
function toLocalDateTimeString(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** ISO文字列をローカル日付入力用にフォーマット */
function toLocalDateString(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** ローカル日時文字列をISO文字列に変換 */
function toISOString(localString: string): string {
  const date = new Date(localString);
  return date.toISOString();
}

export function AgendaForm({
  initialData,
  onSubmit,
  isPending,
  submitLabel,
  currentUserId,
  hideRecurrence = false,
  hideAttendees = false,
}: AgendaFormProps) {
  // 制限設定から最大参加者数を取得
  const { maxAttendeesPerAgenda } = useLimitsSettings();

  // 初期値の設定
  const getInitialStartAt = useCallback(() => {
    if (initialData?.startAt) {
      return toLocalDateTimeString(initialData.startAt);
    }
    // デフォルト: 次の時間（30分刻み）
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    now.setHours(now.getHours() + 1);
    return toLocalDateTimeString(now.toISOString());
  }, [initialData?.startAt]);

  const getInitialEndAt = useCallback(() => {
    if (initialData?.endAt) {
      return toLocalDateTimeString(initialData.endAt);
    }
    // デフォルト: 開始時刻の1時間後
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    now.setHours(now.getHours() + 2);
    return toLocalDateTimeString(now.toISOString());
  }, [initialData?.endAt]);

  // フォーム状態（リアルタイムUI更新用）
  const [formData, setFormData] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    startAt: getInitialStartAt(),
    endAt: getInitialEndAt(),
    isAllDay: initialData?.isAllDay ?? false,
    location: initialData?.location ?? '',
    url: initialData?.url ?? '',
    recurrenceType: (initialData?.recurrenceType ?? 'None') as RecurrenceType,
    recurrenceInterval: initialData?.recurrenceInterval ?? 1,
    recurrenceEndType: (initialData?.recurrenceEndDate ? 'date' : 'count') as 'date' | 'count',
    recurrenceEndDate: initialData?.recurrenceEndDate ? toLocalDateString(initialData.recurrenceEndDate) : '',
    recurrenceCount: initialData?.recurrenceCount ?? 12,
    sendNotification: true,
  });

  // リマインダー（フォームとは別で管理）
  const [reminders, setReminders] = useState<number[]>(initialData?.reminders ?? [1440, 60]);

  // 参加者選択の状態管理
  const [selectedAttendees, setSelectedAttendees] = useState<SelectedAttendee[]>(() => {
    // initialDataがあれば変換
    if (initialData?.attendees) {
      return initialData.attendees.map((a) => ({
        userId: a.userId,
        userName: a.user?.username ?? '',
        email: a.user?.email ?? '',
        identityIconUrl: a.user?.identityIconUrl ?? null,
        isOptional: a.isOptional,
      }));
    }
    return [];
  });

  // useFormValidationフック
  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: createAgendaSchema,
    onSubmit: async (data) => {
      // Zod検証済みデータをAgendaFormDataに変換
      const agendaFormData: AgendaFormData = {
        title: data.title,
        description: data.description || '',
        startAt: toISOString(data.startAt),
        endAt: toISOString(data.endAt),
        isAllDay: data.isAllDay,
        location: data.location || '',
        url: data.url || '',
        recurrenceType: data.recurrenceType as RecurrenceType,
        recurrenceInterval: data.recurrenceInterval,
        recurrenceEndDate:
          data.recurrenceEndType === 'date' && data.recurrenceEndDate
            ? data.recurrenceEndDate // "YYYY-MM-DD" 形式でそのまま送信（DateOnlyへの変換）
            : null,
        recurrenceCount: data.recurrenceEndType === 'count' ? data.recurrenceCount : null,
        reminders,
        attendees: toAgendaAttendeeRequests(selectedAttendees),
        sendNotification: data.sendNotification,
      };

      onSubmit(agendaFormData);
    },
  });

  // フィールド変更ハンドラー
  const handleFieldChange = useCallback(<K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 終日切り替え時に時刻部分を調整
  useEffect(() => {
    if (formData.isAllDay) {
      const startDate = formData.startAt.split('T')[0];
      const endDate = formData.endAt.split('T')[0];
      setFormData((prev) => ({
        ...prev,
        startAt: `${startDate}T00:00`,
        endAt: `${endDate}T23:59`,
      }));
    }
  }, [formData.isAllDay]);

  const handleReminderToggle = useCallback((value: number) => {
    setReminders((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]));
  }, []);

  const isRecurring = formData.recurrenceType && formData.recurrenceType !== 'None';
  const isFormDisabled = isPending || isSubmitting;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* タイトル */}
      <div className="form-control">
        <label className="label" htmlFor="title">
          <span className="label-text">
            タイトル <span className="text-error">*</span>
          </span>
        </label>
        <input
          type="text"
          id="title"
          data-field="title"
          className={`input input-bordered w-full ${shouldShowError('title') ? 'input-error' : ''}`}
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          onBlur={() => validateField('title', formData.title)}
          placeholder="予定のタイトル"
          maxLength={200}
          disabled={isFormDisabled}
        />
        {shouldShowError('title') && (
          <div className="label">
            <span className="label-text-alt text-error">{getFieldError('title')}</span>
          </div>
        )}
        <div className="label">
          <span className="label-text-alt text-xs">{formData.title.length}/200 文字</span>
        </div>
      </div>

      {/* 日時 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="form-control">
          <label className="label" htmlFor="startAt">
            <span className="label-text">
              開始 <span className="text-error">*</span>
            </span>
          </label>
          <DatePicker
            mode={formData.isAllDay ? 'date' : 'datetime'}
            value={formData.isAllDay ? formData.startAt.split('T')[0] : formData.startAt}
            onChange={(value) => handleFieldChange('startAt', formData.isAllDay ? `${value}T00:00` : value)}
            onBlur={() => validateField('startAt', formData.startAt)}
            disabled={isFormDisabled}
            placeholder="開始日時を選択"
            error={shouldShowError('startAt')}
          />
          <input type="hidden" data-field="startAt" value={formData.startAt} />
          {shouldShowError('startAt') && (
            <div className="label">
              <span className="label-text-alt text-error">{getFieldError('startAt')}</span>
            </div>
          )}
        </div>
        <div className="form-control">
          <label className="label" htmlFor="endAt">
            <span className="label-text">
              終了 <span className="text-error">*</span>
            </span>
          </label>
          <DatePicker
            mode={formData.isAllDay ? 'date' : 'datetime'}
            value={formData.isAllDay ? formData.endAt.split('T')[0] : formData.endAt}
            onChange={(value) => handleFieldChange('endAt', formData.isAllDay ? `${value}T23:59` : value)}
            onBlur={() => validateField('endAt', formData.endAt)}
            disabled={isFormDisabled}
            placeholder="終了日時を選択"
            error={shouldShowError('endAt')}
          />
          <input type="hidden" data-field="endAt" value={formData.endAt} />
          {shouldShowError('endAt') && (
            <div className="label">
              <span className="label-text-alt text-error">{getFieldError('endAt')}</span>
            </div>
          )}
        </div>
        <div className="form-control">
          <label className="label" htmlFor="isAllDay">
            <span className="label-text">終日</span>
          </label>
          <div className="flex items-center h-12 px-1">
            <input
              type="checkbox"
              id="isAllDay"
              data-field="isAllDay"
              className="checkbox checkbox-primary"
              checked={formData.isAllDay}
              onChange={(e) => handleFieldChange('isAllDay', e.target.checked)}
              disabled={isFormDisabled}
            />
          </div>
        </div>
      </div>

      {/* 場所 / URL */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-control">
          <label className="label" htmlFor="location">
            <span className="label-text">場所</span>
          </label>
          <input
            type="text"
            id="location"
            data-field="location"
            className={`input input-bordered w-full ${shouldShowError('location') ? 'input-error' : ''}`}
            value={formData.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            onBlur={() => validateField('location', formData.location)}
            placeholder="会議室A、オンラインなど"
            maxLength={200}
            disabled={isFormDisabled}
          />
          {shouldShowError('location') && (
            <div className="label">
              <span className="label-text-alt text-error">{getFieldError('location')}</span>
            </div>
          )}
        </div>
        <div className="form-control">
          <label className="label" htmlFor="url">
            <span className="label-text">URL</span>
          </label>
          <input
            type="text"
            id="url"
            data-field="url"
            className={`input input-bordered w-full ${shouldShowError('url') ? 'input-error' : ''}`}
            value={formData.url}
            onChange={(e) => handleFieldChange('url', e.target.value)}
            onBlur={() => validateField('url', formData.url)}
            placeholder="https://zoom.us/j/..."
            disabled={isFormDisabled}
          />
          {shouldShowError('url') && (
            <div className="label">
              <span className="label-text-alt text-error">{getFieldError('url')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 詳細 */}
      <div className="form-control">
        <label className="label" htmlFor="description">
          <span className="label-text">詳細</span>
        </label>
        <textarea
          id="description"
          data-field="description"
          className="textarea textarea-bordered w-full"
          rows={4}
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="予定の詳細（Markdown対応）"
          disabled={isFormDisabled}
        />
      </div>

      {/* 繰り返し設定（「この回のみ」編集時は非表示） */}
      {!hideRecurrence && (
        <div className="rounded-lg border border-base-300 p-4">
          <h3 className="mb-3 font-medium">繰り返し設定</h3>

          <div className="form-control">
            <label className="label" htmlFor="recurrenceType">
              <span className="label-text">繰り返し</span>
            </label>
            <select
              id="recurrenceType"
              data-field="recurrenceType"
              className="select select-bordered w-full"
              value={formData.recurrenceType ?? 'None'}
              onChange={(e) => handleFieldChange('recurrenceType', e.target.value as RecurrenceType)}
              disabled={isFormDisabled}
            >
              {recurrenceOptions.map((opt) => (
                <option key={opt.value} value={opt.value ?? 'None'}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {isRecurring && (
            <>
              {/* 間隔 */}
              <div className="form-control mt-3">
                <label className="label" htmlFor="recurrenceInterval">
                  <span className="label-text">間隔</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="recurrenceInterval"
                    data-field="recurrenceInterval"
                    className={`input input-bordered w-20 ${shouldShowError('recurrenceInterval') ? 'input-error' : ''}`}
                    value={formData.recurrenceInterval}
                    onChange={(e) => handleFieldChange('recurrenceInterval', Number(e.target.value))}
                    onBlur={() => validateField('recurrenceInterval', formData.recurrenceInterval)}
                    min={1}
                    max={99}
                    disabled={isFormDisabled}
                  />
                  <span className="text-sm text-base-content/70">
                    {formData.recurrenceType === 'Daily' && '日ごと'}
                    {(formData.recurrenceType === 'Weekly' || formData.recurrenceType === 'Biweekly') && '週ごと'}
                    {(formData.recurrenceType === 'MonthlyByDate' || formData.recurrenceType === 'MonthlyByWeekday') &&
                      'ヶ月ごと'}
                    {formData.recurrenceType === 'Yearly' && '年ごと'}
                  </span>
                </div>
                {shouldShowError('recurrenceInterval') && (
                  <div className="label">
                    <span className="label-text-alt text-error">{getFieldError('recurrenceInterval')}</span>
                  </div>
                )}
              </div>

              {/* 終了条件 */}
              <div className="form-control mt-3">
                <span className="label-text mb-2">終了</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="recurrenceEndTypeRadio"
                      className="radio radio-primary"
                      checked={formData.recurrenceEndType === 'date'}
                      onChange={() => handleFieldChange('recurrenceEndType', 'date')}
                      disabled={isFormDisabled}
                    />
                    <span>終了日を指定</span>
                    {formData.recurrenceEndType === 'date' && (
                      <div className="ml-2">
                        <DatePicker
                          mode="date"
                          value={formData.recurrenceEndDate}
                          onChange={(value) => handleFieldChange('recurrenceEndDate', value)}
                          onBlur={() => validateField('recurrenceEndDate', formData.recurrenceEndDate)}
                          disabled={isFormDisabled}
                          placeholder="終了日を選択"
                          error={shouldShowError('recurrenceEndDate')}
                          className="input-sm"
                        />
                        <input type="hidden" data-field="recurrenceEndDate" value={formData.recurrenceEndDate} />
                      </div>
                    )}
                  </label>
                  {shouldShowError('recurrenceEndDate') && formData.recurrenceEndType === 'date' && (
                    <div className="label pt-0">
                      <span className="label-text-alt text-error">{getFieldError('recurrenceEndDate')}</span>
                    </div>
                  )}
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="recurrenceEndTypeRadio"
                      className="radio radio-primary"
                      checked={formData.recurrenceEndType === 'count'}
                      onChange={() => handleFieldChange('recurrenceEndType', 'count')}
                      disabled={isFormDisabled}
                    />
                    <span>回数を指定</span>
                    {formData.recurrenceEndType === 'count' && (
                      <>
                        <input
                          type="number"
                          data-field="recurrenceCount"
                          className={`input input-bordered input-sm ml-2 w-20 ${shouldShowError('recurrenceCount') ? 'input-error' : ''}`}
                          value={formData.recurrenceCount}
                          onChange={(e) => handleFieldChange('recurrenceCount', Number(e.target.value))}
                          onBlur={() => validateField('recurrenceCount', formData.recurrenceCount)}
                          min={1}
                          max={999}
                          disabled={isFormDisabled}
                        />
                        <span>回</span>
                      </>
                    )}
                  </label>
                  {shouldShowError('recurrenceCount') && formData.recurrenceEndType === 'count' && (
                    <div className="label pt-0">
                      <span className="label-text-alt text-error">{getFieldError('recurrenceCount')}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {/* Hidden field for recurrenceEndType to be picked up by useFormValidation */}
          <input type="hidden" data-field="recurrenceEndType" value={formData.recurrenceEndType} />
        </div>
      )}

      {/* リマインダー */}
      <div className="rounded-lg border border-base-300 p-4">
        <h3 className="mb-3 font-medium">リマインダー</h3>
        <div className="flex flex-wrap gap-2">
          {reminderOptions.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={reminders.includes(opt.value)}
                onChange={() => handleReminderToggle(opt.value)}
                disabled={isFormDisabled}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 通知設定（参加者設定が表示される場合のみ） */}
      {!hideAttendees && (
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer" htmlFor="toggle-send-notification">
            <input
              id="toggle-send-notification"
              type="checkbox"
              data-field="sendNotification"
              className="switch switch-primary"
              checked={formData.sendNotification}
              onChange={(e) => handleFieldChange('sendNotification', e.target.checked)}
              disabled={isFormDisabled}
            />
            <span className="font-semibold">参加者にメール通知を送信する（推奨）</span>
          </label>
          <p className="text-sm text-base-content/60 pl-12">
            有効にすると、アジェンダの作成・更新時に参加者へメールで通知されます。
          </p>
        </div>
      )}

      {/* 参加者選択（「この回のみ」編集時は非表示） */}
      {!hideAttendees && (
        <div className="form-control">
          <div className="label">
            <span className="label-text font-medium">参加者</span>
          </div>
          <AttendeeSelector
            selectedAttendees={selectedAttendees}
            onChange={setSelectedAttendees}
            disabled={isFormDisabled}
            currentUserId={currentUserId}
            maxAttendees={maxAttendeesPerAgenda}
          />
        </div>
      )}

      {/* 送信ボタン */}
      <div className="flex justify-end gap-2 pt-4">
        <button type="submit" className="btn btn-primary" disabled={isFormDisabled}>
          {(isPending || isSubmitting) && <span className="loading loading-spinner loading-sm" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
