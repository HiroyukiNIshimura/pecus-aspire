"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useNotify } from "@/hooks/useNotify";
import { updateSkill } from "@/actions/admin/skills";
import type { SkillDetailResponse } from "@/connectors/api/pecus";

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
};

interface EditSkillClientProps {
  initialUser: UserInfo | null;
  skillDetail: SkillDetailResponse;
  fetchError: string | null;
}

export default function EditSkillClient({
  initialUser,
  skillDetail,
  fetchError,
}: EditSkillClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(skillDetail.name || "");
  const [description, setDescription] = useState(skillDetail.description || "");
  const [isActive, setIsActive] = useState(skillDetail.isActive ?? true);

  const { formRef, isSubmitting, validateField, handleSubmit } =
    useFormValidation({
      onSubmit: async () => {
        if (!name.trim()) {
          notify.error("スキル名は必須です。");
          return;
        }

        try {
          const result = await updateSkill(skillDetail.id!, {
            name: name.trim(),
            description: description.trim() || undefined,
            isActive,
          });

          if (result.success) {
            notify.success("スキルを更新しました。");
          } else {
            console.error("スキルの更新に失敗しました:", result.error);
            notify.error(
              result.error || "スキルの更新中にエラーが発生しました。",
            );
          }
        } catch (err: unknown) {
          console.error("スキルの更新中にエラーが発生しました:", err);
          notify.error("スキルの更新中にエラーが発生しました。");
        }
      },
    });

  const handleCancel = () => {
    router.push("/admin/skills");
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
                <h1 className="text-3xl font-bold">スキル編集</h1>
                <p className="text-base-content/60 mt-2">
                  スキル情報を編集します
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.push("/admin/skills")}
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
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              className="mb-6"
            >
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">編集項目</h2>

                  <div className="form-control">
                    <label htmlFor="name" className="label">
                      <span className="label-text font-semibold">
                        スキル名 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="input input-bordered w-full"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={(e) => validateField(e.target)}
                      placeholder="スキル名を入力"
                      disabled={isSubmitting}
                      required
                      data-pristine-required-message="スキル名は必須です。"
                      maxLength={100}
                      data-pristine-maxlength-message="スキル名は100文字以内で入力してください。"
                    />
                  </div>

                  <div className="form-control mt-4">
                    <label htmlFor="description" className="label">
                      <span className="label-text font-semibold">説明</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className="textarea textarea-bordered w-full"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="スキルの説明を入力（任意）"
                      disabled={isSubmitting}
                      maxLength={500}
                      rows={4}
                    />
                    <label className="label">
                      <span className="label-text-alt text-xs">
                        {description.length}/500 文字
                      </span>
                    </label>
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

            {/* スキル情報カード */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">スキルID</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={skillDetail.id || ""}
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
                      value={
                        skillDetail.createdAt
                          ? new Date(skillDetail.createdAt).toLocaleString(
                              "ja-JP",
                            )
                          : ""
                      }
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">更新日時</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={
                        skillDetail.updatedAt
                          ? new Date(skillDetail.updatedAt).toLocaleString(
                              "ja-JP",
                            )
                          : ""
                      }
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">保有者数</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={`${skillDetail.userCount || 0} 人`}
                      disabled
                    />
                  </div>
                </div>
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
