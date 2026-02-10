'use client';

import { useState } from 'react';
import { createExternalApiKey, revokeExternalApiKey } from '@/actions/admin/externalApiKeys';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import type { CreateExternalApiKeyResponse, ExternalApiKeyResponse } from '@/connectors/api/pecus';
import { useNotify } from '@/hooks/useNotify';
import { useCurrentUser } from '@/providers/AppSettingsProvider';
import ApiKeyTable from './ApiKeyTable';
import CreateApiKeyModal from './CreateApiKeyModal';
import RawKeyModal from './RawKeyModal';
import RevokeApiKeyModal from './RevokeApiKeyModal';

interface Props {
  initialKeys: ExternalApiKeyResponse[];
}

export default function AdminApiKeysClient({ initialKeys }: Props) {
  const currentUser = useCurrentUser();
  const notify = useNotify();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keys, setKeys] = useState<ExternalApiKeyResponse[]>(initialKeys);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // モーダル状態
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateExternalApiKeyResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ExternalApiKeyResponse | null>(null);

  const handleCreate = async (name: string, expirationDays?: number) => {
    setIsSubmitting(true);
    try {
      const result = await createExternalApiKey({ name, expirationDays });
      if (!result.success) {
        notify.error(result.message);
        return;
      }
      setCreatedKey(result.data);
      setShowCreateModal(false);
      // 一覧に追加
      setKeys((prev) => [
        {
          id: result.data.id,
          name: result.data.name,
          keyPrefix: result.data.keyPrefix,
          expiresAt: result.data.expiresAt,
          isRevoked: false,
          lastUsedAt: null,
          createdByUserId: 0,
          createdAt: result.data.createdAt,
          isExpired: false,
        },
        ...prev,
      ]);
      notify.success('APIキーを発行しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (key: ExternalApiKeyResponse) => {
    setIsSubmitting(true);
    try {
      const result = await revokeExternalApiKey(key.id);
      if (!result.success) {
        notify.error(result.message);
        return;
      }
      setKeys((prev) => prev.map((k) => (k.id === key.id ? { ...k, isRevoked: true } : k)));
      setRevokeTarget(null);
      notify.success('APIキーを失効させました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Sticky Navigation Header */}
      <AdminHeader userInfo={currentUser} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} loading={false} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Menu */}
        <AdminSidebar sidebarOpen={sidebarOpen} />

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="bg-base-100 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">APIキー管理</h1>
                <p className="text-base-content/60 text-sm">外部システム連携用のAPIキーを管理します</p>
              </div>
              <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <span className="icon-[mdi--key-plus] size-5" aria-hidden="true" />
                APIキーを発行
              </button>
            </div>

            <ApiKeyTable keys={keys} onRevoke={(key) => setRevokeTarget(key)} isSubmitting={isSubmitting} />
          </div>
        </main>
      </div>

      <CreateApiKeyModal
        isOpen={showCreateModal}
        isSubmitting={isSubmitting}
        onConfirm={handleCreate}
        onClose={() => setShowCreateModal(false)}
      />

      <RawKeyModal
        isOpen={createdKey !== null}
        rawKey={createdKey?.rawKey ?? ''}
        keyName={createdKey?.name ?? ''}
        onClose={() => setCreatedKey(null)}
      />

      <RevokeApiKeyModal
        isOpen={revokeTarget !== null}
        keyName={revokeTarget?.name ?? ''}
        keyPrefix={revokeTarget?.keyPrefix ?? ''}
        isSubmitting={isSubmitting}
        onConfirm={() => revokeTarget && handleRevoke(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
      />
    </div>
  );
}
