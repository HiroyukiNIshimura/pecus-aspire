'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { requestPasswordReset, resendPasswordSetup, updateUser } from '@/actions/admin/user';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import MultiSelectDropdown from '@/components/common/filters/MultiSelectDropdown';
import type { UserDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { useCurrentUser } from '@/providers/AppSettingsProvider';

interface Skill {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface EditUserClientProps {
  userDetail: UserDetailResponse;
  availableSkills: Skill[];
  availableRoles: Role[];
  fetchError: string | null;
}

export default function EditUserClient({
  userDetail,
  availableSkills,
  availableRoles,
  fetchError,
}: EditUserClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const currentUser = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // === 状態管理: ユーザー編集対象の項目 ===
  const [username, setUsername] = useState(userDetail.username || '');
  const [isActive, setIsActive] = useState(userDetail.isActive ?? true);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(
    userDetail.skills?.map((s) => s.id).filter((id): id is number => id !== undefined) || [],
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
    userDetail.roles?.map((r) => r.id).filter((id): id is number => id !== undefined) || [],
  );

  // === 変更検知: 元の値と現在の値を比較 ===
  const usernameChanged = username.trim() !== (userDetail.username || '');
  const isActiveChanged = isActive !== (userDetail.isActive ?? true);
  const skillsChanged = (() => {
    const currentSkillIds = userDetail.skills?.map((s) => s.id).filter((id): id is number => id !== undefined) || [];
    return (
      selectedSkillIds.length !== currentSkillIds.length ||
      !selectedSkillIds.every((id) => currentSkillIds.includes(id))
    );
  })();
  const rolesChanged = (() => {
    const currentRoleIds = userDetail.roles?.map((r) => r.id).filter((id): id is number => id !== undefined) || [];
    return (
      selectedRoleIds.length !== currentRoleIds.length || !selectedRoleIds.every((id) => currentRoleIds.includes(id))
    );
  })();

  // いずれかの項目が変更されている場合のみ更新ボタンを有効化
  const hasChanges = usernameChanged || isActiveChanged || skillsChanged || rolesChanged;

  // バリデーション
  const isUsernameValid = username.trim().length > 0 && username.trim().length <= 50;

  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges || !isUsernameValid) return;

    setIsSubmitting(true);
    try {
      // 1つのAPIで全項目を一括更新
      const result = await updateUser(userDetail.id!, {
        username: username.trim(),
        isActive,
        skillIds: selectedSkillIds,
        roleIds: selectedRoleIds,
        rowVersion: userDetail.rowVersion!,
      });

      if (result.success) {
        notify.success('ユーザー情報を更新しました');
        router.push('/admin/users');
      } else if (result.error === 'conflict') {
        // 競合時は最新データを表示して警告
        notify.warning(result.message || '別のユーザーが同時に更新しました。画面を更新してください。');
      } else {
        notify.error(result.message || 'ユーザー情報の更新に失敗しました。');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        notify.error(err.message);
      } else {
        notify.error('ユーザー情報の更新中にエラーが発生しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/users');
  };

  const handleRequestPasswordReset = async () => {
    try {
      const result = await requestPasswordReset(userDetail.id!);
      if (result.success) {
        notify.success('パスワードリセットメールを送信しました。');
      } else {
        notify.error(result.message || 'パスワードリセットの送信に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('パスワードリセット送信中にエラーが発生:', err);
      notify.error('パスワードリセット送信中にエラーが発生しました。');
    }
  };

  const handleResendPasswordSetup = async () => {
    try {
      const result = await resendPasswordSetup(userDetail.id!);
      if (result.success) {
        notify.success('パスワード設定メールを再送しました。');
      } else {
        notify.error(result.message || 'パスワード設定メールの再送に失敗しました。');
      }
    } catch (err: unknown) {
      console.error('パスワード設定メール再送中にエラーが発生:', err);
      notify.error('パスワード設定メール再送中にエラーが発生しました。');
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ja-JP');
    } catch {
      return dateString;
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
                <h1 className="text-3xl font-bold">ユーザー編集</h1>
                <p className="text-base-content/60 mt-2">ユーザー名、アクティブ状態、スキル、ロールを編集します</p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push('/admin/users')}>
                一覧に戻る
              </button>
            </div>

            {/* エラー表示 */}
            {fetchError && (
              <div className="alert alert-soft alert-error mb-6">
                <span>{fetchError}</span>
              </div>
            )}

            {/* 編集フォーム */}
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="mb-6">
              {/* 基本情報カード */}
              <div className="card mb-6">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">基本情報</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label htmlFor="username" className="label">
                        <span className="label-text">ユーザー名</span>
                      </label>
                      <input
                        type="text"
                        id="username"
                        className={`input input-bordered w-full ${!isUsernameValid ? 'input-error' : ''}`}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isSubmitting}
                        maxLength={50}
                        required
                        aria-describedby={
                          !isUsernameValid ? 'username-error' : usernameChanged ? 'username-changed' : undefined
                        }
                      />
                      {!isUsernameValid && (
                        <p id="username-error" className="label-text-alt text-error mt-1">
                          ユーザー名は1〜50文字で入力してください
                        </p>
                      )}
                      {usernameChanged && isUsernameValid && (
                        <p id="username-changed" className="label-text-alt text-info mt-1">
                          ✓ ユーザー名が変更されています
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-base-content/60 mb-2">メールアドレス</p>
                      <p className="text-lg font-semibold">
                        {userDetail.isActive ? userDetail.email : userDetail.backupEmail || '-'}
                      </p>
                      {!userDetail.isActive && userDetail.backupEmail && (
                        <p className="text-xs text-base-content/50 mt-1">無効化前のメールアドレス</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-base-content/60 mb-2">ログインID</p>
                      <p className="text-lg font-semibold">{userDetail.loginId || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 編集項目カード */}
              <div className="card mb-6">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">属性設定</h2>

                  {/* スキル編集 */}
                  <div className="divider my-4"></div>
                  <MultiSelectDropdown
                    label="スキル"
                    items={availableSkills}
                    selectedIds={selectedSkillIds}
                    onSelectionChange={setSelectedSkillIds}
                    disabled={isSubmitting}
                    placeholder="スキルを選択してください"
                    emptyMessage="利用可能なスキルがありません"
                    badgeColor="primary"
                    changeMessage={skillsChanged ? '✓ スキルが変更されています' : undefined}
                    maxItems={50}
                  />

                  {/* ロール編集 */}
                  <div className="divider my-4"></div>
                  <MultiSelectDropdown
                    label="ロール"
                    items={availableRoles}
                    selectedIds={selectedRoleIds}
                    onSelectionChange={setSelectedRoleIds}
                    disabled={isSubmitting}
                    placeholder="ロールを選択してください"
                    emptyMessage="利用可能なロールがありません"
                    badgeColor="secondary"
                    changeMessage={rolesChanged ? '✓ ロールが変更されています' : undefined}
                    maxItems={5}
                  />

                  {/* アクティブ状態 */}
                  <div className="divider my-2"></div>
                  <div className="form-control">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isActive"
                        className="switch switch-outline switch-warning"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <div>
                        <label htmlFor="isActive" className="label-text font-semibold text-base cursor-pointer">
                          有効
                        </label>
                        <p className="text-sm text-base-content/60">
                          無効にすると、このユーザーはログインできなくなります
                        </p>
                      </div>
                    </div>
                    {isActiveChanged && (
                      <div className="alert alert-soft alert-info mt-2">
                        <span className="text-sm">
                          {isActive ? '✓ ユーザーを有効化します' : '✗ ユーザーを無効化します'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="card-actions justify-end mt-6 gap-2">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting || !hasChanges || !isUsernameValid}
                    >
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

            {/* ユーザー情報カード */}
            <div className="card mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">ユーザーID</p>
                    <p className="text-lg font-semibold">{userDetail.id || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">{formatDate(userDetail.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">管理者権限</p>
                    <p className="text-lg font-semibold">{userDetail.isAdmin ? '有効' : 'なし'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* その他の操作 */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">その他の操作</h2>

                <div className="space-y-3">
                  <button type="button" className="btn btn-outline w-full" onClick={handleRequestPasswordReset}>
                    <span className="icon-[tabler--mail] w-5 h-5" />
                    パスワードリセットメール送信
                  </button>

                  <button type="button" className="btn btn-outline w-full" onClick={handleResendPasswordSetup}>
                    <span className="icon-[tabler--mail-forward] w-5 h-5" />
                    パスワード設定メール再送
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
