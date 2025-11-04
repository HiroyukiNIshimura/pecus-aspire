import { DeviceType } from "@/connectors/api/pecus/models/DeviceType";
import { OSPlatform } from "@/connectors/api/pecus/models/OSPlatform";

/**
 * ブラウザのデバイス情報を取得する
 */
export function getDeviceInfo() {
  const userAgent = navigator.userAgent;

  // OS判定 (navigator.userAgentから判定 - navigator.platformは非推奨)
  let os: OSPlatform;
  if (userAgent.includes('Windows')) {
    os = OSPlatform._1; // Windows
  } else if (userAgent.includes('Mac')) {
    os = OSPlatform._2; // MacOS
  } else if (userAgent.includes('Linux')) {
    os = OSPlatform._3; // Linux
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = OSPlatform._4; // iOS
  } else if (userAgent.includes('Android')) {
    os = OSPlatform._5; // Android
  } else {
    os = OSPlatform._0; // Unknown
  }

  // デバイス名生成（ブラウザ名 + OS名）
  const browserName = userAgent.includes('Chrome') ? 'Chrome' :
                     userAgent.includes('Firefox') ? 'Firefox' :
                     userAgent.includes('Safari') ? 'Safari' :
                     userAgent.includes('Edge') ? 'Edge' : 'Browser';

  const osName = os === OSPlatform._1 ? 'Windows' :
                 os === OSPlatform._2 ? 'macOS' :
                 os === OSPlatform._3 ? 'Linux' :
                 os === OSPlatform._4 ? 'iOS' :
                 os === OSPlatform._5 ? 'Android' : 'Unknown';

  const deviceName = `${browserName} on ${osName}`;

  return {
    deviceType: DeviceType._1, // Browser
    os,
    userAgent,
    deviceName,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  };
}