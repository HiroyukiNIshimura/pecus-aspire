"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useNotify } from "@/hooks/useNotify";
import { updateWorkspace } from "@/actions/admin/workspace";
import type { WorkspaceDetailResponse, MasterGenreResponse } from "@/connectors/api/pecus";

type UserInfo = {
  id: number;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
};

interface EditWorkspaceClientProps {
  initialUser: UserInfo | null;
  workspaceDetail: WorkspaceDetailResponse;
  genres: MasterGenreResponse[];
  fetchError: string | null;
}

export default function EditWorkspaceClient({
  initialUser,
  workspaceDetail,
  genres,
  fetchError,
}: EditWorkspaceClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState(workspaceDetail.name || "");
  const [description, setDescription] = useState(workspaceDetail.description || "");
  const [genreId, setGenreId] = useState<number | null>(
    (workspaceDetail as any).genreId || null
  );
  const [isActive, setIsActive] = useState(workspaceDetail.isActive ?? true);

  const { formRef, isSubmitting, validateField, handleSubmit } =
    useFormValidation({
      onSubmit: async () => {
        if (!name.trim()) {
          notify.error("ワークスペース名は必須です。");
          return;
        }

        try {
          const result = await updateWorkspace(
            workspaceDetail.id!,
            {
              name: name.trim(),
              description: description.trim() || undefined,
              genreId: genreId || undefined,
              isActive,
            }
          );

          if (result.success) {
            notify.success("ワークスペースを更新しました。");
          } else {
            console.error("ワークスペースの更新に失敗しました:", result.error);
            notify.error(
              result.error || "ワークスペースの更新中にエラーが発生しました。"
            );
          }
        } catch (err: unknown) {
          console.error("ワークスペースの更新中にエラーが発生しました:", err);
          notify.error("ワークスペースの更新中にエラーが発生しました。");
        }
      },
    });

  const handleCancel = () => {
    router.push("/admin/workspaces");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ローディングオーバーレイ */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-base-100 bg-opacity-80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-lg">更新中...</p>
          </div>
        </div>
      )}

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
                <h1 className="text-3xl font-bold">ワークスペース編集</h1>
                <p className="text-base-content/60 mt-2">
                  ワークスペース情報を編集します
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => router.push("/admin/workspaces")}
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

                  {/* ワークスペース名 */}
                  <div className="form-control">
                    <label htmlFor="name" className="label">
                      <span className="label-text font-semibold">
                        ワークスペース名 <span className="text-error">*</span>
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
                      placeholder="ワークスペース名を入力"
                      disabled={isSubmitting}
                      required
                      data-pristine-required-message="ワークスペース名は必須です。"
                      maxLength={100}
                      data-pristine-maxlength-message="ワークスペース名は100文字以内で入力してください。"
                    />
                  </div>

                  {/* 説明 */}
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
                      placeholder="ワークスペースの説明を入力（任意）"
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

                  {/* ジャンル */}
                  {genres.length > 0 && (
                    <div className="form-control mt-4">
                      <label htmlFor="genre" className="label">
                        <span className="label-text font-semibold">ジャンル</span>
                      </label>
                      <select
                        id="genre"
                        name="genre"
                        className="select select-bordered w-full"
                        value={genreId ?? ""}
                        onChange={(e) =>
                          setGenreId(e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                        disabled={isSubmitting}
                      >
                        <option value="">選択してください</option>
                        {genres.map((genre) => (
                          <option key={genre.id} value={genre.id}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* アクティブ状態 */}
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

            {/* ワークスペース情報カード */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        ワークスペースID
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={workspaceDetail.id || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">コード</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={workspaceDetail.code || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        所属組織
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={workspaceDetail.organization?.name || ""}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">
                        メンバー数
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      value={`${workspaceDetail.members?.length || 0} 人`}
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
                        workspaceDetail.createdAt
                          ? new Date(workspaceDetail.createdAt).toLocaleString(
                              "ja-JP"
                            )
                          : ""
                      }
                      disabled
                    />
                  </div>

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
                        workspaceDetail.updatedAt
                          ? new Date(workspaceDetail.updatedAt).toLocaleString(
                              "ja-JP"
                            )
                          : ""
                      }
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* メンバー情報 */}
            {workspaceDetail.members && workspaceDetail.members.length > 0 && (
              <div className="card bg-base-200 shadow-lg mt-6">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">メンバー</h2>

                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>ユーザー名</th>
                          <th>メールアドレス</th>
                          <th>ロール</th>
                          <th>参加日</th>
                          <th>最終アクセス</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspaceDetail.members.map((member) => (
                          <tr key={member.userId}>
                            <td className="font-semibold">{member.username}</td>
                            <td>{member.email}</td>
                            <td>
                              <span className="badge badge-outline">
                                {member.workspaceRole || "Member"}
                              </span>
                            </td>
                            <td>
                              {member.joinedAt
                                ? new Date(member.joinedAt).toLocaleDateString(
                                    "ja-JP"
                                  )
                                : ""}
                            </td>
                            <td>
                              {member.lastAccessedAt
                                ? new Date(member.lastAccessedAt).toLocaleString(
                                    "ja-JP"
                                  )
                                : "未"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <AdminFooter />
      </div>
    </div>
  );
}
