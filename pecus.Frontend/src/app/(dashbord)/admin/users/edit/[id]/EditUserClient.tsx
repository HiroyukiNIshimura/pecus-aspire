"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useNotify } from "@/hooks/useNotify";
import { setUserActiveStatus, setUserSkills, requestPasswordReset } from "@/actions/admin/user";
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

interface EditUserClientProps {
  initialUser: UserInfo | null;
  userDetail: UserResponse;
  availableSkills: Skill[];
  fetchError: string | null;
}

export default function EditUserClient({
  initialUser,
  userDetail,
  availableSkills,
  fetchError,
}: EditUserClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isActive, setIsActive] = useState(userDetail.isActive ?? true);
  const [selectedSkillIds, setSelectedSkillIds] = useState<number[]>(
    userDetail.skills?.map(s => s.id).filter((id): id is number => id !== undefined) || []
  );

  const { formRef, isSubmitting, handleSubmit } = useFormValidation({
    onSubmit: async () => {
      try {
        let hasErrors = false;

        // アクティブ状態の変更があれば更新
        if (isActive !== (userDetail.isActive ?? true)) {
          const result = await setUserActiveStatus(
            userDetail.id!,
            isActive
          );
          if (!result.success) {
            console.error("アクティブ状態の更新に失敗:", result.error);
            notify.error(result.error || "アクティブ状態の更新に失敗しました。");
            hasErrors = true;
          }
        }

        // スキルの変更があれば更新
        const currentSkillIds = userDetail.skills?.map(s => s.id) || [];
        const skillsChanged =
          selectedSkillIds.length !== currentSkillIds.length ||
          !selectedSkillIds.every(id => currentSkillIds.includes(id));

        if (skillsChanged) {
          const result = await setUserSkills(userDetail.id!, selectedSkillIds);
          if (!result.success) {
            console.error("スキルの更新に失敗:", result.error);
            notify.error(result.error || "スキルの更新に失敗しました。");
            hasErrors = true;
          }
        }

        if (!hasErrors) {
          notify.success("ユーザー情報を更新しました。");
          // 成功時は一覧に戻る
          setTimeout(() => {
            router.push("/admin/users");
          }, 1000);
        }
      } catch (err: unknown) {
        console.error("ユーザーの更新中にエラーが発生しました:", err);
        notify.error("ユーザーの更新中にエラーが発生しました。");
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
    <div className="flex h-screen overflow-hidden">
      <LoadingOverlay isLoading={isSubmitting} message="更新中..." />

      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader
          userInfo={initialUser}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          loading={false}
        />

        <main className="flex-1 overflow-y-auto bg-base-100 p-6">
          <div className="max-w-3xl mx-auto">
            {/* ページヘッダー */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">ユーザー編集</h1>
                <p className="text-base-content/60 mt-2">
                  ユーザー情報を編集します
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

                  {/* 基本情報 */}
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

                  <div className="form-control mt-4">
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

                  <div className="form-control mt-4">
                    <label className="label cursor-pointer">
                      <span className="label-text font-semibold">
                        アクティブ状態
                      </span>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>

                  {/* スキル編集 */}
                  <div className="divider my-4"></div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">スキル</span>
                    </label>
                    <details className="dropdown w-full">
                      <summary className="btn btn-outline w-full justify-start">
                        {selectedSkillIds.length > 0
                          ? `${selectedSkillIds.length} 個選択中`
                          : "スキルを選択"}
                      </summary>
                      <ul className="dropdown-content menu bg-base-100 rounded-box w-full p-2 shadow-lg border border-base-300 max-h-60 overflow-y-auto z-[1]">
                        {availableSkills.map((skill) => (
                          <li key={skill.id}>
                            <label className="label cursor-pointer gap-3 hover:bg-base-200 rounded p-2">
                              <input
                                type="checkbox"
                                checked={selectedSkillIds.includes(skill.id)}
                                onChange={() => toggleSkill(skill.id)}
                                className="checkbox checkbox-primary checkbox-sm"
                              />
                              <span className="label-text">{skill.name}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </details>

                    {selectedSkillIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedSkillIds.map((skillId) => {
                          const skill = availableSkills.find(s => s.id === skillId);
                          return (
                            <div key={skillId} className="badge badge-primary gap-2">
                              {skill?.name}
                              <button
                                type="button"
                                onClick={() => toggleSkill(skillId)}
                                className="btn btn-ghost btn-xs no-animation"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* アクションボタン */}
                  <div className="card-actions justify-end mt-6">
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          更新中...
                        </>
                      ) : (
                        "更新"
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
                      <span className="label-text font-semibold">
                        保有スキル数
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={`${userDetail.skills?.length || 0} 個`}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        管理者権限
                      </span>
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
                  パスワードリセットメール送信
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <AdminFooter />
      </div>
    </div>
  );
}
