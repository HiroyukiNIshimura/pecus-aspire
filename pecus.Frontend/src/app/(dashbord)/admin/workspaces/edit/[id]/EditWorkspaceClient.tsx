"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateWorkspace } from "@/actions/admin/workspace";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import LoadingOverlay from "@/components/common/LoadingOverlay";
import type {
  MasterGenreResponse,
  WorkspaceDetailResponse,
} from "@/connectors/api/pecus";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useNotify } from "@/hooks/useNotify";
import { editWorkspaceSchema } from "@/schemas/editSchemas";
import type { UserInfo } from "@/types/userInfo";

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

  // フォーム状態（スキーマの型に合わせる）
  const [formData, setFormData] = useState({
    name: workspaceDetail.name || "",
    description: workspaceDetail.description || "",
    genreId: (workspaceDetail as any).genreId
      ? String((workspaceDetail as any).genreId)
      : "",
    isActive: workspaceDetail.isActive ?? true,
  });

  // Zod一本化フック
  const {
    formRef,
    isSubmitting,
    handleSubmit,
    validateField,
    shouldShowError,
    getFieldError,
  } = useFormValidation({
    schema: editWorkspaceSchema,
    onSubmit: async (data) => {
      try {
        // rowVersion が存在しない場合はエラー
        if (!workspaceDetail.rowVersion) {
          notify.error(
            "ワークスペース情報の更新に必要なバージョン情報が取得できませんでした。",
          );
          return;
        }

        const result = await updateWorkspace(workspaceDetail.id!, {
          name: data.name,
          description: data.description || undefined,
          genreId:
            typeof data.genreId === "string"
              ? parseInt(data.genreId, 10)
              : data.genreId,
          rowVersion: workspaceDetail.rowVersion,
        });

        if (result.success) {
          notify.success("ワークスペースを更新しました。");
          router.push("/admin/workspaces");
        } else {
          console.error("ワークスペースの更新に失敗しました:", result.error);
          notify.error(
            result.error
              ? `ワークスペースの更新中にエラーが発生しました。(${result.error})`
              : "ワークスペースの更新中にエラーが発生しました。",
          );
        }
      } catch (err: unknown) {
        console.error("ワークスペースの更新中にエラーが発生しました:", err);
        notify.error("ワークスペースの更新中にエラーが発生しました。");
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
    router.push("/admin/workspaces");
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

            {/* 基本情報カード（読み取り専用） */}
            <div className="card bg-base-200 shadow-lg mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">
                      ワークスペース名
                    </p>
                    <p className="text-lg font-semibold">
                      {workspaceDetail.name || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">コード</p>
                    <p className="text-lg font-semibold">
                      {workspaceDetail.code || "-"}
                    </p>
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
                      className={`input input-bordered w-full ${
                        shouldShowError("name") ? "input-error" : ""
                      }`}
                      value={formData.name}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                      placeholder="ワークスペース名を入力"
                      disabled={isSubmitting}
                    />
                    {shouldShowError("name") && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          {getFieldError("name")}
                        </span>
                      </label>
                    )}
                  </div>

                  {/* 説明 */}
                  <div className="form-control mt-4">
                    <label htmlFor="description" className="label">
                      <span className="label-text font-semibold">説明</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      className={`textarea textarea-bordered w-full ${
                        shouldShowError("description") ? "textarea-error" : ""
                      }`}
                      value={formData.description}
                      onChange={(e) =>
                        handleFieldChange("description", e.target.value)
                      }
                      placeholder="ワークスペースの説明を入力（任意）"
                      disabled={isSubmitting}
                      maxLength={500}
                      rows={4}
                    />
                    <label className="label">
                      <span className="label-text-alt text-xs">
                        {formData.description.length}/500 文字
                      </span>
                      {shouldShowError("description") && (
                        <span className="label-text-alt text-error text-xs">
                          {getFieldError("description")}
                        </span>
                      )}
                    </label>
                  </div>

                  {/* ジャンル */}
                  {genres.length > 0 && (
                    <div className="form-control mt-4">
                      <label htmlFor="genreId" className="label">
                        <span className="label-text font-semibold">
                          ジャンル
                        </span>
                      </label>
                      <select
                        id="genreId"
                        name="genreId"
                        className={`select select-bordered w-full ${
                          shouldShowError("genreId") ? "select-error" : ""
                        }`}
                        value={formData.genreId}
                        onChange={(e) =>
                          handleFieldChange("genreId", e.target.value)
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
                      {shouldShowError("genreId") && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {getFieldError("genreId")}
                          </span>
                        </label>
                      )}
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
                        name="isActive"
                        className="checkbox checkbox-primary"
                        checked={formData.isActive}
                        onChange={(e) =>
                          handleFieldChange("isActive", e.target.checked)
                        }
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

            {/* ワークスペース詳細情報カード */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">
                      ワークスペースID
                    </p>
                    <p className="text-lg font-semibold">
                      {workspaceDetail.id || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">所属組織</p>
                    <p className="text-lg font-semibold">
                      {workspaceDetail.organization?.name || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">メンバー数</p>
                    <p className="text-lg font-semibold">
                      {workspaceDetail.members?.length || 0} 人
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">
                      {workspaceDetail.createdAt
                        ? new Date(workspaceDetail.createdAt).toLocaleString(
                            "ja-JP",
                          )
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">更新日時</p>
                    <p className="text-lg font-semibold">
                      {workspaceDetail.updatedAt
                        ? new Date(workspaceDetail.updatedAt).toLocaleString(
                            "ja-JP",
                          )
                        : "-"}
                    </p>
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
                                    "ja-JP",
                                  )
                                : ""}
                            </td>
                            <td>
                              {member.lastAccessedAt
                                ? new Date(
                                    member.lastAccessedAt,
                                  ).toLocaleString("ja-JP")
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
      </div>

      {/* Footer */}
      <AdminFooter />
    </div>
  );
}
