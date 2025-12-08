'use client';

import type { DeviceResponse } from '@/connectors/api/pecus';

interface DevicesTabProps {
  devices: DeviceResponse[];
  isLoading?: boolean;
  error?: string | null;
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

const StatusBadge = ({ label, tone }: { label: string; tone: 'success' | 'warning' | 'error' }) => {
  const toneClass =
    tone === 'success'
      ? 'bg-success/15 text-success border-success/30'
      : tone === 'warning'
        ? 'bg-warning/15 text-warning border-warning/30'
        : 'bg-error/15 text-error border-error/30';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold leading-none ${toneClass}`}>{label}</span>
  );
};

const InfoItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-xs text-base-content/60">{label}</p>
    <p className="text-sm font-medium text-base-content">{value ?? '-'} </p>
  </div>
);

export default function DevicesTab({ devices, isLoading = false, error }: DevicesTabProps) {
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
    const deviceStatus: { label: string; tone: 'success' | 'warning' | 'error' } = device.isCurrentDevice
      ? { label: 'この端末', tone: 'success' }
      : { label: 'その他の端末', tone: 'warning' };

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
            <StatusBadge label={deviceStatus.label} tone={deviceStatus.tone} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <InfoItem label="端末名" value={device.name} />
            <InfoItem label="種類" value={device.deviceType} />
            <InfoItem label="OS" value={device.os} />
            <InfoItem label="クライアント" value={device.client} />
            <InfoItem label="タイムゾーン" value={device.timezone} />
          </div>
          <div className="space-y-3">
            <InfoItem label="初回確認" value={formatDateTime(device.firstSeenAt)} />
            <InfoItem label="最終確認" value={formatDateTime(device.lastSeenAt)} />
            <InfoItem label="最終IP" value={device.lastIpMasked} />
            <InfoItem label="最終場所" value={device.lastSeenLocation} />
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
          <div className="space-y-4">{otherDevices.map((d) => renderCard(d))}</div>
        </div>
      )}

      {activeDevices.length === 0 && otherDevices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200/50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-base-content">接続中の端末はありません</p>
          <p className="mt-2 text-sm text-base-content/70">新しい端末からログインすると、ここに表示されます。</p>
        </div>
      )}
    </div>
  );
}
