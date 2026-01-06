'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  deleteBackOfficeOrganization,
  resendOrganizationCreatedEmail,
  updateBackOfficeOrganization,
} from '@/actions/backoffice/organizations';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import BotListSection from '@/components/backoffice/BotListSection';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import DeleteOrganizationModal from '@/components/common/overlays/DeleteOrganizationModal';
import type { BackOfficeOrganizationDetailResponse } from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { useNotify } from '@/hooks/useNotify';
import { formatDate } from '@/libs/utils/date';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { type ApiErrorResponse, isAuthenticationError } from '@/types/errors';

interface OrganizationDetailClientProps {
  initialData: BackOfficeOrganizationDetailResponse | null;
  fetchError?: string | null;
}

export default function OrganizationDetailClient({ initialData, fetchError }: OrganizationDetailClientProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUser = useCurrentUser();
  const [data, setData] = useState(initialData);
  const [clientError, setClientError] = useState<ApiErrorResponse | null>(fetchError ? JSON.parse(fetchError) : null);

  const { showLoading } = useDelayedLoading();
  const [isPending, startTransition] = useTransition();
  const notify = useNotify();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    representativeName: data?.representativeName ?? '',
    phoneNumber: data?.phoneNumber ?? '',
    email: data?.email ?? '',
    isActive: data?.isActive ?? true,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  // 編集開始時にフォームをリセット
  const startEditing = () => {
    if (data) {
      setEditForm({
        representativeName: data.representativeName ?? '',
        phoneNumber: data.phoneNumber ?? '',
        email: data.email ?? '',
        isActive: data.isActive ?? true,
      });
    }
    setIsEditing(true);
    setClientError(null);
  };

  const handleSave = () => {
    if (!data) return;

    startTransition(async () => {
      const result = await updateBackOfficeOrganization(data.id, {
        representativeName: editForm.representativeName || undefined,
        phoneNumber: editForm.phoneNumber || undefined,
        email: editForm.email || undefined,
        isActive: editForm.isActive,
        rowVersion: data.rowVersion,
      });

      if (result.success) {
        setData(result.data);
        setIsEditing(false);
        setClientError(null);
        notify.success('組織情報を更新しました');
      } else {
        setClientError({ message: result.message, code: result.error });
        notify.error(result.message || '更新に失敗しました');
      }
    });
  };

  const handleDelete = async () => {
    if (!data || !data.code) return;

    const result = await deleteBackOfficeOrganization(data.id, data.code, data.rowVersion);

    if (result.success) {
      notify.success('組織を削除しました');
      router.push('/backoffice/organizations');
    } else {
      setClientError({ message: result.message, code: result.error });
      notify.error(result.message || '削除に失敗しました');
    }
  };

  const handleResendCreatedEmail = async () => {
    if (!data) return;

    try {
      const result = await resendOrganizationCreatedEmail(data.id);
      if (result.success) {
        notify.success('組織登録完了メールを再送しました。');
      } else {
        notify.error(result.message || '組織登録完了メールの再送に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('組織登録完了メール再送中にエラーが発生:', err);
      notify.error('組織登録完了メール再送中にエラーが発生しました。');
    }
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
            <h1 className="text-3xl font-bold mb-6">組織詳細</h1>

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
                    <h2 className="card-title text-2xl">{data.name}</h2>
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <>
                          <a href="/backoffice/organizations" className="btn btn-ghost btn-sm">
                            <span className="icon-[mdi--arrow-left] size-5" aria-hidden="true" />
                            戻る
                          </a>
                          <button type="button" className="btn btn-primary btn-sm" onClick={startEditing}>
                            <span className="icon-[mdi--pencil] size-4" aria-hidden="true" />
                            編集
                          </button>
                          <button
                            type="button"
                            className="btn btn-error btn-sm"
                            onClick={() => setShowDeleteModal(true)}
                          >
                            <span className="icon-[mdi--delete] size-4" aria-hidden="true" />
                            削除
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setIsEditing(false)}
                            disabled={isPending}
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleSave}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <>
                                <span className="loading loading-spinner loading-sm" />
                                保存中...
                              </>
                            ) : (
                              '保存する'
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">組織ID</div>
                      <div className="text-lg">{data.id}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">組織コード</div>
                      <div className="text-lg font-mono">{data.code}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">代表者名</div>
                      {isEditing ? (
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          value={editForm.representativeName}
                          onChange={(e) => setEditForm({ ...editForm, representativeName: e.target.value })}
                          placeholder="代表者名を入力"
                          maxLength={100}
                          disabled={isPending}
                        />
                      ) : (
                        <div className="text-lg">{data.representativeName || '未設定'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">メールアドレス</div>
                      {isEditing ? (
                        <input
                          type="email"
                          className="input input-bordered w-full"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="example@email.com"
                          maxLength={254}
                          disabled={isPending}
                        />
                      ) : (
                        <div className="text-lg">{data.email || '未設定'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">電話番号</div>
                      {isEditing ? (
                        <input
                          type="tel"
                          className="input input-bordered w-full"
                          value={editForm.phoneNumber}
                          onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                          placeholder="000-0000-0000"
                          maxLength={20}
                          disabled={isPending}
                        />
                      ) : (
                        <div className="text-lg">{data.phoneNumber || '未設定'}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">デモ組織</div>
                      <div className="text-lg">
                        {data.isDemo ? (
                          <span className="badge badge-warning">デモ</span>
                        ) : (
                          <span className="badge badge-ghost">通常</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">ユーザー数</div>
                      <div className="text-lg">{data.userCount}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">ワークスペース数</div>
                      <div className="text-lg">{data.workspaceCount}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">作成日</div>
                      <div className="text-lg">{data.createdAt ? formatDate(data.createdAt) : '-'}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">更新日</div>
                      <div className="text-lg">{data.updatedAt ? formatDate(data.updatedAt) : '-'}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">状態</div>
                      {isEditing ? (
                        <label className="label cursor-pointer justify-start gap-2">
                          <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                            disabled={isPending}
                          />
                          <span>{editForm.isActive ? '有効' : '無効'}</span>
                        </label>
                      ) : (
                        <div>
                          {data.isActive ? (
                            <span className="badge badge-success">有効</span>
                          ) : (
                            <span className="badge badge-error">無効</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-sm font-semibold text-base-content/70 mb-1">説明</div>
                    <div className="text-base whitespace-pre-wrap">{data.description || '未設定'}</div>
                  </div>

                  {/* その他の操作 */}
                  <div className="divider" />
                  <div>
                    <h3 className="text-sm font-semibold text-base-content/70 mb-3">その他の操作</h3>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleResendCreatedEmail}
                      disabled={isPending}
                    >
                      <span className="icon-[tabler--mail-forward] w-4 h-4" />
                      組織登録完了メール再送
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ボット一覧セクション */}
            {data && <BotListSection organizationId={data.id} />}
          </div>
        </main>
      </div>

      <DeleteOrganizationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        organization={
          data?.code
            ? {
                id: data.id,
                name: data.name,
                code: data.code,
                isActive: data.isActive ?? true,
              }
            : null
        }
      />
    </div>
  );
}
