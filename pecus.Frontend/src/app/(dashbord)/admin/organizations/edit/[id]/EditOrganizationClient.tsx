'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateOrganization } from '@/actions/admin/organizations';
import AdminFooter from '@/components/admin/AdminFooter';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import type { OrganizationResponse } from '@/connectors/api/pecus';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useNotify } from '@/hooks/useNotify';
import { editOrganizationSchema } from '@/schemas/editSchemas';
import type { UserInfo } from '@/types/userInfo';

interface EditOrganizationClientProps {
  initialUser: UserInfo | null;
  organizationDetail: OrganizationResponse;
  fetchError: string | null;
}

export default function EditOrganizationClient({
  initialUser,
  organizationDetail,
  fetchError,
}: EditOrganizationClientProps) {
  const router = useRouter();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // フォーム状態（スキーマの型に合わせる）
  const [formData, setFormData] = useState({
    name: organizationDetail.name || '',
    description: organizationDetail.description || '',
    representativeName: organizationDetail.representativeName || '',
    phoneNumber: organizationDetail.phoneNumber || '',
    email: organizationDetail.email || '',
  });

  // Zod一本化フック
  const { formRef, isSubmitting, handleSubmit, validateField, shouldShowError, getFieldError } = useFormValidation({
    schema: editOrganizationSchema,
    onSubmit: async (data) => {
      try {
        // rowVersion が存在しない場合はエラー
        if (!organizationDetail.rowVersion) {
          notify.error('組織情報の更新に必要なバージョン情報が取得できませんでした。');
          return;
        }

        const result = await updateOrganization({
          name: data.name,
          description: data.description || undefined,
          representativeName: data.representativeName || undefined,
          phoneNumber: data.phoneNumber || undefined,
          email: data.email || undefined,
          rowVersion: organizationDetail.rowVersion,
        });

        if (result.success) {
          notify.success('組織情報を更新しました。');
          router.push('/admin');
        } else {
          console.error('組織情報の更新に失敗しました:', result.error);
          notify.error(
            result.error
              ? `組織情報の更新中にエラーが発生しました。(${result.error})`
              : '組織情報の更新中にエラーが発生しました。',
          );
        }
      } catch (err: unknown) {
        console.error('組織情報の更新中にエラーが発生しました:', err);
        notify.error('組織情報の更新中にエラーが発生しました。');
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
    router.push('/admin');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LoadingOverlay isLoading={isSubmitting} message="更新中..." />

      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={initialUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} loading={false} />

      <div className="flex flex-1">
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
        <main className="flex-1 p-6 bg-base-100">
          <div className="max-w-4xl mx-auto">
            {/* ページヘッダー */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">組織編集</h1>
                <p className="text-base-content/60 mt-2">組織情報を編集します</p>
              </div>
              <button type="button" className="btn btn-outline" onClick={() => router.push('/admin')}>
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
            <div className="card mb-6">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">基本情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-base-content/60">組織ID</p>
                    <p className="text-lg font-semibold">{organizationDetail.id || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">組織コード</p>
                    <p className="text-lg font-semibold">{organizationDetail.code || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">所属ユーザー数</p>
                    <p className="text-lg font-semibold">{organizationDetail.userCount || 0} 人</p>
                  </div>

                  <div>
                    <p className="text-sm text-base-content/60">作成日時</p>
                    <p className="text-lg font-semibold">
                      {organizationDetail.createdAt
                        ? new Date(organizationDetail.createdAt).toLocaleString('ja-JP')
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 編集フォーム */}
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="mb-6">
              {/* 組織基本情報カード */}
              <div className="card mb-6">
                <div className="card-body">
                  <h2 className="card-title text-lg mb-4">基本情報編集</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label" htmlFor="input-name">
                        <span className="label-text font-semibold">組織名 *</span>
                      </label>
                      <input
                        id="input-name"
                        name="name"
                        type="text"
                        className={`input input-bordered ${shouldShowError('name') ? 'input-error' : ''}`}
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        required
                      />
                      {shouldShowError('name') && (
                        <span className="label-text-alt text-error">{getFieldError('name')}</span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label" htmlFor="input-representative-name">
                        <span className="label-text font-semibold">代表者名</span>
                      </label>
                      <input
                        id="input-representative-name"
                        name="representativeName"
                        type="text"
                        className={`input input-bordered ${shouldShowError('representativeName') ? 'input-error' : ''}`}
                        value={formData.representativeName}
                        onChange={(e) => handleFieldChange('representativeName', e.target.value)}
                      />
                      {shouldShowError('representativeName') && (
                        <span className="label-text-alt text-error">{getFieldError('representativeName')}</span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label" htmlFor="input-email">
                        <span className="label-text font-semibold">メールアドレス</span>
                      </label>
                      <input
                        id="input-email"
                        name="email"
                        type="email"
                        className={`input input-bordered ${shouldShowError('email') ? 'input-error' : ''}`}
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                      />
                      {shouldShowError('email') && (
                        <span className="label-text-alt text-error">{getFieldError('email')}</span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label" htmlFor="input-phone-number">
                        <span className="label-text font-semibold">電話番号</span>
                      </label>
                      <input
                        id="input-phone-number"
                        name="phoneNumber"
                        type="text"
                        className={`input input-bordered ${shouldShowError('phoneNumber') ? 'input-error' : ''}`}
                        value={formData.phoneNumber}
                        onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                      />
                      {shouldShowError('phoneNumber') && (
                        <span className="label-text-alt text-error">{getFieldError('phoneNumber')}</span>
                      )}
                    </div>

                    <div className="form-control md:col-span-2">
                      <label className="label" htmlFor="input-description">
                        <span className="label-text font-semibold">説明</span>
                      </label>
                      <textarea
                        id="input-description"
                        name="description"
                        className={`textarea textarea-bordered ${
                          shouldShowError('description') ? 'textarea-error' : ''
                        }`}
                        placeholder="組織の説明を入力してください"
                        value={formData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        rows={3}
                      ></textarea>
                      {shouldShowError('description') && (
                        <span className="label-text-alt text-error">{getFieldError('description')}</span>
                      )}
                    </div>
                  </div>

                  {/* 操作ボタン */}
                  <div className="flex gap-3 justify-end mt-6">
                    <button type="button" className="btn btn-outline" onClick={handleCancel}>
                      キャンセル
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
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

            {/* 組織詳細情報カード */}
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-lg mb-4">詳細情報</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-base-content/60">更新日時</p>
                    <p className="text-lg font-semibold">
                      {organizationDetail.updatedAt
                        ? new Date(organizationDetail.updatedAt).toLocaleString('ja-JP')
                        : '-'}
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
