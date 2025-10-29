"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";

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

interface UserInfo {
  id: number;
  name?: string | null;
  email?: string | null;
  roles?: any[];
  isAdmin: boolean;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(initialUser);
  const [organization, setOrganization] = useState<OrganizationData | null>(initialOrganization);
  const [loading, setLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(fetchError ?? null);

  // 必要ならクライアント側で追加データ取得する（ただし pecus.WebApi へ直接は行わない）
  useEffect(() => {
    // 認証エラーが発生していたらログインページにリダイレクト
    if (clientError && clientError.includes('認証が切れました')) {
      console.log('AdminClient: Authentication error detected, redirecting to login');
      window.location.href = '/signin';
      return;
    }

    // ユーザー情報がサーバー側で取得できなかった場合のフォールバック
    if (!userInfo) {
      const fetchUserInfo = async () => {
        try {
          const response = await fetch("/api/user");
          if (response.ok) {
            const data = await response.json();
            setUserInfo(data.user);
          } else if (response.status === 401) {
            // ユーザー情報取得でも401エラーが発生したらログインページにリダイレクト
            console.log('AdminClient: User info fetch failed with 401, redirecting to login');
            window.location.href = '/signin';
          }
        } catch (error) {
          console.error("Failed to fetch user info:", error);
        }
      };

      fetchUserInfo();
    }
  }, [userInfo, clientError]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 全体ローディングオーバーレイ（クライアント側でページブロックする場合） */}
      {loading && (
        <div className="fixed inset-0 bg-base-100 bg-opacity-80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-lg">読み込み中...</p>
          </div>
        </div>
      )}

      <AdminHeader
        userInfo={userInfo}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading}
      />

      <div className="flex flex-1">
        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 p-6 bg-base-100">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">組織</h1>

            {clientError ? (
              <div className="alert alert-error mb-4">
                <div>
                  <span>組織情報の取得に失敗しました: </span>
                  <span className="font-mono">{clientError}</span>
                </div>
              </div>
            ) : (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-4">組織情報</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label htmlFor="org-name" className="label">
                        <span className="label-text font-semibold">組織名</span>
                      </label>
                      <div id="org-name" className="text-lg">
                        {organization?.name ?? "未設定"}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-id" className="label">
                        <span className="label-text font-semibold">組織ID</span>
                      </label>
                      <div id="org-id" className="text-lg">
                        {organization?.id ?? "未設定"}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-code" className="label">
                        <span className="label-text font-semibold">組織コード</span>
                      </label>
                      <div id="org-code" className="text-lg">
                        {organization?.code ?? "未設定"}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-status" className="label">
                        <span className="label-text font-semibold">ステータス</span>
                      </label>
                      <div id="org-status" className={`badge badge-lg ${organization?.isActive ? 'badge-success' : 'badge-error'}`}>
                        {organization?.isActive ? 'アクティブ' : '非アクティブ'}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-created" className="label">
                        <span className="label-text font-semibold">作成日</span>
                      </label>
                      <div id="org-created" className="text-lg">
                        {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString('ja-JP') : '未設定'}
                      </div>
                    </div>

                    <div className="form-control">
                      <label htmlFor="org-users" className="label">
                        <span className="label-text font-semibold">所属ユーザー数</span>
                      </label>
                      <div id="org-users" className="text-lg">
                        {organization?.userCount ?? 0} 人
                      </div>
                    </div>
                  </div>

                  <div className="divider"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="form-control md:col-span-2">
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
                    <button className="btn btn-primary" type="button">編集</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <AdminFooter />
    </div>
  );
}