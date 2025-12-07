'use client';

import { useState } from 'react';
import type { DeviceResponse } from '@/connectors/api/pecus';

interface DevicesTabProps {
  devices: DeviceResponse[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * 現在のブラウザからデバイス情報を取得
 * C#側のDeviceType/OSPlatform enumに合わせた値を返す
 */
function detectCurrentDeviceInfo(): { deviceType: string; os: string; userAgent: string } {
  const userAgent = navigator.userAgent;

  // デバイスタイプの判定（C#側のDeviceType enumに合わせる）
  // Browser = 1, MobileApp = 2, DesktopApp = 3, Other = 99
  // ブラウザからのアクセスは全て 'Browser'
  const deviceType = 'Browser';

  // OSの判定（C#側のOSPlatform enumに合わせる）
  // Unknown = 0, Windows = 1, MacOS = 2, Linux = 3, iOS = 4, Android = 5
  let os = 'Unknown';
  if (/Windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/Mac OS X|Macintosh/i.test(userAgent)) {
    os = 'MacOS';
  } else if (/Android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = 'iOS'; // C#側は小文字の 'i'
  } else if (/Linux/i.test(userAgent)) {
    os = 'Linux';
  }

  return { deviceType, os, userAgent };
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
  // 現在のブラウザのデバイス情報を取得
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<{
    deviceType: string;
    os: string;
    userAgent: string;
  } | null>(null);

  // クライアントサイドでのみデバイス情報を取得
  if (typeof window !== 'undefined' && currentDeviceInfo === null) {
    // SSR時はnullのまま、クライアント時に取得
    const info = detectCurrentDeviceInfo();
    setCurrentDeviceInfo(info);
  }

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

  const isCurrentDevice = (device: DeviceResponse) => {
    // クライアントサイドでのみ判定可能
    if (!currentDeviceInfo) {
      return false;
    }

    // DeviceType, OS, UserAgent(client) の組み合わせで現在のデバイスを判定
    // hashedIdentifierはIPアドレスを含むためフロントエンドでは再現できない
    const deviceTypeMatch = device.deviceType === currentDeviceInfo.deviceType;
    const osMatch = device.os === currentDeviceInfo.os;
    const clientMatch = device.client === currentDeviceInfo.userAgent;

    // 全て一致する場合に現在のデバイスと判定
    return deviceTypeMatch && osMatch && clientMatch;
  };

  const activeDevices = devices.filter((d) => isCurrentDevice(d));
  const revokedDevices = devices.filter((d) => !isCurrentDevice(d));

  return (
    <div className="space-y-6">
      {activeDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-base-content">現在の端末</h3>
          <div className="space-y-4">{activeDevices.map((d) => renderCard(d))}</div>
        </div>
      )}

      {revokedDevices.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-base-content">その他の端末</h3>
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
