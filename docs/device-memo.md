# デバイス管理設計メモ（概要） — Pecus Aspire

目的
- WebApi の認証で「どの端末からログインしているか」をユーザーが識別・管理できるようにするための設計メモ。実装前の検討用ドキュメント。

要点（結論）
- Device は「クライアント実行インスタンス」を表す。物理端末そのものではない。
- クライアント側で生成する永続 UUID（DeviceIdentifier）を用い、DB にはハッシュ値と表示用メタデータを保存する。
- ユーザー向け UI では Name / OS / Client / 最終利用時刻 / おおまかな場所 を表示し、ユーザーが削除（リボーク）できるようにする。削除操作は再認証を必須にする。

収集・保存する項目（推奨）
- PublicId: 表示用短ID（例: GUID 短縮版、ユーザーに見せる）
- HashedIdentifier: クライアント生成の UUID をサーバーでハッシュ化して保存（照合用）
- Name: ユーザーが任意で付ける表示名（nullable）
- DeviceType: Browser / MobileApp / DesktopApp
- OS: Windows / macOS / Linux / iOS / Android（簡潔表記）
- Client: 簡略化した User-Agent（例: "Chrome 118"）
- AppVersion: ネイティブアプリがあれば
- FirstSeenAt / LastSeenAt (UTC)
- LastIpMasked: 表示用にマスクしたIP（例: 203.0.113.xxx）
- LastSeenLocation: GeoIP の概算（国/都市、nullable）
- Timezone: クライアントから提供されるタイムゾーン（表示調整用）
- RefreshTokenCount: 当該デバイスに紐づく有効リフレッシュトークン数（表示用）
- IsRevoked: 端末無効化フラグ

クライアント実装（要約）
- 初回起動で UUID(v4) を生成し、永続化する。
  - ブラウザ: localStorage / IndexedDB（機微: シークレットモードでは消える）
  - SPA ネイティブ: secure store / Keychain / Keystore を推奨
- API 呼び出し時に X-Device-Id ヘッダ または リクエストボディ deviceMeta を付与。
- 生の DeviceIdentifier をログ出力しない。サーバー側でハッシュ化する。

クライアント例（ブラウザ）
```javascript
// 参考: クライアント側での生成と送信（説明用）
function getDeviceId() {
  const key = 'pecus:device_id';
  let id = localStorage.getItem(key);
  if (id) return id;
  id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : fallbackUuid();
  localStorage.setItem(key, id);
  return id;
}

fetch('/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Device-Id': getDeviceId()
  },
  body: JSON.stringify({ refreshToken: '...', deviceMeta: { os: navigator.platform, client: navigator.userAgent } })
});
```

サーバー側（受信と保存ルール）
- 受け取った DeviceIdentifier をそのまま保存しない。PBKDF2/HMAC-SHA256 等でハッシュ（salt と pepper を検討）して保存する。
- ハッシュ値と UserId の組をユニークにする（同一ユーザーで重複登録を防ぐ）。
- 新規デバイスは自動的に作成、既存デバイスは LastSeenAt 等を更新する。
- RefreshToken には DeviceId を紐づけ、端末単位でトークンを一括無効化可能にする。

UI の表示設計（ユーザーが削除できるように）
- 一覧に次を表示：
  - 表示名（Name があれば優先）、PublicId（短縮）
  - OS • Client（例: macOS • Safari）
  - 最終利用日時（ユーザー現地時刻で表示）
  - おおまかな場所（国名 / 都市、optional）
  - 現在の端末かどうかのバッジ（X-Device-Id と照合）
  - 「サインアウト（リボーク）」ボタン（押下で再認証を要求）
- 「分からない端末」は強調表示し、削除前にパスワード再入力 or 2FA を必須にする。

プライバシーとセキュリティ
- 生 ID をログ／公開 API に出さない（表示は PublicId やマスクした IP のみ）。
- IP はマスクして表示（ラストオクテット隠し等）。
- GeoIP は目安として表示し、断定的な文言は避ける。
- 端末削除は再認証必須。管理画面からの一括ログアウト機能を用意（現在端末除外オプションを推奨）。

Redis キー（選択肢）
- 既存設計を拡張して、ユーザー単位集合をデバイス単位でも追跡する場合：
  - device:{publicId} => string(JSON) TTL 長め（メタのキャッシュ用途）
  - user_devices:{userId} => set(publicId)
- ただし真の永続データは Postgres（EF Core）で管理し、Redis は短期のキャッシュ／ブラックリスト連携用に留める。

マイグレーション / 実装チェックリスト（検討時）
- pecus.Libs: Device エンティティ定義（上で挙げたカラム）を追加。RefreshToken に DeviceId を追加。
- pecus.DbManager: EF マイグレーションを生成・適用。
- pecus.WebApi: DTO（Create/Update Device、Get Devices）、コントローラとサービスを追加。
- フロント: DeviceId の生成/保存・送信実装（localStorage / secure store）。
- ドキュメント: プライバシー方針、ユーザー向け説明文言、サポート運用手順を更新。

参考モデル（例、概念スニペット）
```csharp
// Device の概念モデル（説明用, 実装は pecus.Libs に追加）
public class Device
{
    public int Id { get; set; }
    public required string PublicId { get; set; }           // 表示用
    public required string HashedIdentifier { get; set; }  // ハッシュで保存
    public string? Name { get; set; }
    public int UserId { get; set; }
    public DateTime FirstSeenAt { get; set; }
    public DateTime LastSeenAt { get; set; }
    public string? LastIpMasked { get; set; }
    public string? Client { get; set; }    // 簡易 UA
    public string? Os { get; set; }
    public bool IsRevoked { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
```

短期の推奨実施順（検討フェーズ→実装フェーズ）
1. 本ドキュメントで要求項目を確定（表示項目／プライバシー要件）
2. pecus.Libs にモデル草案を追加 → 設計レビュー
3. pecus.DbManager でマイグレーション生成（レビュー後）
4. pecus.WebApi 側で最低限の API（一覧・名前変更・リボーク・一括リボーク）を実装
5. フロントで DeviceId 生成・送信を実装し、UI をベータ公開して挙動確認

検討したい点（決定事項として要確認）
- PublicId をユーザーに見せるフォーマット（短縮 GUID など）
- HashedIdentifier のハッシュ方式と salt/pepper 運用ルール
- GeoIP をどこまで表示するか（国レベル推奨）
- 再認証要件（パスワード or 2FA）とその適用範囲

---

検討したい項目があれば優先順位を指定してください。実装用の README や API 仕様（OpenAPI のスキーマ追加案）に落とし込むパッチを作成します。