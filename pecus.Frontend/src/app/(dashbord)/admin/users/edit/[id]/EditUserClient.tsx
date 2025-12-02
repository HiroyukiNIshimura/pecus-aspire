'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { requestPasswordReset, setUserActiveStatus, setUserRoles, setUserSkills } from '@/actions/admin/user';
import AdminFooter from '@/components/admin/AdminFooter';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import MultiSelectDropdown from '@/components/common/MultiSelectDropdown';
import type { UserDetailResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import type { UserInfo } from '@/types/userInfo';

interface Skill {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface EditUserClientProps {
  initialUser: UserInfo | null;
  userDetail: UserDetailResponse;
  availableSkills: Skill[];
  availableRoles: Role[];
  fetchError: string | null;
}

export default function EditUserClient({
  initialUser,
  userDetail,
  availableSkills,
  availableRoles,
  fetchError,
}: EditUserClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // === 状態管理: ユーザー編集対象の3つの項目 ===
  // 選択肢のみで構成されているため、HTMLバリデーションやZodバリデーションは不要
  // 変更検知フラグで「更新ボタンの有効/無効」を制御している
  const [isActive, setIsActive] = useState(userDetail.isActive ?? true);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(
    userDetail.skills?.map((s) => s.id).filter((id): id is number => id !== undefined) || [],
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
    userDetail.roles?.map((r) => r.id).filter((id): id is number => id !== undefined) || [],
  );

  // === 変更検知: 元の値と現在の値を比較 ===
  // この3つのフラグは:
  // 1. 更新ボタンの有効/無効判定（hasChanges）に使用
  // 2. 更新前に「何が変更されるか」をユーザーに表示
  // 3. 実際の更新（Promise.all）で「どの操作を実行するか」を判定
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
  const hasChanges = isActiveChanged || skillsChanged || rolesChanged;

  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;

    setIsSubmitting(true);
    try {
      const updatePromises: Array<Promise<void>> = [];
      const updateMessages: string[] = [];

      // === 並列で更新処理を実行 ===
      // 3つの操作は相互に依存しないため、Promise.all()で並列実行可能
      // - setUserActiveStatus: ユーザーのアクティブ状態を更新
      // - setUserSkills: スキル割り当てを更新（多対多の関連付け）
      // - setUserRoles: ロール割り当てを更新（多対多の関連付け）
      // 各操作は独立しており、1つが失敗しても他に影響しない設計

      if (isActiveChanged) {
        updatePromises.push(
          setUserActiveStatus(userDetail.id!, isActive).then((result) => {
            if (!result.success) {
              throw new Error(result.message || 'アクティブ状態の更新に失敗しました。');
            }
            updateMessages.push(isActive ? 'ユーザーを有効化しました' : 'ユーザーを無効化しました');
          }),
        );
      }

      if (skillsChanged) {
        updatePromises.push(
          setUserSkills(userDetail.id!, selectedSkillIds, userDetail.rowVersion!).then((result) => {
            if (!result.success) {
              throw new Error(result.message || 'スキルの更新に失敗しました。');
            }
            updateMessages.push('スキルを更新しました');
          }),
        );
      }

      if (rolesChanged) {
        updatePromises.push(
          setUserRoles(userDetail.id!, selectedRoleIds, userDetail.rowVersion!).then((result) => {
            if (!result.success) {
              throw new Error(result.message || 'ロールの更新に失敗しました。');
            }
            updateMessages.push('ロールを更新しました');
          }),
        );
      }

      // 全ての更新を並列実行し、すべて完了を待つ
      await Promise.all(updatePromises);

      // 成功時のフィードバック: 何が変更されたかを具体的に表示
      if (updateMessages.length > 0) {
        notify.success(`更新完了: ${updateMessages.join('、')}`);
      } else {
        notify.info('変更はありませんでした。');
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
      // === パスワードリセットメール送信 ===
      // UI更新は伴わないため、変更検知対象ではない（isSubmitting, handleSubmit を使わない独立操作）
      // 成功時はメール送信完了をユーザーに通知
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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('ja-JP');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LoadingOverlay isLoading={isSubmitting} message="更新中..." />

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={initialUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={false} />

      <div className="flex flex-1">
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
        <main className="flex-1 p-6 bg-base-100">
          <div className="max-w-5xl mx-auto">
            {/* ページヘッダー */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">ユーザー編集</h1>
                <p className="text-base-content/60 mt-2">ユーザーのアクティブ状態、スキル、ロールを編集します</p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push('/admin/users')}>
                一覧に戻る
              </button>
            </div>

            {/* エラー表示 */}
            {fetchError && (
              <div className="alert alert-error mb-6">
                <span>{fetchError}</span>
              </div>
            )}

            {/* 基本情報カード（読み取り専用） */}
            <div className="card bg-base-200 shadow-lg mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">ユーザー名</p>
                    <p className="text-lg font-semibold">{userDetail.username || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">メールアドレス</p>
                    <p className="text-lg font-semibold">{userDetail.email || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">ログインID</p>
                    <p className="text-lg font-semibold">{userDetail.loginId || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 編集フォーム */}
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="mb-6">
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">編集項目</h2>

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
                      <div className="alert alert-info mt-2">
                        <span className="text-sm">
                          {isActive ? '✓ ユーザーを有効化します' : '✗ ユーザーを無効化します'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="card-actions justify-end mt-6 gap-2">
                    <button type="button" className="btn btn-ghost" onClick={handleCancel} disabled={isSubmitting}>
                      キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting || !hasChanges}>
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          更新中...
                        </>
                      ) : (
                        <>
                          更新
                          {hasChanges &&
                            ` (${[isActiveChanged && 'アクティブ', skillsChanged && 'スキル', rolesChanged && 'ロール'].filter(Boolean).join('・')})`}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* ユーザー情報カード */}
            <div className="card bg-base-200 shadow-lg mb-6">
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
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">その他の操作</h2>

                <button type="button" className="btn btn-outline w-full" onClick={handleRequestPasswordReset}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  パスワードリセットメール送信
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <AdminFooter />
    </div>
  );
}
