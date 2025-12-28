'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { deleteBackOfficeOrganization, updateBackOfficeOrganization } from '@/actions/backoffice/organizations';
import BackOfficeHeader from '@/components/backoffice/BackOfficeHeader';
import BackOfficeSidebar from '@/components/backoffice/BackOfficeSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import type { BackOfficeOrganizationDetailResponse } from '@/connectors/api/pecus';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    isActive: data?.isActive ?? true,
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  useEffect(() => {
    if (clientError && isAuthenticationError(clientError)) {
      router.push('/signin');
    }
  }, [clientError, router]);

  const handleSave = () => {
    if (!data) return;

    startTransition(async () => {
      const result = await updateBackOfficeOrganization(data.id, {
        isActive: editForm.isActive,
        rowVersion: data.rowVersion,
      });

      if (result.success) {
        setData(result.data);
        setIsEditing(false);
        setSuccessMessage('更新しました');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setClientError({ message: result.message, code: result.error });
      }
    });
  };

  const handleDelete = () => {
    if (!data || deleteConfirmName !== data.name) return;

    startTransition(async () => {
      const result = await deleteBackOfficeOrganization(data.id, deleteConfirmName, data.rowVersion);

      if (result.success) {
        router.push('/backoffice/organizations');
      } else {
        setClientError({ message: result.message, code: result.error });
        setShowDeleteModal(false);
      }
    });
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
            <div className="flex items-center gap-4 mb-6">
              <a href="/backoffice/organizations" className="btn btn-ghost btn-sm">
                <span className="icon-[mdi--arrow-left] size-5" aria-hidden="true" />
                戻る
              </a>
              <h1 className="text-3xl font-bold">組織詳細</h1>
            </div>

            {successMessage && (
              <div className="alert alert-soft alert-success mb-4">
                <span className="icon-[mdi--check-circle] size-5" aria-hidden="true" />
                <span>{successMessage}</span>
              </div>
            )}

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
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => setIsEditing(true)}>
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
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
                            キャンセル
                          </button>
                          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
                            保存
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
                      <div className="text-lg">{data.representativeName || '未設定'}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">メールアドレス</div>
                      <div className="text-lg">{data.email || '未設定'}</div>
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-base-content/70 mb-1">電話番号</div>
                      <div className="text-lg">{data.phoneNumber || '未設定'}</div>
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
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showDeleteModal && data && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">組織を削除</h3>
            <p className="py-4">
              この操作は取り消せません。組織「<strong>{data.name}</strong>
              」とすべての関連データ（ユーザー、ワークスペース、タスクなど）が完全に削除されます。
            </p>
            <div className="form-control">
              <label className="label" htmlFor="delete-confirm-org-name">
                <span className="label-text">確認のため、組織名を入力してください</span>
              </label>
              <input
                id="delete-confirm-org-name"
                type="text"
                className="input input-bordered"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={data.name}
              />
            </div>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmName('');
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-error"
                disabled={deleteConfirmName !== data.name || isPending}
                onClick={handleDelete}
              >
                削除する
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}></div>
        </div>
      )}
    </div>
  );
}
