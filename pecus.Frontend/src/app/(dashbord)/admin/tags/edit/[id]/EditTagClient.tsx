"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useValidation } from "@/hooks/useValidation";
import { useNotify } from "@/hooks/useNotify";
import { tagNameFilterSchema } from "@/schemas/filterSchemas";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameValidation = useValidation(tagNameFilterSchema);

  const handleNameChange = async (value: string) => {
    setName(value);
    await nameValidation.validate(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = await nameValidation.validate(name);
    if (!validationResult.success) {
      return;
    }

    if (!name.trim()) {
      notify.error("タグ名は必須です。");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateTag(tagDetail.id!, {
        name: name.trim(),
      });

      if (result.success) {
        notify.success("タグを更新しました。");
        // 成功メッセージを表示して編集ページにとどまる
        // リダイレクトしない
      } else {
        console.error("タグの更新に失敗しました:", result.error);
        notify.error("タグの更新中にエラーが発生しました。");
      }
    } catch (err: unknown) {
      console.error("タグの更新中にエラーが発生しました:", err);
      notify.error("タグの更新中にエラーが発生しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/tags");
  };

  return (
    <div className="flex h-screen overflow-hidden">
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
            <div className="mb-6">
              <h1 className="text-3xl font-bold">タグ編集</h1>
              <p className="text-base-content/60 mt-2">
                タグ情報を編集します
              </p>
            </div>

            {/* エラー表示 */}
            {fetchError && (
              <div className="alert alert-error mb-6">
                <span>{fetchError}</span>
              </div>
            )}

            {/* タグ情報カード */}
            <div className="card bg-base-200 shadow-lg mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">タグID</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={tagDetail.id || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        アクティブ状態
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={tagDetail.isActive ? "アクティブ" : "非アクティブ"}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        使用アイテム数
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={`${tagDetail.itemCount || 0} 件`}
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
                        tagDetail.createdAt
                          ? new Date(tagDetail.createdAt).toLocaleString(
                              "ja-JP"
                            )
                          : ""
                      }
                      disabled
                    />
                  </div>

                  {tagDetail.updatedAt && (
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold">
                          更新日時
                        </span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        value={
                          tagDetail.updatedAt
                            ? new Date(tagDetail.updatedAt).toLocaleString(
                                "ja-JP"
                              )
                            : ""
                        }
                        disabled
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 編集フォーム */}
            <form onSubmit={handleSubmit}>
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
                      type="text"
                      className={`input input-bordered w-full ${
                        nameValidation.hasErrors ? "input-error" : ""
                      }`}
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="タグ名を入力"
                      disabled={isSubmitting}
                      required
                    />
                    {nameValidation.error && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {nameValidation.error}
                        </span>
                      </label>
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
                      disabled={isSubmitting || !nameValidation.isValid}
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
          </div>
        </main>
      </div>
    </div>
  );
}
