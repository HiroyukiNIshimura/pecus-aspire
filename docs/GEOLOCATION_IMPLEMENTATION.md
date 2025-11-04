# Nominatim API を使用した位置情報取得

このドキュメントは、フロントエンドアプリケーションに実装された Nominatim OpenStreetMap API を使用した位置情報取得機能について説明します。

## 概要

`getLocationFromCoordinates()` サーバーアクションは、緯度経度から Nominatim OpenStreetMap API を使用して詳細な位置情報（国、都道府県、市区町村、郵便番号など）を取得します。

この機能は **ログイン時のデバイス情報取得** に統合されており、ユーザーのログイン位置を記録するために使用されます。

## ファイル構成

### 1. `src/actions/geolocation.ts` (新規作成)

Server Action としてサーバーサイドで実行される位置情報取得ロジック。

**主な機能:**
- `getLocationFromCoordinates(latitude, longitude)`: 単一座標から位置情報を取得
- `getLocationsFromCoordinates(coordinates)`: 複数座標から一括で位置情報を取得

**レスポンス型:**
```typescript
interface LocationInfo {
  displayName: string;        // OpenStreetMap 表示名（例: "東みよし町, 三好郡, 徳島県, 779-4402, 日本"）
  country: string;            // 国名
  countryCode: string;        // 国コード（例: "jp"）
  province?: string;          // 都道府県
  county?: string;            // 郡
  town?: string;              // 町村
  postcode?: string;          // 郵便番号
  osm: {
    type: string;             // OSM オブジェクトタイプ
    id: number;               // OSM ID
  };
}
```

### 2. `src/utils/deviceInfo.ts` (修正)

ブラウザのデバイス情報を取得するユーティリティ関数。

**変更点:**
- `getLocationFromCoordinates()` を使用して Nominatim API から詳細な位置情報を取得
- 従来の簡易的な地域推定 (`getApproximateLocation()`) はフォールバックとして使用
- Nominatim API が失敗した場合は自動的にフォールバック処理

**フロー:**
```
1. ブラウザの Geolocation API で位置情報取得（緯度経度）
   ↓
2. Server Action (getLocationFromCoordinates) で Nominatim API 呼び出し
   ↓
3. 成功 → Nominatim から返された詳細な地域名を使用
   失敗 → フォールバック: getApproximateLocation() で簡易地域推定
   ↓
4. deviceInfo に location フィールドで返す
```

### 3. `src/app/(entrance)/signin/LoginFormClient.tsx` (既存)

ログインフォーム。`getDeviceInfo()` を呼び出してデバイス情報を取得し、ログイン API に送信。

## 使用方法

### クライアント側（ブラウザ内）

```typescript
import { getDeviceInfo } from "@/utils/deviceInfo";

// ログイン画面やその他の処理で呼び出し
const deviceInfo = await getDeviceInfo();

console.log(deviceInfo.location);
// 例: "東みよし町, 三好郡, 徳島県, 779-4402, 日本"
```

### Server Action として直接使用

```typescript
import { getLocationFromCoordinates } from "@/actions/geolocation";

// Server Action コンポーネント内
const result = await getLocationFromCoordinates(34.0, 135.0);

if (result.success && result.data) {
  console.log(result.data.displayName);
} else {
  console.log("エラー:", result.error);
}
```

## API 仕様

### Nominatim OpenStreetMap API

- **エンドポイント**: `https://nominatim.openstreetmap.org/reverse`
- **メソッド**: GET
- **パラメータ**:
  - `format=json`: JSON フォーマット
  - `lat=<緯度>`: 緯度
  - `lon=<経度>`: 経度

### レスポンス例

```json
{
  "place_id": 249075070,
  "osm_type": "way",
  "osm_id": 155945748,
  "lat": "33.9962830",
  "lon": "133.9980850",
  "display_name": "東みよし町, 三好郡, 徳島県, 779-4402, 日本",
  "address": {
    "town": "東みよし町",
    "county": "三好郡",
    "province": "徳島県",
    "ISO3166-2-lvl4": "JP-36",
    "postcode": "779-4402",
    "country": "日本",
    "country_code": "jp"
  },
  "boundingbox": ["33.9944690", "33.9962890", "133.9973430", "134.0004120"]
}
```

## エラーハンドリング

実装にはいくつかのエラーハンドリング機構があります：

### 1. 入力値検証
- 緯度が -90 ～ 90 の範囲内か確認
- 経度が -180 ～ 180 の範囲内か確認

### 2. API タイムアウト
- 5 秒のタイムアウト設定
- タイムアウト時はエラーメッセージを返す

### 3. ネットワークエラー
- HTTP エラー（4xx, 5xx）時のハンドリング
- JSON パース失敗時のハンドリング

### 4. フォールバック処理
- Nominatim API 失敗時は簡易的な地域推定に自動フォールバック
- ブラウザの Geolocation API が失敗した場合は location は null のまま

## 利用規約とレート制限

Nominatim OpenStreetMap API を使用する際は、以下の点に注意してください：

- **User-Agent ヘッダー**: 必須です。実装では `"pecus-aspire-location-service/1.0"` を指定しています
- **レート制限**: 1 秒あたり約 1 リクエストが推奨
- **複数座標**: `getLocationsFromCoordinates()` では最大 50 件までの制限を設定

参考: https://nominatim.org/usage_policy.html

## セキュリティ考慮事項

- **Server Action での実行**: クライアント側で直接 Nominatim API を呼び出さず、Server Action を経由
- **Rate Limiting**: 複数座標取得の際は 50 件の上限を設定
- **タイムアウト**: 5 秒のタイムアウトでリソース枯渇を防止
- **エラーメッセージ**: ユーザーに最小限の情報のみ公開

## トラブルシューティング

### 位置情報が取得できない場合

1. **ブラウザの位置情報許可確認**
   - ブラウザが位置情報へのアクセス許可を求めているか確認
   - ページをリロードして再度許可を確認

2. **タイムアウト**
   - ネットワーク接続を確認
   - Nominatim API のステータスを確認

3. **フォールバック処理**
   - Nominatim API に失敗した場合、自動的に簡易的な地域推定に フォールバック

### デバッグ方法

ブラウザの開発者ツール（F12）でコンソールを開き、以下のコマンドで実行:

```javascript
// 位置情報取得テスト
const info = await (await import('/path/to/utils/deviceInfo.js')).getDeviceInfo();
console.log(info.location);
```

## 技術スタック

- **フロントエンド**: Next.js 14+ (React 19+)
- **ユーティリティ**: TypeScript
- **外部 API**: Nominatim OpenStreetMap
- **認証**: JWT Bearer Token（ログインサーバーアクション経由）

## 実装の流れ（ログイン時）

```
ユーザーがログインフォーム送信
  ↓
LoginFormClient で getDeviceInfo() 呼び出し
  ↓
Geolocation API で緯度経度取得
  ↓
Server Action (getLocationFromCoordinates) で Nominatim API 呼び出し
  ↓
DetailedLocation (またはフォールバック) を返す
  ↓
login() Server Action で WebApi に送信
  ↓
ログイン処理完了、デバイス情報とともに記録
```

## 今後の拡張案

- キャッシング: 同じ座標への複数リクエストをキャッシュ
- 逆ジオコーディング: 地名から座標を取得
- 住所の更新: ログイン後の移動を追跡して定期的に更新
- オフライン対応: キャッシュされた地域情報を使用

