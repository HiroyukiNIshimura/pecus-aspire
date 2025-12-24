'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { formatDate } from '@/libs/utils/date';
import { type ApiErrorResponse, isAuthenticationError } from '@/types/errors';
import type { UserInfo } from '@/types/userInfo';

interface OrganizationData {
  id?: number | string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  representativeName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  isActive?: boolean;
  userCount?: number | null;
}

export default function AdminClient({
  initialOrganization,
  initialUser,
  fetchError,
}: {
  initialOrganization: OrganizationData | null;
  initialUser: UserInfo | null;
  fetchError?: string | null;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, _setUserInfo] = useState<UserInfo | null>(initialUser);
  const [organization, _setOrganization] = useState<OrganizationData | null>(initialOrganization);
  const [clientError, _setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);

  const { showLoading } = useDelayedLoading();

  // 認証エラーが検出されたらログインページにリダイレクト
  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay isLoading={showLoading} message="読み込み中..." />

      <AdminHeader userInfo={userInfo} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} loading={showLoading} />

      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar sidebarOpen={sidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-6 bg-base-100 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">組織</h1>

            {clientError ? (
              <div className="alert alert-soft alert-error mb-4">
                <div>
                  <span>組織情報の取得に失敗しました: </span>
                  <span className="font-mono">{clientError.message || `エラーコード: ${clientError.code}`}</span>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-4">組織情報</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="form-control">
                      <label htmlFor="org-name" className="label">
                        <span className="label-text font-semibold">組織名</span>
                      </label>
                      <div id="org-name" className="text-lg">
                        {organization?.name ?? '未設定'}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-code" className="label">
                        <span className="label-text font-semibold">組織コード</span>
                      </label>
                      <div id="org-code" className="text-lg">
                        {organization?.code ?? '未設定'}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-created" className="label">
                        <span className="label-text font-semibold">作成日</span>
                      </label>
                      <div id="org-created" className="text-lg">
                        {formatDate(organization?.createdAt) !== '-' ? formatDate(organization?.createdAt) : '未設定'}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-users" className="label">
                        <span className="label-text font-semibold">所属ユーザー数 (非アクティブを含む)</span>
                      </label>
                      <div id="org-users" className="text-lg">
                        {organization?.userCount ?? 0} 人
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="form-control">
                      <label htmlFor="org-representative" className="label">
                        <span className="label-text font-semibold">代表者名</span>
                      </label>
                      <div id="org-representative" className="text-lg">
                        {organization?.representativeName ?? '未設定'}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-phone" className="label">
                        <span className="label-text font-semibold">電話番号</span>
                      </label>
                      <div id="org-phone" className="text-lg">
                        {organization?.phoneNumber ?? '未設定'}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-email" className="label">
                        <span className="label-text font-semibold">メールアドレス</span>
                      </label>
                      <div id="org-email" className="text-lg">
                        {organization?.email ?? '未設定'}
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="form-control">
                    <label htmlFor="org-description" className="label">
                      <span className="label-text font-semibold">説明</span>
                    </label>
                    <div id="org-description" className="text-base">
                      {organization?.description ?? '説明が設定されていません。'}
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-6">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => router.push('/admin/organizations/edit/1')}
                    >
                      編集
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
