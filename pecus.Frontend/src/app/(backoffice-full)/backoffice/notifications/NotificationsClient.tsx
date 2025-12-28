'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createBackOfficeNotification } from '@/actions/backoffice/notifications';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import Pagination from '@/components/common/filters/Pagination';
import type {
  BackOfficeNotificationListItemResponse,
  PagedResponseOfBackOfficeNotificationListItemResponse,
  SystemNotificationType,
} from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { formatDate } from '@/libs/utils/date';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { type ApiErrorResponse, isAuthenticationError } from '@/types/errors';

interface NotificationsClientProps {
  initialData: PagedResponseOfBackOfficeNotificationListItemResponse | null;
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

export default function NotificationsClient({ initialData, fetchError }: NotificationsClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [data] = useState(initialData);
  const [clientError, setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);

  const { showLoading } = useDelayedLoading();
  const [isPending, startTransition] = useTransition();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    subject: '',
    body: '',
    type: 'Info' as SystemNotificationType,
    publishAt: '',
    endAt: '',
  });

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  const handlePageChange = ({ selected }: { selected: number }) => {
    router.push(`/backoffice/notifications?page=${selected + 1}`);
  };

  const handleCreate = () => {
    if (!createForm.subject || !createForm.body || !createForm.publishAt) return;

    startTransition(async () => {
      const result = await createBackOfficeNotification({
        subject: createForm.subject,
        body: createForm.body,
        type: createForm.type,
        publishAt: createForm.publishAt,
        endAt: createForm.endAt || undefined,
      });

      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({ subject: '', body: '', type: 'Info', publishAt: '', endAt: '' });
        router.refresh();
      } else {
        setClientError({ message: result.message, code: result.error });
      }
    });
  };

  const getStatusBadge = (item: BackOfficeNotificationListItemResponse) => {
    if (item.isDeleted) {
      return <span className="badge badge-error badge-outline">削除済み</span>;
    }
    if (item.isProcessed) {
      return <span className="badge badge-success">配信済み</span>;
    }
    if (!item.publishAt) {
      return <span className="badge badge-ghost">未設定</span>;
    }
    const now = new Date();
    const publishAt = new Date(item.publishAt);
    if (publishAt > now) {
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
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">システム通知</h1>
              <div className="flex items-center gap-4">
                <span className="text-base-content/70">
                  {data?.totalCount !== undefined && `全 ${data.totalCount} 件`}
                </span>
                <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  <span className="icon-[mdi--plus] size-5" aria-hidden="true" />
                  新規作成
                </button>
              </div>
            </div>

            {clientError && (
              <div className="alert alert-soft alert-error mb-4">
                <span className="icon-[mdi--alert-circle] size-5" aria-hidden="true" />
                <span>{clientError.message || `エラーコード: ${clientError.code}`}</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setClientError(null)}>
                  <span className="icon-[mdi--close] size-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>種類</th>
                    <th>件名</th>
                    <th>公開日時</th>
                    <th>終了日時</th>
                    <th>状態</th>
                    <th>作成者</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((item) => (
                    <tr key={item.id} className={item.isDeleted ? 'opacity-50' : ''}>
                      <td>{item.id}</td>
                      <td>
                        <span className={`badge ${notificationTypeBadgeClass[item.type || 'Info'] || 'badge-ghost'}`}>
                          {notificationTypeLabels[item.type || 'Info'] || item.type}
                        </span>
                      </td>
                      <td className="font-medium max-w-xs truncate">{item.subject}</td>
                      <td className="text-sm">{item.publishAt ? formatDate(item.publishAt) : '-'}</td>
                      <td className="text-sm">{item.endAt ? formatDate(item.endAt) : '-'}</td>
                      <td>{getStatusBadge(item)}</td>
                      <td className="text-sm text-base-content/70">{item.createdByUserName || '-'}</td>
                      <td>
                        <a href={`/backoffice/notifications/${item.id}`} className="btn btn-ghost btn-sm">
                          <span className="icon-[mdi--eye-outline] size-5" aria-hidden="true" />
                          <span className="sr-only">詳細を見る</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                  {(!data?.data || data.data.length === 0) && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-base-content/70">
                        通知が見つかりません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data && (data.totalPages ?? 0) > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={data.currentPage ?? 1}
                  totalPages={data.totalPages ?? 1}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">システム通知を作成</h3>

            <div className="form-control mb-4">
              <label className="label" htmlFor="create-notification-type">
                <span className="label-text">種類</span>
              </label>
              <select
                id="create-notification-type"
                className="select select-bordered"
                value={createForm.type || 'Info'}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    type: e.target.value as SystemNotificationType,
                  })
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
              <label className="label" htmlFor="create-notification-subject">
                <span className="label-text">件名 *</span>
              </label>
              <input
                id="create-notification-subject"
                type="text"
                className="input input-bordered"
                value={createForm.subject}
                onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                placeholder="通知の件名を入力"
              />
            </div>

            <div className="form-control mb-4">
              <label className="label" htmlFor="create-notification-body">
                <span className="label-text">本文 *（Markdown形式）</span>
              </label>
              <textarea
                id="create-notification-body"
                className="textarea textarea-bordered h-40"
                value={createForm.body}
                onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                placeholder="通知の本文を入力..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label" htmlFor="create-notification-publishAt">
                  <span className="label-text">公開日時 *</span>
                </label>
                <input
                  id="create-notification-publishAt"
                  type="datetime-local"
                  className="input input-bordered"
                  value={createForm.publishAt}
                  onChange={(e) => setCreateForm({ ...createForm, publishAt: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="create-notification-endAt">
                  <span className="label-text">終了日時（任意）</span>
                </label>
                <input
                  id="create-notification-endAt"
                  type="datetime-local"
                  className="input input-bordered"
                  value={createForm.endAt}
                  onChange={(e) => setCreateForm({ ...createForm, endAt: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ subject: '', body: '', type: 'Info', publishAt: '', endAt: '' });
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!createForm.subject || !createForm.body || !createForm.publishAt || isPending}
                onClick={handleCreate}
              >
                作成
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}></div>
        </div>
      )}
    </div>
  );
}
