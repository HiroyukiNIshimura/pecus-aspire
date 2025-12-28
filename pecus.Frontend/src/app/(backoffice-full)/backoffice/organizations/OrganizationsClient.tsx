'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import Pagination from '@/components/common/filters/Pagination';
import type { PagedResponseOfBackOfficeOrganizationListItemResponse } from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { formatDate } from '@/libs/utils/date';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { type ApiErrorResponse, isAuthenticationError } from '@/types/errors';

interface OrganizationsClientProps {
  initialData: PagedResponseOfBackOfficeOrganizationListItemResponse | null;
  fetchError?: string | null;
}

export default function OrganizationsClient({ initialData, fetchError }: OrganizationsClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [data, _setData] = useState(initialData);
  const [clientError, _setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);

  const { showLoading } = useDelayedLoading();

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  const handlePageChange = ({ selected }: { selected: number }) => {
    router.push(`/backoffice/organizations?page=${selected + 1}`);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay isLoading={showLoading} message="読み込み中..." />

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
              <h1 className="text-3xl font-bold">組織管理</h1>
              <span className="text-base-content/70">
                {data?.totalCount !== undefined && `全 ${data.totalCount} 件`}
              </span>
            </div>

            {clientError ? (
              <div className="alert alert-soft alert-error mb-4">
                <div>
                  <span>組織一覧の取得に失敗しました: </span>
                  <span className="font-mono">{clientError.message || `エラーコード: ${clientError.code}`}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>組織名</th>
                        <th>コード</th>
                        <th>ユーザー数</th>
                        <th>状態</th>
                        <th>デモ</th>
                        <th>作成日</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.data?.map((org) => (
                        <tr key={org.id}>
                          <td>{org.id}</td>
                          <td className="font-medium">{org.name}</td>
                          <td className="font-mono text-sm">{org.code}</td>
                          <td>{org.userCount}</td>
                          <td>
                            {org.isActive ? (
                              <span className="badge badge-success">有効</span>
                            ) : (
                              <span className="badge badge-error">無効</span>
                            )}
                          </td>
                          <td>
                            {org.isDemo ? (
                              <span className="badge badge-warning">デモ</span>
                            ) : (
                              <span className="badge badge-ghost">-</span>
                            )}
                          </td>
                          <td className="text-sm text-base-content/70">
                            {org.createdAt ? formatDate(org.createdAt) : '-'}
                          </td>
                          <td>
                            <a href={`/backoffice/organizations/${org.id}`} className="btn btn-ghost btn-sm">
                              <span className="icon-[mdi--eye-outline] size-5" aria-hidden="true" />
                              <span className="sr-only">詳細を見る</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                      {(!data?.data || data.data.length === 0) && (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-base-content/70">
                            組織が見つかりません
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
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
