'use client';

import { useMemo, useState } from 'react';
import { deleteDevice } from '@/actions/profile';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import type { DeviceResponse } from '@/connectors/api/pecus';

interface DevicesTabProps {
  devices: DeviceResponse[];
  isLoading?: boolean;
  error?: string | null;
  notify: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  onRefreshDevices?: () => Promise<void>;
}

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('ja-JP');
  } catch (error) {
    console.error('Failed to format datetime:', error);
    return value;
  }
};

const InfoItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-base-content/60">{label}</p>
    <p className="text-sm font-medium text-base-content">{value ?? '-'} </p>
  </div>
);

export default function DevicesTab({ devices, isLoading = false, error, notify, onRefreshDevices }: DevicesTabProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDevice, setTargetDevice] = useState<DeviceResponse | null>(null);

  const targetDeviceLabel = useMemo(() => {
    if (!targetDevice) return '';
    return (
      targetDevice.name ??
      targetDevice.publicId ??
      (targetDevice.id != null ? `端末 #${targetDevice.id}` : (targetDevice.deviceType ?? '不明な端末'))
    );
  }, [targetDevice]);

  const openDeleteModal = (device: DeviceResponse) => {
    if (device.id == null) {
      notify.error('この端末は削除できません。');
      return;
    }
    setTargetDevice(device);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!targetDevice || targetDevice.id == null) {
      notify.error('削除対象の端末が見つかりません。');
      return;
    }

    setDeletingId(targetDevice.id);
    try {
      const result = await deleteDevice(targetDevice.id);
      if (result.success) {
        notify.success('端末を削除しました。');
        await onRefreshDevices?.();
      } else {
        notify.error(result.message || '端末の削除に失敗しました');
      }
    } catch (deleteError) {
      console.error('Failed to delete device:', deleteError);
      notify.error('端末の削除に失敗しました');
    } finally {
      setDeletingId(null);
      setIsDeleteModalOpen(false);
      setTargetDevice(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200/50 px-6 py-10 text-center">
        <p className="text-base-content/70">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>;
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200/50 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-base-content">接続中の端末はありません</p>
        <p className="mt-2 text-sm text-base-content/70">新しい端末からログインすると、ここに表示されます。</p>
      </div>
    );
  }

  const now = Date.now();

  const renderCard = (device: DeviceResponse) => {
    const deviceLabel = device.name ?? device.publicId ?? (device.id != null ? `端末 #${device.id}` : '不明な端末');
    const key =
      device.publicId ??
      (device.id != null
        ? device.id.toString()
        : `${device.deviceType ?? 'device'}-${device.lastSeenAt ?? device.firstSeenAt ?? now}`);

    return (
      <div key={key} className="rounded-xl border border-base-300 bg-base-200/60 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs text-base-content/60">端末</p>
            <p className="text-lg font-semibold text-base-content">{deviceLabel}</p>
            {device.publicId && <p className="text-xs text-base-content/50">Public ID: {device.publicId}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {!device.isCurrentDevice && device.id != null && (
              <button
                type="button"
                className="btn btn-outline btn-error btn-sm"
                onClick={() => openDeleteModal(device)}
                disabled={isLoading || deletingId === device.id}
              >
                {deletingId === device.id ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span>削除中...</span>
                  </>
                ) : (
                  'この端末を削除'
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <InfoItem label="接続識別名" value={device.name} />
            <InfoItem label="種類" value={device.deviceType} />
            <InfoItem label="OS" value={device.os} />
            <InfoItem label="エージェント" value={device.client} />
            <InfoItem label="タイムゾーン" value={device.timezone} />
          </div>
          <div className="space-y-3">
            <InfoItem label="初回接続" value={formatDateTime(device.firstSeenAt)} />
            <InfoItem label="最終接続" value={formatDateTime(device.lastSeenAt)} />
            <InfoItem label="最終IP" value={device.lastIpMasked} />
            <InfoItem label="場所（推定）" value={device.lastSeenLocation} />
          </div>
        </div>
      </div>
    );
  };
  const activeDevices = devices.filter((d) => d.isCurrentDevice);
  const otherDevices = devices.filter((d) => !d.isCurrentDevice);

  return (
    <div className="space-y-6">
      {activeDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-base-content">現在の端末</h3>
          <div className="space-y-4">{activeDevices.map((d) => renderCard(d))}</div>
        </div>
      )}

      {otherDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-base-content">その他の端末</h3>
          <p>ネットカフェなどの公共の場所からのアクセスや心当たりの無い端末は積極的に削除してください。</p>
          <div className="space-y-4">{otherDevices.map((d) => renderCard(d))}</div>
        </div>
      )}

      {activeDevices.length === 0 && otherDevices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200/50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-base-content">接続中の端末はありません</p>
          <p className="mt-2 text-sm text-base-content/70">新しい端末からログインすると、ここに表示されます。</p>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (deletingId) return;
          setIsDeleteModalOpen(false);
          setTargetDevice(null);
        }}
        onConfirm={handleConfirmDelete}
        itemType="端末"
        itemName={targetDeviceLabel}
        additionalWarning="この端末からのセッションが最長でも数十分後に失効し、再度ログインが必要になります。"
      />
    </div>
  );
}
