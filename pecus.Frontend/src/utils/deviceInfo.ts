import { getLocationFromCoordinates } from '@/actions/geolocation';
import type { DeviceType } from '@/connectors/api/pecus/models/DeviceType';
import type { OSPlatform } from '@/connectors/api/pecus/models/OSPlatform';
import type { DeviceInfo } from '@/libs/atoms/deviceInfoAtom';

type UADataBrand = {
  brand: string;
  version?: string;
};

type UADataLike = {
  brands?: UADataBrand[];
  platform?: string;
};

function deriveDeviceInfoFromUserAgent(
  userAgent: string | undefined,
  userAgentData?: UADataLike,
): {
  deviceName: string;
  deviceType: DeviceType;
  os: OSPlatform;
} {
  if (!userAgent) {
    return {
      deviceName: 'Unknown Device',
      deviceType: 'Other',
      os: 'Unknown',
    };
  }

  const platformLower = userAgentData?.platform?.toLowerCase();

  let os: OSPlatform;
  if (platformLower?.includes('windows')) {
    os = 'Windows';
  } else if (platformLower?.includes('mac')) {
    os = 'MacOS';
  } else if (platformLower?.includes('linux')) {
    os = 'Linux';
  } else if (platformLower?.includes('ios')) {
    os = 'iOS';
  } else if (platformLower?.includes('android')) {
    os = 'Android';
  } else if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'MacOS';
  } else if (userAgent.includes('Linux') && !userAgent.includes('Android')) {
    os = 'Linux';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else {
    os = 'Unknown';
  }

  let deviceType: DeviceType;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile-app') || ua.includes('nativeapp')) {
    deviceType = 'MobileApp';
  } else if (ua.includes('electron') || ua.includes('desktop-app')) {
    deviceType = 'DesktopApp';
  } else {
    deviceType = 'Browser';
  }

  const brandNames = (userAgentData?.brands || []).map((b) => b.brand.toLowerCase());
  const hasBrand = (keyword: string | RegExp) =>
    brandNames.some((name) => (typeof keyword === 'string' ? name.includes(keyword) : keyword.test(name)));

  const isEdgeByBrand = hasBrand(/edge|edg/i);
  const isEdgeByUA = /Edg([A-Za-z]+)?\//i.test(userAgent);
  const isFirefox = hasBrand('firefox') || userAgent.includes('Firefox');
  const isChromeLike = (hasBrand('chromium') || hasBrand('chrome') || userAgent.includes('Chrome')) && !isEdgeByUA;
  const isSafari = (hasBrand('safari') || /safari/i.test(userAgent)) && !isChromeLike && !isEdgeByUA && !isFirefox;

  const browserName =
    isEdgeByBrand || isEdgeByUA
      ? 'Edge'
      : isFirefox
        ? 'Firefox'
        : isChromeLike
          ? 'Chrome'
          : isSafari
            ? 'Safari'
            : 'Browser';

  const osName =
    os === 'Windows'
      ? 'Windows'
      : os === 'MacOS'
        ? 'macOS'
        : os === 'Linux'
          ? 'Linux'
          : os === 'iOS'
            ? 'iOS'
            : os === 'Android'
              ? 'Android'
              : 'Unknown';

  const deviceName = `${browserName} on ${osName}`;

  return {
    deviceName,
    deviceType,
    os,
  };
}

/**
 * User-Agent からデバイス情報を解析する（サーバーサイド/Edge Runtime対応）
 * Middleware やサーバーコンポーネントから利用可能
 */
export function parseDeviceInfoFromUserAgent(userAgent: string | undefined): {
  deviceName: string;
  deviceType: DeviceType;
  os: OSPlatform;
} {
  return deriveDeviceInfoFromUserAgent(userAgent);
}

/**
 * 緯度経度からおおよその地域を推定する（フォールバック用）
 * サーバーアクションで取得できない場合のみ使用
 */
function getApproximateLocation(latitude: number, longitude: number): string {
  // 日本の範囲内かチェック
  if (latitude >= 20.0 && latitude <= 46.0 && longitude >= 122.0 && longitude <= 154.0) {
    // 日本の場合の詳細な地域推定
    if (latitude >= 35.0 && latitude <= 36.0 && longitude >= 139.0 && longitude <= 141.0) {
      return '東京都近郊';
    } else if (latitude >= 34.0 && latitude <= 35.0 && longitude >= 135.0 && longitude <= 136.0) {
      return '大阪府近郊';
    } else if (latitude >= 35.0 && latitude <= 36.0 && longitude >= 136.0 && longitude <= 138.0) {
      return '名古屋近郊';
    } else if (latitude >= 43.0 && latitude <= 46.0) {
      return '北海道';
    } else if (latitude >= 40.0 && latitude <= 43.0) {
      return '東北地方';
    } else if (latitude >= 36.0 && latitude <= 40.0 && longitude >= 138.0 && longitude <= 142.0) {
      return '関東地方';
    } else if (latitude >= 34.0 && latitude <= 37.0 && longitude >= 132.0 && longitude <= 138.0) {
      return '中部地方';
    } else if (latitude >= 33.0 && latitude <= 35.0 && longitude >= 130.0 && longitude <= 136.0) {
      return '近畿地方';
    } else if (latitude >= 30.0 && latitude <= 35.0 && longitude >= 126.0 && longitude <= 132.0) {
      return '中国・四国地方';
    } else if (latitude >= 24.0 && latitude <= 32.0 && longitude >= 122.0 && longitude <= 132.0) {
      return '九州・沖縄地方';
    } else {
      return '日本国内';
    }
  }

  // アジア
  if (latitude >= -10.0 && latitude <= 80.0 && longitude >= 60.0 && longitude <= 180.0) {
    if (latitude >= 20.0 && latitude <= 50.0 && longitude >= 100.0 && longitude <= 150.0) {
      return '東アジア';
    } else if (latitude >= 0.0 && latitude <= 40.0 && longitude >= 60.0 && longitude <= 100.0) {
      return '南アジア';
    } else if (latitude >= 40.0 && latitude <= 80.0 && longitude >= 40.0 && longitude <= 180.0) {
      return '北アジア';
    } else {
      return 'アジア';
    }
  }

  // 北米
  if (latitude >= 15.0 && latitude <= 85.0 && longitude >= -170.0 && longitude <= -50.0) {
    if (latitude >= 40.0 && latitude <= 50.0 && longitude >= -125.0 && longitude <= -110.0) {
      return '北米西部';
    } else if (latitude >= 35.0 && latitude <= 45.0 && longitude >= -95.0 && longitude <= -75.0) {
      return '北米中部';
    } else if (latitude >= 25.0 && latitude <= 50.0 && longitude >= -85.0 && longitude <= -65.0) {
      return '北米東部';
    } else {
      return '北米';
    }
  }

  // ヨーロッパ
  if (latitude >= 35.0 && latitude <= 75.0 && longitude >= -15.0 && longitude <= 70.0) {
    if (latitude >= 50.0 && latitude <= 60.0 && longitude >= 0.0 && longitude <= 20.0) {
      return '西ヨーロッパ';
    } else if (latitude >= 45.0 && latitude <= 55.0 && longitude >= 5.0 && longitude <= 25.0) {
      return '中欧';
    } else if (latitude >= 40.0 && latitude <= 50.0 && longitude >= 10.0 && longitude <= 30.0) {
      return '南ヨーロッパ';
    } else {
      return 'ヨーロッパ';
    }
  }

  // 南米
  if (latitude >= -60.0 && latitude <= 15.0 && longitude >= -90.0 && longitude <= -30.0) {
    return '南米';
  }

  // アフリカ
  if (latitude >= -40.0 && latitude <= 40.0 && longitude >= -20.0 && longitude <= 55.0) {
    if (latitude >= 0.0 && latitude <= 20.0) {
      return 'アフリカ北部';
    } else if (latitude >= -10.0 && latitude <= 10.0) {
      return 'アフリカ中部';
    } else {
      return 'アフリカ南部';
    }
  }

  // オセアニア
  if (latitude >= -50.0 && latitude <= 20.0 && longitude >= 110.0 && longitude <= 180.0) {
    return 'オセアニア';
  }

  // 南極
  if (latitude < -60.0) {
    return '南極';
  }

  // デフォルト
  return '不明な地域';
}

/**
 * ブラウザのデバイス情報を取得する
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const userAgent = navigator.userAgent;
  const uaData = (navigator as { userAgentData?: UADataLike }).userAgentData;
  const parsed = deriveDeviceInfoFromUserAgent(userAgent, uaData);

  // Geolocation APIで位置情報を取得し、Nominatim APIで詳細な地域情報に変換
  let location = null;
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 180000, // 3分以内のキャッシュを使用
        });
      });

      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      // 【優先】Server Action で Nominatim API を呼び出し
      const result = await getLocationFromCoordinates(latitude, longitude);

      if (result.success && result.data) {
        // Nominatim APIから取得した詳細な地域情報を使用
        const parts = [
          result.data.country && `${result.data.country}(${result.data.countryCode})`,
          result.data.province,
          result.data.county,
        ].filter(Boolean);
        location = parts.join(' ');
      } else {
        // Nominatim API が失敗した場合のフォールバック
        console.warn('Nominatim APIからの位置情報取得に失敗しました');
        location = getApproximateLocation(latitude, longitude);
      }
    } catch (error) {
      console.warn('位置情報の取得に失敗しました:', error);
      // 位置情報が取得できない場合はnullのまま
    }
  }

  return {
    deviceType: 'Browser', // Browser
    os: parsed.os,
    userAgent,
    deviceName: parsed.deviceName,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    location,
    latitude,
    longitude,
  };
}
