"use server";

import type { ApiResponse } from "./types";

/**
 * Nominatim OpenStreetMap API から返されるレスポンス
 */
interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  address: {
    town?: string;
    county?: string;
    province?: string;
    ISO3166_2_lvl4?: string;
    postcode?: string;
    country: string;
    country_code: string;
  };
  boundingbox: string[];
}

/**
 * 地域情報の解析結果
 */
export interface LocationInfo {
  displayName: string;
  country: string;
  countryCode: string;
  province?: string;
  county?: string;
  town?: string;
  postcode?: string;
  osm: {
    type: string;
    id: number;
  };
}

/**
 * Server Action: Nominatim APIを使用して緯度経度から地域情報を取得
 *
 * @param latitude 緯度
 * @param longitude 経度
 * @returns LocationInfo またはエラー
 *
 * @example
 * const result = await getLocationFromCoordinates(34.0, 135.0);
 * if (result.success) {
 *   console.log(result.data.displayName);
 * }
 */
export async function getLocationFromCoordinates(
  latitude: number,
  longitude: number,
): Promise<ApiResponse<LocationInfo>> {
  try {
    // 入力値の検証
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return {
        success: false,
        error: "validation",
        message: "緯度と経度は数値である必要があります。",
      };
    }

    if (latitude < -90 || latitude > 90) {
      return {
        success: false,
        error: "validation",
        message: "緯度は-90から90の範囲内である必要があります。",
      };
    }

    if (longitude < -180 || longitude > 180) {
      return {
        success: false,
        error: "validation",
        message: "経度は-180から180の範囲内である必要があります。",
      };
    }

    // Nominatim API を呼び出し
    //https://github.com/mohammedmishalk/current-location/blob/main/index.js
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        // User-Agent を指定（Nominatim の利用規約で推奨）
        "User-Agent": "pecus-aspire-location-service/1.0",
      },
      // Nominatim のレート制限対策：タイムアウトを設定
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`);
      return {
        success: false,
        error: "server",
        message: `位置情報の取得に失敗しました。(Status: ${response.status})`,
      };
    }

    const data: NominatimResponse = await response.json();

    // レスポンスの必須フィールドチェック
    if (!data.address || !data.display_name) {
      return {
        success: false,
        error: "server",
        message: "位置情報の取得に失敗しました。(Invalid response)",
      };
    }

    // LocationInfo にマッピング
    const locationInfo: LocationInfo = {
      displayName: data.display_name,
      country: data.address.country,
      countryCode: data.address.country_code,
      province: data.address.province,
      county: data.address.county,
      town: data.address.town,
      postcode: data.address.postcode,
      osm: {
        type: data.osm_type,
        id: data.osm_id,
      },
    };

    return {
      success: true,
      data: locationInfo,
    };
  } catch (error: any) {
    console.error("Failed to get location from coordinates:", error);

    // タイムアウトエラーの処理
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "server",
        message: "位置情報の取得がタイムアウトしました。",
      };
    }

    return {
      success: false,
      error: "server",
      message: error.message || "位置情報の取得中にエラーが発生しました。",
    };
  }
}

/**
 * Server Action: 複数の座標から一括で地域情報を取得
 *
 * @param coordinates 緯度経度の配列
 * @returns LocationInfo の配列 またはエラー
 *
 * @example
 * const results = await getLocationsFromCoordinates([
 *   { latitude: 34.0, longitude: 135.0 },
 *   { latitude: 35.6762, longitude: 139.6503 },
 * ]);
 */
export async function getLocationsFromCoordinates(
  coordinates: Array<{ latitude: number; longitude: number }>,
): Promise<ApiResponse<LocationInfo[]>> {
  try {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return {
        success: false,
        error: "validation",
        message: "座標情報の配列が空です。",
      };
    }

    // 最大 50 件の制限（API レート制限対策）
    if (coordinates.length > 50) {
      return {
        success: false,
        error: "validation",
        message: "座標情報は最大50件までです。",
      };
    }

    const locationPromises = coordinates.map((coord) => getLocationFromCoordinates(coord.latitude, coord.longitude));

    const results = await Promise.all(locationPromises);

    // 失敗したリクエストをフィルタリング
    const locationInfos = results
      .filter(
        (result): result is ApiResponse<LocationInfo> & { data: LocationInfo } =>
          result.success && result.data !== undefined,
      )
      .map((result) => result.data);

    if (locationInfos.length === 0) {
      return {
        success: false,
        error: "server",
        message: "位置情報を取得できませんでした。",
      };
    }

    return {
      success: true,
      data: locationInfos,
    };
  } catch (error: any) {
    console.error("Failed to get locations from coordinates:", error);
    return {
      success: false,
      error: "server",
      message: error.message || "複数の位置情報取得中にエラーが発生しました。",
    };
  }
}
