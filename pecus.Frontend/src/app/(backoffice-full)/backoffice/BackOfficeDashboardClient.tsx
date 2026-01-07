'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import type { HangfireStatsResponse } from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { type ApiErrorResponse, isAuthenticationError } from '@/types/errors';

interface BackOfficeDashboardClientProps {
  fetchError?: string | null;
  hangfireStats?: HangfireStatsResponse | null;
}

export default function BackOfficeDashboardClient({ fetchError, hangfireStats }: BackOfficeDashboardClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [clientError, _setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);

  const { showLoading } = useDelayedLoading();

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

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
            <h1 className="text-3xl font-bold mb-6">BackOffice ダッシュボード</h1>

            {clientError ? (
              <div className="alert alert-soft alert-error mb-4">
                <div>
                  <span>データの取得に失敗しました: </span>
                  <span className="font-mono">{clientError.message || `エラーコード: ${clientError.code}`}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <a href="/backoffice/organizations" className="card bg-base-200 hover:bg-base-300 transition-colors">
                  <div className="card-body">
                    <div className="flex items-center gap-4">
                      <span className="icon-[mdi--office-building-outline] size-12 text-primary" aria-hidden="true" />
                      <div>
                        <h2 className="card-title">組織管理</h2>
                        <p className="text-base-content/70">組織の一覧・詳細・更新・削除</p>
                      </div>
                    </div>
                  </div>
                </a>

                <a href="/backoffice/notifications" className="card bg-base-200 hover:bg-base-300 transition-colors">
                  <div className="card-body">
                    <div className="flex items-center gap-4">
                      <span className="icon-[mdi--bell-outline] size-12 text-primary" aria-hidden="true" />
                      <div>
                        <h2 className="card-title">システム通知</h2>
                        <p className="text-base-content/70">全組織への通知管理</p>
                      </div>
                    </div>
                  </div>
                </a>

                <a
                  href="/backoffice/monitoring"
                  className="card bg-base-200 hover:bg-base-300 transition-colors relative"
                >
                  <div className="card-body">
                    <div className="flex items-center gap-4">
                      <span className="icon-[mdi--chart-line] size-12 text-primary" aria-hidden="true" />
                      <div>
                        <h2 className="card-title">システム状況</h2>
                        <p className="text-base-content/70">サービスの稼働状況を監視</p>
                      </div>
                    </div>
                    {hangfireStats && (hangfireStats.failed ?? 0) > 0 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 badge badge-error badge-sm">
                        <span className="icon-[mdi--alert-circle] size-3" aria-hidden="true" />
                        <span>Failed: {hangfireStats.failed}</span>
                      </div>
                    )}
                  </div>
                </a>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
