'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { deleteBackOfficeNotification, updateBackOfficeNotification } from '@/actions/backoffice/notifications';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import DeleteNotificationModal from '@/components/backoffice/DeleteNotificationModal';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import DatePicker from '@/components/common/filters/DatePicker';
import type { BackOfficeNotificationDetailResponse, SystemNotificationType } from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useNotify } from '@/hooks/useNotify';
import { formatDate } from '@/libs/utils/date';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { type ApiErrorResponse, isAuthenticationError } from '@/types/errors';

interface NotificationDetailClientProps {
  initialData: BackOfficeNotificationDetailResponse | null;
  fetchError?: string | null;
}

const notificationTypeLabels: Record<string, string> = {
  EmergencyMaintenance: '緊急メンテナンス',
  ScheduledMaintenance: '定期メンテナンス',
  Important: '重要',
  Info: 'お知らせ',
  IncidentReport: '障害報告',
};

const notificationTypeBadgeClass: Record<string, string> = {
  EmergencyMaintenance: 'badge-error',
  ScheduledMaintenance: 'badge-warning',
  Important: 'badge-primary',
  Info: 'badge-info',
  IncidentReport: 'badge-error',
};

export default function NotificationDetailClient({ initialData, fetchError }: NotificationDetailClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [data, setData] = useState(initialData);
  const [clientError, setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);

  const { showLoading } = useDelayedLoading();
  const [isPending, startTransition] = useTransition();
  const notify = useNotify();

  const [isEditing, setIsEditing] = useState(false);

  const extractDateAndTime = (isoString: string | null | undefined) => {
    if (!isoString) return { date: '', time: '' };
    const d = new Date(isoString);
    const date = d.toISOString().slice(0, 10);
    const time = d.toTimeString().slice(0, 5);
    return { date, time };
  };

  const publishDateTime = extractDateAndTime(data?.publishAt);
  const endDateTime = extractDateAndTime(data?.endAt);

  const [editForm, setEditForm] = useState<{
    subject: string;
    body: string;
    type: NonNullable<SystemNotificationType>;
    publishDate: string;
    publishTime: string;
    endDate: string;
    endTime: string;
  }>({
    subject: data?.subject ?? '',
    body: data?.body ?? '',
    type: data?.type ?? 'Info',
    publishDate: publishDateTime.date,
    publishTime: publishDateTime.time || '09:00',
    endDate: endDateTime.date,
    endTime: endDateTime.time || '23:59',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  const handleSave = () => {
    if (!data) return;

    const publishAt = editForm.publishDate ? `${editForm.publishDate}T${editForm.publishTime}:00` : undefined;
    const endAt = editForm.endDate ? `${editForm.endDate}T${editForm.endTime || '23:59'}:00` : undefined;

    startTransition(async () => {
      const result = await updateBackOfficeNotification(data.id, {
        subject: editForm.subject || undefined,
        body: editForm.body || undefined,
        type: (editForm.type as BackOfficeNotificationDetailResponse['type']) || undefined,
        publishAt,
        endAt,
        rowVersion: data.rowVersion,
      });

      if (result.success) {
        setData(result.data);
        setIsEditing(false);
        setClientError(null);
        notify.success('通知を更新しました');
      } else {
        setClientError({ message: result.message, code: result.error });
        notify.error(result.message || '更新に失敗しました');
      }
    });
  };

  const handleDelete = async (deleteMessages: boolean) => {
    if (!data) return;

    const result = await deleteBackOfficeNotification(data.id, data.rowVersion, deleteMessages);

    if (result.success) {
      notify.success('通知を削除しました');
      router.push('/backoffice/notifications');
    } else {
      setClientError({ message: result.message, code: result.error });
      notify.error(result.message || '削除に失敗しました');
      throw new Error(result.message);
    }
  };

  const getStatusBadge = () => {
    if (!data) return null;
    if (data.isDeleted) {
      return <span className="badge badge-error badge-outline">削除済み</span>;
    }
    if (data.isProcessed) {
      return <span className="badge badge-success">配信済み</span>;
    }
    const now = new Date();
    const publishAt = data.publishAt ? new Date(data.publishAt) : null;
    if (publishAt && publishAt > now) {
      return <span className="badge badge-warning">配信待ち</span>;
    }
    return <span className="badge badge-info">処理中</span>;
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay isLoading={showLoading || isPending} message="処理中..." />

      <BackOfficeHeader
        userInfo={currentUser}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        loading={showLoading}
      />

      <div className="flex flex-1 overflow-hidden">
        <BackOfficeSidebar sidebarOpen={sidebarOpen} />

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-6 bg-base-100 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">通知詳細</h1>

            {clientError && (
              <div className="alert alert-soft alert-error mb-4">
                <span className="icon-[mdi--alert-circle] size-5" aria-hidden="true" />
                <span>{clientError.message || `エラーコード: ${clientError.code}`}</span>
              </div>
            )}

            {data && (
              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`badge ${notificationTypeBadgeClass[data.type || 'Info'] || 'badge-secondary'}`}>
                        {notificationTypeLabels[data.type || 'Info'] || data.type}
                      </span>
                      {getStatusBadge()}
                    </div>
                    <div className="flex gap-2">
                      {!isEditing && (
                        <a href="/backoffice/notifications" className="btn btn-secondary btn-sm">
                          <span className="icon-[mdi--arrow-left] size-5" aria-hidden="true" />
                          戻る
                        </a>
                      )}
                      {data.isEditable && !isEditing && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
                          <span className="icon-[mdi--pencil] size-4" aria-hidden="true" />
                          編集
                        </button>
                      )}
                      {!data.isDeleted && !isEditing && (
                        <button type="button" className="btn btn-error btn-sm" onClick={() => setShowDeleteModal(true)}>
                          <span className="icon-[mdi--delete] size-4" aria-hidden="true" />
                          削除
                        </button>
                      )}
                      {isEditing && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setIsEditing(false)}
                          >
                            キャンセル
                          </button>
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
                            保存
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <>
                      <div className="form-control mb-4">
                        <label className="label" htmlFor="edit-notification-type">
                          <span className="label-text font-semibold">種類</span>
                        </label>
                        <select
                          id="edit-notification-type"
                          className="select select-bordered"
                          value={editForm.type}
                          onChange={(e) =>
                            setEditForm({ ...editForm, type: e.target.value as NonNullable<SystemNotificationType> })
                          }
                        >
                          {Object.entries(notificationTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-control mb-4">
                        <label className="label" htmlFor="edit-notification-subject">
                          <span className="label-text font-semibold">件名</span>
                        </label>
                        <input
                          id="edit-notification-subject"
                          type="text"
                          className="input input-bordered"
                          value={editForm.subject}
                          onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                        />
                      </div>

                      <div className="form-control mb-4">
                        <label className="label" htmlFor="edit-notification-body">
                          <span className="label-text font-semibold">本文</span>
                        </label>
                        <textarea
                          id="edit-notification-body"
                          className="textarea textarea-bordered h-40"
                          value={editForm.body}
                          onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                        />
                      </div>

                      <div className="divider">配信スケジュール</div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="form-control">
                          <label className="label" htmlFor="edit-notification-publishDate">
                            <span className="label-text font-semibold">
                              公開日 <span className="text-error">*</span>
                            </span>
                          </label>
                          <DatePicker
                            value={editForm.publishDate}
                            onChange={(date) => setEditForm({ ...editForm, publishDate: date })}
                            disabled={isPending}
                            placeholder="公開日を選択"
                          />
                        </div>

                        <div className="form-control">
                          <label className="label" htmlFor="edit-notification-publishTime">
                            <span className="label-text font-semibold">
                              公開時間 <span className="text-error">*</span>
                            </span>
                          </label>
                          <input
                            id="edit-notification-publishTime"
                            type="time"
                            className="input input-bordered w-full"
                            value={editForm.publishTime}
                            onChange={(e) => setEditForm({ ...editForm, publishTime: e.target.value })}
                            disabled={isPending}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="form-control">
                          <label className="label" htmlFor="edit-notification-endDate">
                            <span className="label-text font-semibold">終了日（任意）</span>
                          </label>
                          <DatePicker
                            value={editForm.endDate}
                            onChange={(date) => setEditForm({ ...editForm, endDate: date })}
                            disabled={isPending}
                            placeholder="終了日を選択"
                          />
                        </div>

                        <div className="form-control">
                          <label className="label" htmlFor="edit-notification-endTime">
                            <span className="label-text font-semibold">終了時間</span>
                          </label>
                          <input
                            id="edit-notification-endTime"
                            type="time"
                            className="input input-bordered w-full"
                            value={editForm.endTime}
                            onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                            disabled={isPending}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold mb-4">{data.subject}</h2>

                      <div className="bg-base-100 p-4 rounded-lg mb-6">
                        <pre className="whitespace-pre-wrap font-sans">{data.body}</pre>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm font-semibold text-base-content/70 mb-1">公開日時</div>
                          <div className="text-lg">{data.publishAt ? formatDate(data.publishAt) : '-'}</div>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-base-content/70 mb-1">終了日時</div>
                          <div className="text-lg">{data.endAt ? formatDate(data.endAt) : '-'}</div>
                        </div>

                        {data.isProcessed && (
                          <div>
                            <div className="text-sm font-semibold text-base-content/70 mb-1">配信日時</div>
                            <div className="text-lg">{data.processedAt ? formatDate(data.processedAt) : '-'}</div>
                          </div>
                        )}

                        {data.isDeleted && (
                          <div>
                            <div className="text-sm font-semibold text-base-content/70 mb-1">削除日時</div>
                            <div className="text-lg">{data.deletedAt ? formatDate(data.deletedAt) : '-'}</div>
                          </div>
                        )}

                        <div>
                          <div className="text-sm font-semibold text-base-content/70 mb-1">作成者</div>
                          <div className="text-lg">{data.createdByUserName || '-'}</div>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-base-content/70 mb-1">作成日時</div>
                          <div className="text-lg">{data.createdAt ? formatDate(data.createdAt) : '-'}</div>
                        </div>

                        {data.updatedByUserName && (
                          <>
                            <div>
                              <div className="text-sm font-semibold text-base-content/70 mb-1">更新者</div>
                              <div className="text-lg">{data.updatedByUserName}</div>
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-base-content/70 mb-1">更新日時</div>
                              <div className="text-lg">{data.updatedAt ? formatDate(data.updatedAt) : '-'}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <DeleteNotificationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        notification={
          data
            ? {
                id: data.id,
                subject: data.subject ?? '',
                isProcessed: data.isProcessed ?? false,
                messageIds: data.messageIds,
              }
            : null
        }
      />
    </div>
  );
}
