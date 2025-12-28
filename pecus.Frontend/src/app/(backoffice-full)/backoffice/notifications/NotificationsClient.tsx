'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createBackOfficeNotification } from '@/actions/backoffice/notifications';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import CreateNotificationModal from '@/components/backoffice/CreateNotificationModal';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import Pagination from '@/components/common/filters/Pagination';
import type {
  BackOfficeNotificationListItemResponse,
  PagedResponseOfBackOfficeNotificationListItemResponse,
  SystemNotificationType,
} from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useNotify } from '@/hooks/useNotify';
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
  const [clientError, setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);

  const { showLoading } = useDelayedLoading();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const notify = useNotify();

  // initialData を直接使用（router.refresh() で更新される）
  const data = initialData;

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  const handlePageChange = ({ selected }: { selected: number }) => {
    router.push(`/backoffice/notifications?page=${selected + 1}`);
  };

  const handleCreate = async (formData: {
    subject: string;
    body: string;
    type: SystemNotificationType;
    publishAt: string;
    endAt?: string;
  }) => {
    const result = await createBackOfficeNotification({
      subject: formData.subject,
      body: formData.body,
      type: formData.type,
      publishAt: formData.publishAt,
      endAt: formData.endAt,
    });

    if (result.success) {
      notify.success('システム通知を作成しました');
      setShowCreateModal(false);
      router.refresh();
      return { success: true };
    }
    notify.error(result.message || 'システム通知の作成に失敗しました');
    return { success: false, message: result.message };
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
      <LoadingOverlay isLoading={showLoading} message="処理中..." />

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
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
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
                        <a href={`/backoffice/notifications/${item.id}`} className="btn btn-ghost btn-sm btn-square">
                          <span className="icon-[mdi--dots-vertical] size-5" aria-hidden="true" />
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

      <CreateNotificationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreate}
      />
    </div>
  );
}
