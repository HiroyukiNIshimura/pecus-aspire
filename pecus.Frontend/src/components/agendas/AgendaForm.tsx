'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AgendaAttendeeRequest, AgendaResponse, RecurrenceType } from '@/connectors/api/pecus';

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
  recurrenceEndDate: string;
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

export function AgendaForm({ initialData, onSubmit, isPending, submitLabel }: AgendaFormProps) {
  // 初期値の設定
  const getInitialStartAt = () => {
    if (initialData?.startAt) {
      return toLocalDateTimeString(initialData.startAt);
    }
    // デフォルト: 次の時間（30分刻み）
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    now.setHours(now.getHours() + 1);
    return toLocalDateTimeString(now.toISOString());
  };

  const getInitialEndAt = () => {
    if (initialData?.endAt) {
      return toLocalDateTimeString(initialData.endAt);
    }
    // デフォルト: 開始時刻の1時間後
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    now.setHours(now.getHours() + 2);
    return toLocalDateTimeString(now.toISOString());
  };

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [startAt, setStartAt] = useState(getInitialStartAt);
  const [endAt, setEndAt] = useState(getInitialEndAt);
  const [isAllDay, setIsAllDay] = useState(initialData?.isAllDay ?? false);
  const [location, setLocation] = useState(initialData?.location ?? '');
  const [url, setUrl] = useState(initialData?.url ?? '');

  // 繰り返し設定
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(initialData?.recurrenceType ?? 'None');
  const [recurrenceInterval, setRecurrenceInterval] = useState(initialData?.recurrenceInterval ?? 1);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'date' | 'count' | 'never'>(
    initialData?.recurrenceEndDate ? 'date' : initialData?.recurrenceCount ? 'count' : 'never',
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    initialData?.recurrenceEndDate ? toLocalDateString(initialData.recurrenceEndDate) : '',
  );
  const [recurrenceCount, setRecurrenceCount] = useState(initialData?.recurrenceCount ?? 10);

  // リマインダー
  const [reminders, setReminders] = useState<number[]>(initialData?.reminders ?? [1440, 60]);

  // 参加者 - TODO: 参加者選択機能を実装時に使用
  const [attendees] = useState<AgendaAttendeeRequest[]>(
    initialData?.attendees?.map((a) => ({ userId: a.userId, isOptional: a.isOptional })) ?? [],
  );

  // 通知
  const [sendNotification, setSendNotification] = useState(true);

  // 終日切り替え時に時刻部分を調整
  useEffect(() => {
    if (isAllDay) {
      // 終日の場合、時刻を00:00にする
      const startDate = startAt.split('T')[0];
      const endDate = endAt.split('T')[0];
      setStartAt(`${startDate}T00:00`);
      setEndAt(`${endDate}T23:59`);
    }
  }, [isAllDay]);

  const handleReminderToggle = useCallback((value: number) => {
    setReminders((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: AgendaFormData = {
      title,
      description,
      startAt: toISOString(startAt),
      endAt: toISOString(endAt),
      isAllDay,
      location,
      url,
      recurrenceType,
      recurrenceInterval,
      recurrenceEndDate:
        recurrenceEndType === 'date' && recurrenceEndDate ? toISOString(`${recurrenceEndDate}T23:59:59`) : '',
      recurrenceCount: recurrenceEndType === 'count' ? recurrenceCount : null,
      reminders,
      attendees,
      sendNotification,
    };

    onSubmit(formData);
  };

  const isRecurring = recurrenceType && recurrenceType !== 'None';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          className="input input-bordered w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="予定のタイトル"
          required
          maxLength={200}
        />
      </div>

      {/* 終日チェック */}
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
          />
          <span className="label-text">終日</span>
        </label>
      </div>

      {/* 日時 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="form-control">
          <label className="label" htmlFor="startAt">
            <span className="label-text">
              開始 <span className="text-error">*</span>
            </span>
          </label>
          <input
            type={isAllDay ? 'date' : 'datetime-local'}
            id="startAt"
            className="input input-bordered w-full"
            value={isAllDay ? startAt.split('T')[0] : startAt}
            onChange={(e) => setStartAt(isAllDay ? `${e.target.value}T00:00` : e.target.value)}
            required
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="endAt">
            <span className="label-text">
              終了 <span className="text-error">*</span>
            </span>
          </label>
          <input
            type={isAllDay ? 'date' : 'datetime-local'}
            id="endAt"
            className="input input-bordered w-full"
            value={isAllDay ? endAt.split('T')[0] : endAt}
            onChange={(e) => setEndAt(isAllDay ? `${e.target.value}T23:59` : e.target.value)}
            required
          />
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
            className="input input-bordered w-full"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="会議室A、オンラインなど"
            maxLength={200}
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="url">
            <span className="label-text">URL</span>
          </label>
          <input
            type="url"
            id="url"
            className="input input-bordered w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
          />
        </div>
      </div>

      {/* 詳細 */}
      <div className="form-control">
        <label className="label" htmlFor="description">
          <span className="label-text">詳細</span>
        </label>
        <textarea
          id="description"
          className="textarea textarea-bordered w-full"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="予定の詳細（Markdown対応）"
        />
      </div>

      {/* 繰り返し設定 */}
      <div className="rounded-lg border border-base-300 p-4">
        <h3 className="mb-3 font-medium">繰り返し設定</h3>

        <div className="form-control">
          <label className="label" htmlFor="recurrenceType">
            <span className="label-text">繰り返し</span>
          </label>
          <select
            id="recurrenceType"
            className="select select-bordered w-full"
            value={recurrenceType ?? 'None'}
            onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
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
                  className="input input-bordered w-20"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Number(e.target.value))}
                  min={1}
                  max={99}
                />
                <span className="text-sm text-base-content/70">
                  {recurrenceType === 'Daily' && '日ごと'}
                  {(recurrenceType === 'Weekly' || recurrenceType === 'Biweekly') && '週ごと'}
                  {(recurrenceType === 'MonthlyByDate' || recurrenceType === 'MonthlyByWeekday') && 'ヶ月ごと'}
                  {recurrenceType === 'Yearly' && '年ごと'}
                </span>
              </div>
            </div>

            {/* 終了条件 */}
            <div className="form-control mt-3">
              <span className="label-text mb-2">終了</span>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recurrenceEndType"
                    className="radio radio-primary"
                    checked={recurrenceEndType === 'date'}
                    onChange={() => setRecurrenceEndType('date')}
                  />
                  <span>終了日を指定</span>
                  {recurrenceEndType === 'date' && (
                    <input
                      type="date"
                      className="input input-bordered input-sm ml-2"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    />
                  )}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recurrenceEndType"
                    className="radio radio-primary"
                    checked={recurrenceEndType === 'count'}
                    onChange={() => setRecurrenceEndType('count')}
                  />
                  <span>回数を指定</span>
                  {recurrenceEndType === 'count' && (
                    <>
                      <input
                        type="number"
                        className="input input-bordered input-sm ml-2 w-20"
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                        min={1}
                        max={999}
                      />
                      <span>回</span>
                    </>
                  )}
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recurrenceEndType"
                    className="radio radio-primary"
                    checked={recurrenceEndType === 'never'}
                    onChange={() => setRecurrenceEndType('never')}
                  />
                  <span>終了しない</span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* リマインダー */}
      <div className="rounded-lg border border-base-300 p-4">
        <h3 className="mb-3 font-medium">リマインダー</h3>
        <div className="flex flex-wrap gap-2">
          {reminderOptions.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={reminders.includes(opt.value)}
                onChange={() => handleReminderToggle(opt.value)}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 通知設定 */}
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
          />
          <span className="label-text">参加者にメール通知を送信する（推奨）</span>
        </label>
      </div>

      {/* TODO: 参加者選択は別途実装 */}
      <div className="rounded-lg border border-base-300 bg-base-200/50 p-4">
        <h3 className="mb-2 font-medium text-base-content/70">参加者</h3>
        <p className="text-sm text-base-content/50">
          参加者の追加機能は別途実装予定です。現在は作成者のみが参加者として登録されます。
        </p>
      </div>

      {/* 送信ボタン */}
      <div className="flex justify-end gap-2 pt-4">
        <button type="submit" className="btn btn-primary" disabled={isPending || !title.trim()}>
          {isPending && <span className="loading loading-spinner loading-sm" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
