'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from '@/actions/admin/workspace';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import UserAvatar from '@/components/common/widgets/user/UserAvatar';
import AddMemberModal from '@/components/workspaces/AddMemberModal';
import ChangeRoleModal from '@/components/workspaces/ChangeRoleModal';
import GenreSelect from '@/components/workspaces/GenreSelect';
import RemoveMemberModal from '@/components/workspaces/RemoveMemberModal';
import WorkspaceMemberList from '@/components/workspaces/WorkspaceMemberList';
import type {
  MasterGenreResponse,
  WorkspaceDetailResponse,
  WorkspaceMemberAssignmentsResponse,
  WorkspaceRole,
  WorkspaceUserDetailResponse,
} from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { formatDateTime } from '@/libs/utils/date';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import { editWorkspaceSchema } from '@/schemas/editSchemas';

interface EditWorkspaceClientProps {
  workspaceDetail: WorkspaceDetailResponse;
  genres: MasterGenreResponse[];
  fetchError: string | null;
}

export default function EditWorkspaceClient({ workspaceDetail, genres, fetchError }: EditWorkspaceClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const currentUser = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // メンバー管理の状態
  const [members, setMembers] = useState<WorkspaceUserDetailResponse[]>(workspaceDetail.members || []);

  // 新規追加されたメンバーのハイライト表示用（3秒間）
  const [highlightedUserIds, setHighlightedUserIds] = useState<Set<number>>(new Set());

  // メンバー追加モーダルの状態
  const [addMemberModal, setAddMemberModal] = useState(false);

  // 削除モーダルの状態
  const [removeMemberModal, setRemoveMemberModal] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    email: string;
  }>({ isOpen: false, userId: 0, userName: '', email: '' });

  // ロール変更モーダルの状態
  const [changeRoleModal, setChangeRoleModal] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    currentRole: NonNullable<WorkspaceRole>;
    newRole: NonNullable<WorkspaceRole>;
  }>({ isOpen: false, userId: 0, userName: '', currentRole: 'Member', newRole: 'Member' });

  // ロール変更時のアサインメントエラー情報
  const [assignmentsError, setAssignmentsError] = useState<WorkspaceMemberAssignmentsResponse | null>(null);

  // フォーム状態（スキーマの型に合わせる）
  const [formData, setFormData] = useState({
    name: workspaceDetail.name || '',
    description: workspaceDetail.description || '',
    genreId: workspaceDetail.genreId ? String(workspaceDetail.genreId) : '',
    isActive: workspaceDetail.isActive ?? true,
  });

  // Zod一本化フック
  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: editWorkspaceSchema,
    onSubmit: async (data) => {
      try {
        // rowVersion が存在しない場合はエラー
        if (!workspaceDetail.rowVersion) {
          notify.error('ワークスペース情報の更新に必要なバージョン情報が取得できませんでした。');
          return;
        }

        const result = await updateWorkspace(workspaceDetail.id!, {
          name: data.name,
          description: data.description || undefined,
          genreId: typeof data.genreId === 'string' ? parseInt(data.genreId, 10) : data.genreId,
          rowVersion: workspaceDetail.rowVersion,
        });

        if (result.success) {
          notify.success('ワークスペースを更新しました。');
          router.push('/admin/workspaces');
        } else {
          console.error('ワークスペースの更新に失敗しました:', result.error);
          notify.error(
            result.error
              ? `ワークスペースの更新中にエラーが発生しました。(${result.error})`
              : 'ワークスペースの更新中にエラーが発生しました。',
          );
        }
      } catch (err: unknown) {
        console.error('ワークスペースの更新中にエラーが発生しました:', err);
        notify.error('ワークスペースの更新中にエラーが発生しました。');
      }
    },
  });

  // 入力時の検証とフォーム状態更新
  const handleFieldChange = async (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // フィールド検証を実行
    await validateField(fieldName, value);
  };

  const handleCancel = () => {
    router.push('/admin/workspaces');
  };

  // ===== メンバー管理のコールバック =====

  /** メンバー追加モーダルを開く */
  const handleAddMember = () => {
    setAddMemberModal(true);
  };

  /** メンバー追加モーダルを閉じる */
  const handleAddMemberModalClose = () => {
    setAddMemberModal(false);
  };

  /** メンバー追加を実行 */
  const handleAddMemberConfirm = async (
    userId: number,
    userName: string,
    email: string,
    role: NonNullable<WorkspaceRole>,
    identityIconUrl: string | null,
  ) => {
    const result = await addWorkspaceMember(workspaceDetail.id!, userId, role);

    if (result.success) {
      // メンバー一覧に追加
      const newMember: WorkspaceUserDetailResponse = {
        workspaceId: workspaceDetail.id!,
        id: userId,
        username: userName,
        email,
        workspaceRole: role,
        isActive: true,
        identityIconUrl: identityIconUrl ?? '',
      };
      setMembers((prev) => [...prev, newMember]);

      // 新規メンバーを3秒間ハイライト表示
      setHighlightedUserIds((prev) => new Set([...prev, userId]));
      setTimeout(() => {
        setHighlightedUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }, 3000);

      notify.success(`${userName} をワークスペースに追加しました。`);
      handleAddMemberModalClose();
    } else {
      notify.error(result.message || 'メンバーの追加に失敗しました。');
    }
  };

  /** メンバー削除モーダルを開く */
  const handleRemoveMember = (userId: number, userName: string) => {
    // membersからユーザー情報を取得してemailを設定
    const member = members.find((m) => m.id === userId);
    const email = member?.email || '';
    setRemoveMemberModal({ isOpen: true, userId, userName, email });
  };

  /** メンバー削除モーダルを閉じる */
  const handleRemoveMemberModalClose = () => {
    setRemoveMemberModal({ isOpen: false, userId: 0, userName: '', email: '' });
  };

  /** メンバー削除を実行 */
  const handleRemoveMemberConfirm = async () => {
    const { userId, userName } = removeMemberModal;
    const result = await removeWorkspaceMember(workspaceDetail.id!, userId);

    if (result.success) {
      // メンバー一覧から削除
      setMembers((prev) => prev.filter((m) => m.id !== userId));
      notify.success(`${userName} をワークスペースから削除しました。`);
    } else {
      notify.error(result.message || 'メンバーの削除に失敗しました。');
    }

    handleRemoveMemberModalClose();
  };

  /** ロール変更モーダルを開く */
  const handleChangeRole = (userId: number, userName: string, newRole: NonNullable<WorkspaceRole>) => {
    // 現在のロールを取得
    const member = members.find((m) => m.id === userId);
    const currentRole: NonNullable<WorkspaceRole> = member?.workspaceRole ?? 'Member';

    // 同じロールの場合は何もしない
    if (currentRole === newRole) {
      return;
    }

    setChangeRoleModal({
      isOpen: true,
      userId,
      userName,
      currentRole,
      newRole,
    });
  };

  /** ロール変更モーダルを閉じる */
  const handleChangeRoleModalClose = () => {
    setChangeRoleModal({
      isOpen: false,
      userId: 0,
      userName: '',
      currentRole: 'Member',
      newRole: 'Member',
    });
  };

  /** ロール変更を実行 */
  const handleChangeRoleConfirm = async () => {
    const { userId, userName, newRole } = changeRoleModal;
    const result = await updateWorkspaceMemberRole(workspaceDetail.id!, userId, newRole);

    if (result.success) {
      // メンバー一覧のロールを更新
      setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, workspaceRole: newRole } : m)));
      notify.success(`${userName} のロールを変更しました。`);
      handleChangeRoleModalClose();
    } else if (result.error === 'member_has_assignments' && 'assignments' in result && result.assignments) {
      // アサインメントエラーの場合はエラー情報を設定（モーダルは閉じない）
      setAssignmentsError(result.assignments);
    } else {
      notify.error(result.message || 'ロールの変更に失敗しました。');
      handleChangeRoleModalClose();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay isLoading={isSubmitting} message="更新中..." />

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={currentUser} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} loading={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <AdminSidebar sidebarOpen={sidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 bg-base-100 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {/* ページヘッダー */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">ワークスペース編集</h1>
                <p className="text-base-content/60 mt-2">ワークスペース情報を編集します</p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push('/admin/workspaces')}>
                一覧に戻る
              </button>
            </div>

            {/* エラー表示 */}
            {fetchError && (
              <div className="alert alert-soft alert-error mb-6">
                <span>{fetchError}</span>
              </div>
            )}

            {/* 基本情報カード（読み取り専用） */}
            <div className="card mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">コード</p>
                    <p className="text-lg font-semibold">{workspaceDetail.code || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">メンバー数</p>
                    <p className="text-lg font-semibold">{workspaceDetail.members?.length || 0} 人</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">オーナー</p>
                    {workspaceDetail.owner ? (
                      <div className="flex items-center gap-2 mt-1">
                        <UserAvatar
                          userName={workspaceDetail.owner.userName || 'オーナー'}
                          isActive={workspaceDetail.owner.isActive ?? false}
                          identityIconUrl={workspaceDetail.owner.identityIconUrl}
                          size={24}
                          nameClassName="text-lg font-semibold"
                        />
                        {workspaceDetail.owner.isActive === false && (
                          <span className="badge badge-outline badge-warning badge-xs">非アクティブ</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-lg font-semibold">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 編集フォーム */}
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="mb-6">
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">編集項目</h2>

                  {/* ワークスペース名 */}
                  <div className="form-control">
                    <label htmlFor="name" className="label">
                      <span className="label-text font-semibold">
                        ワークスペース名 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="name"
                      data-field="name"
                      type="text"
                      className={`input input-bordered w-full ${shouldShowError('name') ? 'input-error' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="ワークスペース名を入力"
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    {shouldShowError('name') && (
                      <div className="label">
                        <span className="label-text-alt text-error">{getFieldError('name')}</span>
                      </div>
                    )}
                  </div>

                  {/* 説明 */}
                  <div className="form-control mt-4">
                    <label htmlFor="description" className="label">
                      <span className="label-text font-semibold">説明</span>
                    </label>
                    <textarea
                      id="description"
                      data-field="description"
                      className={`textarea textarea-bordered w-full ${
                        shouldShowError('description') ? 'textarea-error' : ''
                      }`}
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder="ワークスペースの説明を入力（任意）"
                      disabled={isSubmitting}
                      maxLength={500}
                      rows={4}
                      autoComplete="off"
                    />
                    <div className="label">
                      <span className="label-text-alt text-xs">{formData.description.length}/500 文字</span>
                      {shouldShowError('description') && (
                        <span className="label-text-alt text-error text-xs">{getFieldError('description')}</span>
                      )}
                    </div>
                  </div>

                  {/* ジャンル */}
                  {genres.length > 0 && (
                    <div className="form-control mt-4">
                      <label htmlFor="genreId" className="label">
                        <span className="label-text font-semibold">ジャンル</span>
                      </label>
                      <GenreSelect
                        id="genreId"
                        name="genreId"
                        genres={genres}
                        className={`select select-bordered w-full ${shouldShowError('genreId') ? 'select-error' : ''}`}
                        disabled={isSubmitting}
                        defaultValue={formData.genreId ? Number(formData.genreId) : ''}
                        onChange={(value) => handleFieldChange('genreId', value)}
                      />
                      {shouldShowError('genreId') && (
                        <div className="label">
                          <span className="label-text-alt text-error">{getFieldError('genreId')}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* アクティブ状態 */}
                  <div className="form-control mt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isActive"
                        data-field="isActive"
                        className="switch switch-outline switch-warning"
                        checked={formData.isActive}
                        onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <label htmlFor="isActive" className="label-text font-semibold cursor-pointer">
                        有効
                      </label>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="card-actions justify-end mt-6">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
                      キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          更新中...
                        </>
                      ) : (
                        '更新'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* メンバー情報 */}
            <WorkspaceMemberList
              members={members}
              editable={true}
              ownerId={workspaceDetail.owner?.id}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
              highlightedUserIds={highlightedUserIds}
            />

            {/* ワークスペース詳細情報カード */}
            <div className="card mt-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">{formatDateTime(workspaceDetail.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">更新日時</p>
                    <p className="text-lg font-semibold">{formatDateTime(workspaceDetail.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* メンバー削除確認モーダル */}
      <RemoveMemberModal
        isOpen={removeMemberModal.isOpen}
        userName={removeMemberModal.userName}
        email={removeMemberModal.email}
        onConfirm={handleRemoveMemberConfirm}
        onClose={handleRemoveMemberModalClose}
      />

      {/* ロール変更確認モーダル */}
      <ChangeRoleModal
        isOpen={changeRoleModal.isOpen}
        userName={changeRoleModal.userName}
        currentRole={changeRoleModal.currentRole}
        newRole={changeRoleModal.newRole}
        onConfirm={handleChangeRoleConfirm}
        onClose={handleChangeRoleModalClose}
        assignmentsError={assignmentsError}
        onClearAssignmentsError={() => setAssignmentsError(null)}
      />

      {/* メンバー追加モーダル */}
      <AddMemberModal
        isOpen={addMemberModal}
        existingMembers={members}
        onConfirm={handleAddMemberConfirm}
        onClose={handleAddMemberModalClose}
      />
    </div>
  );
}
