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
    const tokenExpiresAt = device.tokenExpiresAt ? Date.parse(device.tokenExpiresAt) : undefined;
    const isTokenExpired = tokenExpiresAt ? tokenExpiresAt <= now : false;
    const tokenStatus: { label: string; tone: 'success' | 'warning' | 'error' } = device.tokenIsRevoked
      ? { label: 'トークン無効', tone: 'error' }
      : isTokenExpired
        ? { label: 'トークン期限切れ', tone: 'warning' }
        : { label: 'トークン有効', tone: 'success' };

    const deviceStatus: { label: string; tone: 'success' | 'warning' | 'error' } = device.deviceIsRevoked
      ? { label: '端末無効', tone: 'error' }
      : device.deviceId
        ? { label: '端末有効', tone: 'success' }
        : { label: '端末情報なし', tone: 'warning' };

    const deviceLabel = device.publicId || `#${device.refreshTokenId}`;

    return (
      <div key={device.refreshTokenId} className="rounded-xl border border-base-300 bg-base-200/60 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs text-base-content/60">セッション</p>
            <p className="text-lg font-semibold text-base-content">{deviceLabel}</p>
            <p className="text-xs text-base-content/50">RefreshTokenId: {device.refreshTokenId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={tokenStatus.label} tone={tokenStatus.tone} />
            <StatusBadge label={deviceStatus.label} tone={deviceStatus.tone} />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <InfoItem label="端末名" value={device.name ?? (device.deviceId ? '未設定の端末名' : '端末情報なし')} />
            <InfoItem label="種類" value={device.deviceType} />
            <InfoItem label="OS" value={device.os} />
            <InfoItem label="クライアント" value={device.client} />
            <InfoItem label="アプリバージョン" value={device.appVersion} />
          </div>
          <div className="space-y-3">
            <InfoItem label="初回確認" value={formatDateTime(device.firstSeenAt)} />
            <InfoItem label="最終確認" value={formatDateTime(device.lastSeenAt)} />
            <InfoItem label="最終IP" value={device.lastIpMasked} />
            <InfoItem label="最終場所" value={device.lastSeenLocation} />
            <InfoItem label="タイムゾーン" value={device.timezone} />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <InfoItem label="トークン作成" value={formatDateTime(device.tokenCreatedAt)} />
          <InfoItem label="トークン有効期限" value={formatDateTime(device.tokenExpiresAt)} />
        </div>
      </div>
    );
  };

  const isTokenValid = (device: DeviceResponse) => {
    // トークンの有効期限が切れている場合は無効
    if (device.tokenExpiresAt && Date.parse(device.tokenExpiresAt) <= now) return false;
    return true;
  };

  const activeDevices = devices.filter((d) => isTokenValid(d));
  const revokedDevices = devices.filter((d) => !isTokenValid(d));

  return (
    <div className="space-y-6">
      {activeDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-base-content">有効な端末</h3>
          <div className="space-y-4">{activeDevices.map((d) => renderCard(d))}</div>
        </div>
      )}

      {revokedDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-base-content">無効な端末</h3>
          <div className="space-y-4">{revokedDevices.map((d) => renderCard(d))}</div>
        </div>
      )}

      {activeDevices.length === 0 && revokedDevices.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-200/50 px-6 py-10 text-center">
          <p className="text-lg font-semibold text-base-content">接続中の端末はありません</p>
          <p className="mt-2 text-sm text-base-content/70">新しい端末からログインすると、ここに表示されます。</p>
        </div>
      )}
    </div>
  );
}
