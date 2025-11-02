"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useNotify } from "@/hooks/useNotify";
import { updateTag } from "@/actions/admin/tags";
import type { TagDetailResponse } from "@/connectors/api/pecus";

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
};

interface EditTagClientProps {
  initialUser: UserInfo | null;
  tagDetail: TagDetailResponse;
  fetchError: string | null;
}

export default function EditTagClient({
  initialUser,
  tagDetail,
  fetchError,
}: EditTagClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(tagDetail.name || "");
  const [isActive, setIsActive] = useState(tagDetail.isActive ?? true);

  const { formRef, isSubmitting, validateField, handleSubmit } =
    useFormValidation({
      onSubmit: async () => {
        if (!name.trim()) {
          notify.error("タグ名は必須です。");
          return;
        }

        try {
          const result = await updateTag(tagDetail.id!, {
            name: name.trim(),
            isActive,
          });

          if (result.success) {
            notify.success("タグを更新しました。");
          } else {
            console.error("タグの更新に失敗しました:", result.error);
            notify.error(
              result.error || "タグの更新中にエラーが発生しました。",
            );
          }
        } catch (err: unknown) {
          console.error("タグの更新中にエラーが発生しました:", err);
          notify.error("タグの更新中にエラーが発生しました。");
        }
      },
    });

  const handleCancel = () => {
    router.push("/admin/tags");
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
                <h1 className="text-3xl font-bold">タグ編集</h1>
                <p className="text-base-content/60 mt-2">
                  タグ情報を編集します
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.push("/admin/tags")}
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
                    <p className="text-sm text-base-content/60">タグ名</p>
                    <p className="text-lg font-semibold">{tagDetail.name || "-"}</p>
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
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">編集項目</h2>

                  <div className="form-control">
                    <label htmlFor="name" className="label">
                      <span className="label-text font-semibold">
                        タグ名 <span className="text-error">*</span>
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
                      placeholder="タグ名を入力"
                      disabled={isSubmitting}
                      required
                      data-pristine-required-message="タグ名は必須です。"
                      maxLength={100}
                      data-pristine-maxlength-message="タグ名は100文字以内で入力してください。"
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

            {/* タグ詳細情報カード */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">タグID</p>
                    <p className="text-lg font-semibold">{tagDetail.id || "-"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">参照アイテム</p>
                    <p className="text-lg font-semibold">{tagDetail.itemCount || 0} 件</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">
                      {tagDetail.createdAt
                        ? new Date(tagDetail.createdAt).toLocaleString("ja-JP")
                        : "-"}
                    </p>
                  </div>

                  {tagDetail.updatedAt && (
                    <div>
                      <p className="text-sm text-base-content/60">更新日時</p>
                      <p className="text-lg font-semibold">
                        {tagDetail.updatedAt
                          ? new Date(tagDetail.updatedAt).toLocaleString("ja-JP")
                          : "-"}
                      </p>
                    </div>
                  )}
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
