'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateTag } from '@/actions/admin/tags';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import type { TagDetailResponse } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { formatDateTime } from '@/libs/utils/date';
import { editTagSchema } from '@/schemas/editSchemas';
import type { UserInfo } from '@/types/userInfo';

interface EditTagClientProps {
  initialUser: UserInfo | null;
  tagDetail: TagDetailResponse;
  fetchError: string | null;
}

export default function EditTagClient({ initialUser, tagDetail, fetchError }: EditTagClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: tagDetail.name || '',
    isActive: tagDetail.isActive ?? true,
  });

  // Zod一本化フック
  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: editTagSchema,
    onSubmit: async (data) => {
      try {
        // rowVersion が存在しない場合はエラー
        if (!tagDetail.rowVersion) {
          notify.error('タグ情報の更新に必要なバージョン情報が取得できませんでした。');
          return;
        }

        const result = await updateTag(tagDetail.id!, {
          name: data.name,
          isActive: data.isActive,
          rowVersion: tagDetail.rowVersion,
        });

        if (result.success) {
          notify.success('タグを更新しました。');
          router.push('/admin/tags');
        } else {
          console.error('タグの更新に失敗しました:', result.message);
          notify.error(result.message || 'タグの更新中にエラーが発生しました。');
        }
      } catch (err: unknown) {
        console.error('タグの更新中にエラーが発生しました:', err);
        notify.error('タグの更新中にエラーが発生しました。');
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
    router.push('/admin/tags');
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <LoadingOverlay isLoading={isSubmitting} message="更新中..." />

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={initialUser} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} loading={false} />

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
                <h1 className="text-3xl font-bold">タグ編集</h1>
                <p className="text-base-content/60 mt-2">タグ情報を編集します</p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push('/admin/tags')}>
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
              <div className="card">
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
                      className={`input input-bordered w-full ${shouldShowError('name') ? 'input-error' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="タグ名を入力"
                      disabled={isSubmitting}
                      required
                    />
                    {shouldShowError('name') && (
                      <span className="label-text-alt text-error">{getFieldError('name')}</span>
                    )}
                  </div>

                  <div className="form-control mt-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        className="switch switch-outline switch-warning"
                        checked={formData.isActive}
                        onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                        disabled={isSubmitting}
                      />
                      <label htmlFor="isActive" className="label-text font-semibold cursor-pointer">
                        有効
                      </label>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="card-actions justify-end mt-6">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={isSubmitting}>
                      キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
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

            {/* タグ詳細情報カード */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">タグID</p>
                    <p className="text-lg font-semibold">{tagDetail.id || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">参照アイテム</p>
                    <p className="text-lg font-semibold">{tagDetail.itemCount || 0} 件</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">{formatDateTime(tagDetail.createdAt)}</p>
                  </div>

                  {tagDetail.updatedAt && (
                    <div>
                      <p className="text-sm text-base-content/60">更新日時</p>
                      <p className="text-lg font-semibold">{formatDateTime(tagDetail.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
