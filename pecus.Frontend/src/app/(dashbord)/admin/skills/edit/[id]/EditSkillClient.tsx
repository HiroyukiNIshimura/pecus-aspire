"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useValidation } from "@/hooks/useValidation";
import { useNotify } from "@/hooks/useNotify";
import { updateSkill } from "@/actions/admin/skills";
import { editSkillSchema } from "@/schemas/editSchemas";
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

  // UI検証（Pristine.js）
  const { formRef, isSubmitting, validateField, handleSubmit } =
    useFormValidation({
      onSubmit: async () => {
        // Pristineが成功した後、Zodバリデーションを実行
        const validationResult = await dataValidation.validate({
          name: name.trim(),
          description: description.trim(),
          isActive,
        });

        if (!validationResult.success) {
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
            router.push("/admin/skills");
          } else {
            console.error("スキルの更新に失敗しました:", result.error);
            notify.error(
              result.error ? `スキルの更新中にエラーが発生しました。(${result.error})` : "スキルの更新中にエラーが発生しました。",
            );
          }
        } catch (err: unknown) {
          console.error("スキルの更新中にエラーが発生しました:", err);
          notify.error("スキルの更新中にエラーが発生しました。");
        }
      },
    });

  // データ検証（Zod）
  const dataValidation = useValidation(editSkillSchema);

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
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
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

            {/* 基本情報カード（読み取り専用） */}
            <div className="card bg-base-200 shadow-lg mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">スキル名</p>
                    <p className="text-lg font-semibold">{skillDetail.name || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 編集フォーム */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              noValidate
              className="mb-6"
            >
              {/* スキル基本情報カード */}
              <div className="card bg-base-100 border border-base-300 mb-6">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">編集</h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">スキル名 *</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">説明</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered"
                        placeholder="スキルの説明を入力してください"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      ></textarea>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer">
                        <span className="label-text font-semibold">有効</span>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Zod検証エラー表示 */}
                  {dataValidation.hasErrors && (
                    <div className="alert alert-error mt-4">
                      <div className="flex flex-col gap-1">
                        {dataValidation.errors.map((err, idx) => (
                          <div key={idx} className="text-sm">{err}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 操作ボタン */}
                  <div className="flex gap-3 justify-end mt-6">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancel}
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
                          <span className="loading loading-spinner loading-sm"></span>
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

            {/* スキル詳細情報カード */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">スキルID</p>
                    <p className="text-lg font-semibold">{skillDetail.id || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">保有者数</p>
                    <p className="text-lg font-semibold">{skillDetail.userCount || 0} 人</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">
                      {skillDetail.createdAt
                        ? new Date(skillDetail.createdAt).toLocaleString("ja-JP")
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">更新日時</p>
                    <p className="text-lg font-semibold">
                      {skillDetail.updatedAt
                        ? new Date(skillDetail.updatedAt).toLocaleString("ja-JP")
                        : "-"}
                    </p>
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
