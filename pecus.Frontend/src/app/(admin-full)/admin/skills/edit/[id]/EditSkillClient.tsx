'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateSkill } from '@/actions/admin/skills';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/feedback/LoadingOverlay';
import type { SkillDetailResponse } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { formatDateTime } from '@/libs/utils/date';
import { editSkillSchema } from '@/schemas/editSchemas';
import type { UserInfo } from '@/types/userInfo';

interface EditSkillClientProps {
  initialUser: UserInfo | null;
  skillDetail: SkillDetailResponse;
  fetchError: string | null;
}

export default function EditSkillClient({ initialUser, skillDetail, fetchError }: EditSkillClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState({
    name: skillDetail.name || '',
    description: skillDetail.description || '',
    isActive: skillDetail.isActive ?? true,
  });

  // Zod一本化フック
  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: editSkillSchema,
    onSubmit: async (data) => {
      try {
        // rowVersion が存在しない場合はエラー
        if (!skillDetail.rowVersion) {
          notify.error('スキル情報の更新に必要なバージョン情報が取得できませんでした。');
          return;
        }

        const result = await updateSkill(skillDetail.id!, {
          name: data.name,
          description: data.description || undefined,
          isActive: data.isActive,
          rowVersion: skillDetail.rowVersion,
        });

        if (result.success) {
          notify.success('スキルを更新しました。');
          router.push('/admin/skills');
        } else {
          console.error('スキルの更新に失敗しました:', result.error);
          notify.error(
            result.error
              ? `スキルの更新中にエラーが発生しました。(${result.error})`
              : 'スキルの更新中にエラーが発生しました。',
          );
        }
      } catch (err: unknown) {
        console.error('スキルの更新中にエラーが発生しました:', err);
        notify.error('スキルの更新中にエラーが発生しました。');
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
    router.push('/admin/skills');
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
                <h1 className="text-3xl font-bold">スキル編集</h1>
                <p className="text-base-content/60 mt-2">スキル情報を編集します</p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push('/admin/skills')}>
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
                    <label className="label" htmlFor="input-skill-name">
                      <span className="label-text font-semibold">
                        スキル名 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      id="input-skill-name"
                      name="name"
                      type="text"
                      className={`input input-bordered w-full ${shouldShowError('name') ? 'input-error' : ''}`}
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="スキル名を入力"
                      disabled={isSubmitting}
                      required
                    />
                    {shouldShowError('name') && (
                      <span className="label-text-alt text-error">{getFieldError('name')}</span>
                    )}
                  </div>

                  <div className="form-control mt-4">
                    <label className="label" htmlFor="input-description">
                      <span className="label-text font-semibold">説明</span>
                    </label>
                    <textarea
                      id="input-description"
                      name="description"
                      className={`textarea textarea-bordered w-full ${
                        shouldShowError('description') ? 'textarea-error' : ''
                      }`}
                      placeholder="スキルの説明を入力してください"
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      disabled={isSubmitting}
                      rows={3}
                    ></textarea>
                    {shouldShowError('description') && (
                      <span className="label-text-alt text-error">{getFieldError('description')}</span>
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

            {/* スキル詳細情報カード */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">スキルID</p>
                    <p className="text-lg font-semibold">{skillDetail.id || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">保有者数</p>
                    <p className="text-lg font-semibold">{skillDetail.userCount || 0} 人</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">{formatDateTime(skillDetail.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">更新日時</p>
                    <p className="text-lg font-semibold">{formatDateTime(skillDetail.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
