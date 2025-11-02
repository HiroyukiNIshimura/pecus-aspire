"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useNotify } from "@/hooks/useNotify";
import {
  setUserActiveStatus,
  setUserSkills,
  setUserRoles,
  requestPasswordReset
} from "@/actions/admin/user";
import type { UserResponse } from "@/connectors/api/pecus";

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
};

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
  userDetail: UserResponse;
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

  // 編集可能な3つの項目の状態管理
  const [isActive, setIsActive] = useState(userDetail.isActive ?? true);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(
    userDetail.skills?.map(s => s.id).filter((id): id is number => id !== undefined) || []
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
    userDetail.roles?.map(r => r.id).filter((id): id is number => id !== undefined) || []
  );

  // 各項目の変更検知
  const isActiveChanged = isActive !== (userDetail.isActive ?? true);
  const skillsChanged = (() => {
    const currentSkillIds = userDetail.skills?.map(s => s.id).filter((id): id is number => id !== undefined) || [];
    return selectedSkillIds.length !== currentSkillIds.length ||
           !selectedSkillIds.every(id => currentSkillIds.includes(id));
  })();
  const rolesChanged = (() => {
    const currentRoleIds = userDetail.roles?.map(r => r.id).filter((id): id is number => id !== undefined) || [];
    return selectedRoleIds.length !== currentRoleIds.length ||
           !selectedRoleIds.every(id => currentRoleIds.includes(id));
  })();

  const hasChanges = isActiveChanged || skillsChanged || rolesChanged;

  const { formRef, isSubmitting, handleSubmit } = useFormValidation({
    onSubmit: async () => {
      try {
        const updatePromises: Array<Promise<any>> = [];
        const updateMessages: string[] = [];

        // 並列で更新処理を実行（依存関係がないため）
        if (isActiveChanged) {
          updatePromises.push(
            setUserActiveStatus(userDetail.id!, isActive).then(result => {
              if (!result.success) {
                throw new Error(result.error || "アクティブ状態の更新に失敗しました。");
              }
              updateMessages.push(isActive ? "ユーザーを有効化しました" : "ユーザーを無効化しました");
            })
          );
        }

        if (skillsChanged) {
          updatePromises.push(
            setUserSkills(userDetail.id!, selectedSkillIds).then(result => {
              if (!result.success) {
                throw new Error(result.error || "スキルの更新に失敗しました。");
              }
              updateMessages.push("スキルを更新しました");
            })
          );
        }

        if (rolesChanged) {
          updatePromises.push(
            setUserRoles(userDetail.id!, selectedRoleIds).then(result => {
              if (!result.success) {
                throw new Error(result.error || "ロールの更新に失敗しました。");
              }
              updateMessages.push("ロールを更新しました");
            })
          );
        }

        // 全ての更新を並列実行
        await Promise.all(updatePromises);

        // 成功メッセージを表示
        if (updateMessages.length > 0) {
          notify.success(`更新完了: ${updateMessages.join("、")}`);
          // 少し待ってから一覧に戻る
          setTimeout(() => {
            router.push("/admin/users");
          }, 1500);
        } else {
          notify.info("変更はありませんでした。");
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          notify.error(err.message);
        } else {
          notify.error("ユーザー情報の更新中にエラーが発生しました。");
        }
      }
    },
  });

  const handleCancel = () => {
    router.push("/admin/users");
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleRequestPasswordReset = async () => {
    try {
      const result = await requestPasswordReset(userDetail.id!);
      if (result.success) {
        notify.success("パスワードリセットメールを送信しました。");
      } else {
        notify.error(result.error || "パスワードリセットの送信に失敗しました。");
      }
    } catch (err: unknown) {
      console.error("パスワードリセット送信中にエラーが発生:", err);
      notify.error("パスワードリセット送信中にエラーが発生しました。");
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleString("ja-JP");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LoadingOverlay isLoading={isSubmitting} message="更新中..." />

      {/* Sticky Navigation Header */}
      <AdminHeader
        userInfo={initialUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={false}
      />

      <div className="flex flex-1">
        {/* Sidebar Menu */}
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 bg-base-100">
          <div className="max-w-3xl mx-auto">
            {/* ページヘッダー */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">ユーザー編集</h1>
                <p className="text-base-content/60 mt-2">
                  ユーザーのアクティブ状態、スキル、ロールを編集します
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.push("/admin/users")}
              >
                一覧に戻る
              </button>
            </div>

            {/* エラー表示 */}
            {fetchError && (
              <div className="alert alert-error mb-6">
                <span>{fetchError}</span>
              </div>
            )}

            {/* 編集フォーム */}
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="mb-6">
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">編集項目</h2>

                  {/* 基本情報（読み取り専用） */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-control">
                      <label htmlFor="username" className="label">
                        <span className="label-text font-semibold">ユーザー名</span>
                      </label>
                      <input
                        id="username"
                        type="text"
                        className="input input-bordered w-full"
                        value={userDetail.username || ""}
                        disabled
                      />
                    </div>

                    <div className="form-control">
                      <label htmlFor="email" className="label">
                        <span className="label-text font-semibold">メールアドレス</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="input input-bordered w-full"
                        value={userDetail.email || ""}
                        disabled
                      />
                    </div>
                  </div>

                  {/* アクティブ状態 */}
                  <div className="divider my-2"></div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <div>
                        <span className="label-text font-semibold text-base">
                          アクティブ状態
                        </span>
                        <p className="text-sm text-base-content/60">
                          無効にすると、このユーザーはログインできなくなります
                        </p>
                      </div>
                    </label>
                    {isActiveChanged && (
                      <div className="alert alert-info mt-2">
                        <span className="text-sm">
                          {isActive ? "✓ ユーザーを有効化します" : "✗ ユーザーを無効化します"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* スキル編集 */}
                  <div className="divider my-4"></div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-base">スキル</span>
                      <span className="label-text-alt">
                        {selectedSkillIds.length} / {availableSkills.length} 個選択中
                      </span>
                    </label>
                    <details className="dropdown w-full">
                      <summary className="btn btn-outline w-full justify-start">
                        {selectedSkillIds.length > 0
                          ? `${selectedSkillIds.length} 個のスキルを選択中`
                          : "スキルを選択してください"}
                      </summary>
                      <ul className="dropdown-content menu bg-base-100 rounded-box w-full p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto z-[1]">
                        {availableSkills.length === 0 ? (
                          <li className="text-center text-base-content/60 py-4">
                            利用可能なスキルがありません
                          </li>
                        ) : (
                          availableSkills.map((skill) => (
                            <li key={skill.id}>
                              <label className="label cursor-pointer gap-3 hover:bg-base-200 rounded p-2">
                                <input
                                  type="checkbox"
                                  checked={selectedSkillIds.includes(skill.id)}
                                  onChange={() => toggleSkill(skill.id)}
                                  className="checkbox checkbox-primary checkbox-sm"
                                />
                                <span className="label-text flex-1">{skill.name}</span>
                              </label>
                            </li>
                          ))
                        )}
                      </ul>
                    </details>

                    {selectedSkillIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedSkillIds.map((skillId) => {
                          const skill = availableSkills.find(s => s.id === skillId);
                          return (
                            <div key={skillId} className="badge badge-primary gap-2">
                              {skill?.name || `スキルID: ${skillId}`}
                              <button
                                type="button"
                                onClick={() => toggleSkill(skillId)}
                                className="btn btn-ghost btn-xs no-animation"
                                aria-label={`${skill?.name}を削除`}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {skillsChanged && (
                      <div className="alert alert-info mt-3">
                        <span className="text-sm">✓ スキルが変更されています</span>
                      </div>
                    )}
                  </div>

                  {/* ロール編集 */}
                  <div className="divider my-4"></div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-base">ロール</span>
                      <span className="label-text-alt">
                        {selectedRoleIds.length} / {availableRoles.length} 個選択中
                      </span>
                    </label>
                    <details className="dropdown w-full">
                      <summary className="btn btn-outline w-full justify-start">
                        {selectedRoleIds.length > 0
                          ? `${selectedRoleIds.length} 個のロールを選択中`
                          : "ロールを選択してください"}
                      </summary>
                      <ul className="dropdown-content menu bg-base-100 rounded-box w-full p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto z-[1]">
                        {availableRoles.length === 0 ? (
                          <li className="text-center text-base-content/60 py-4">
                            利用可能なロールがありません
                          </li>
                        ) : (
                          availableRoles.map((role) => (
                            <li key={role.id}>
                              <label className="label cursor-pointer gap-3 hover:bg-base-200 rounded p-2">
                                <input
                                  type="checkbox"
                                  checked={selectedRoleIds.includes(role.id)}
                                  onChange={() => toggleRole(role.id)}
                                  className="checkbox checkbox-primary checkbox-sm"
                                />
                                <span className="label-text flex-1">{role.name}</span>
                              </label>
                            </li>
                          ))
                        )}
                      </ul>
                    </details>

                    {selectedRoleIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedRoleIds.map((roleId) => {
                          const role = availableRoles.find(r => r.id === roleId);
                          return (
                            <div key={roleId} className="badge badge-secondary gap-2">
                              {role?.name || `ロールID: ${roleId}`}
                              <button
                                type="button"
                                onClick={() => toggleRole(roleId)}
                                className="btn btn-ghost btn-xs no-animation"
                                aria-label={`${role?.name}を削除`}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {rolesChanged && (
                      <div className="alert alert-info mt-3">
                        <span className="text-sm">✓ ロールが変更されています</span>
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="card-actions justify-end mt-6 gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting || !hasChanges}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          更新中...
                        </>
                      ) : (
                        <>更新{hasChanges && ` (${[isActiveChanged && 'アクティブ', skillsChanged && 'スキル', rolesChanged && 'ロール'].filter(Boolean).join('・')})`}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* ユーザー情報カード */}
            <div className="card bg-base-200 shadow-lg mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">ユーザーID</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={userDetail.id || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">ログインID</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={userDetail.loginId || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">作成日時</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={formatDate(userDetail.createdAt)}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">管理者権限</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={userDetail.isAdmin ? "有効" : "なし"}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* その他の操作 */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">その他の操作</h2>

                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={handleRequestPasswordReset}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
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
