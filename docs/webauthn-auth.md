# WebAuthn（パスキー）認証リファレンス

パスキー認証・リカバリーコード・レート制限の実装仕様をまとめたリファレンスです。
実装の根拠となるコードを併記しているため、変更時はこの文書も更新してください。

## 1. 認証方式の概要

- ログインは **WebAuthn（パスキー）** を基本とする。組織ごとに認証方式を切り替えられる。
- 組織設定は `OrganizationSettings.AuthenticationMode`（`null` は「パスワード + パスキー」）。

| 値 | 意味 |
| --- | --- |
| `Password` | パスワードのみ |
| `WebAuthn` | パスキーのみ |
| `Both`（`null` を含む） | パスワード / パスキーの両方 |

- セッションは Redis（`ServerSessionManager`）で管理し、Cookie には `sessionId` のみを保存する。

## 2. レート制限

実装: [LoginRateLimiter.cs](../pecus.WebApi/Services/LoginRateLimiter.cs)（Redis の `INCR` + `EXPIRE` による**固定ウィンドウ**方式）

### 2.1 制限一覧

| エンドポイント | キー（`auth:ratelimit:` 配下） | 上限 | ウィンドウ |
| --- | --- | --- | --- |
| `POST /api/entrance/webauthn/login-methods` | `methods:{loginId}:{ip}` | 20 回 | 5 分 |
| `POST /api/entrance/webauthn/login/options` | `options:{loginId}:{ip}` | 20 回 | 5 分 |
| `POST /api/entrance/webauthn/login/verify` | `verify:{ip}` | 20 回 | 5 分 |
| `POST /api/entrance/webauthn/register/options` | `register-options:{ip}` | 20 回 | 5 分 |
| `POST /api/entrance/webauthn/register/verify` | `register-verify:{ip}` | 20 回 | 5 分 |
| `POST /api/entrance/recovery/code` | `recovery:{loginId}:{ip}` | **5 回** | **15 分** |

- ログイン ID 部分は小文字化して正規化される。
- パスワードログイン（`POST /api/entrance/login`）には現時点でレート制限がない。

### 2.2 429 になったときの考え方（重要）

- **固定ウィンドウ**のため、期限は「**最初の試行時刻 + ウィンドウ幅**」。最後の試行からではないので、連打しても待ち時間は延びない。
- **成功してもカウントは戻らない**（加算のみ）。上限に達したら、ウィンドウが明けるまで待つ必要がある。
- カウントは「ログイン ID + IP」単位。ブラウザを変えても IP が同じならカウントは共有される。
- ウィンドウが明けるとキーが消え、カウントは 0 に戻る。

### 2.3 残り時間の確認（開発・運用）

バックエンド用 Redis のキーを直接見れば、残り回数と残り秒数が分かる。

```bash
# コンテナ名は Aspire 起動ごとに変わる（redis-xxxx）
RC=$(docker ps --format '{{.Names}}' | grep -E '^redis-' | head -1)
PW=$(docker exec "$RC" printenv REDIS_PASSWORD)

# キー一覧
docker exec "$RC" redis-cli -p 6380 -a "$PW" --no-auth-warning KEYS 'auth:ratelimit:*'

# 残り回数と残り秒数
docker exec "$RC" redis-cli -p 6380 -a "$PW" --no-auth-warning GET 'auth:ratelimit:recovery:<loginId>:<ip>'
docker exec "$RC" redis-cli -p 6380 -a "$PW" --no-auth-warning TTL 'auth:ratelimit:recovery:<loginId>:<ip>'
```

- Aspire の Redis は **TLS ポート 6379** と **非 TLS ポート 6380**（`--requirepass`）で動く。コンテナ内からは 6380 を使う。
- `KEYS` の結果に `:::1` のような IP が付く（IPv6 のループバックは `::1`）。

### 2.4 開発環境で即座に解除する

待たずに試したい場合は、該当キーを削除すればリセットされる（**開発環境のみ**）。

```bash
docker exec "$RC" redis-cli -p 6380 -a "$PW" --no-auth-warning DEL 'auth:ratelimit:recovery:<loginId>:<ip>'
```

## 3. リカバリーコード

実装: [RecoveryCodeService.cs](../pecus.WebApi/Services/RecoveryCodeService.cs)

- **1 回限りの使い捨て**。1 回の発行で **10 個**（`CodeCount = 10`、10 文字を `XXXXX-XXXXX` 形式で表示）。
- DB には平文を保存せず、**HMAC-SHA256 ハッシュのみ**を保存する（鍵は `Pecus:WebAuthn:RecoveryCodePepper`）。
- 平文を返すのは**発行レスポンスの 1 回だけ**。画面を閉じると再表示できない。

### 3.1 発行・消費のルール

| 操作 | 挙動 |
| --- | --- |
| 発行 / 再発行（プロフィール画面） | 既存コードをすべて削除し、新しい 10 個を発行 |
| 管理者リセット（セットアップトークン） | 既存コードをすべて削除し、新しい 10 個を発行 |
| ログイン済みユーザーがパスキーを追加 | コードは発行しない（必要な場合は再発行 API を使う） |
| **リカバリーコードで復旧** | **使用したコードのみ消費**。残りはそのまま有効。**残り 0 のときだけ**新しい 10 個を自動発行 |

- 復旧時は、使用したコードの消費に加えて**全セッションを失効**させる（他端末はログアウト）。
- 残りが 2 個以下になると、プロフィール画面の再発行ボタン横に警告を表示する。
- 「作り直す」操作はログイン後のプロフィール画面（`/profile` → セキュリティ → パスキー）から行う。登録完了画面は未ログイン状態のため、匿名で再発行できる API は用意していない。

### 3.2 未使用件数

- `GET /api/profile/credentials/recovery-codes` → `{ hasUnusedCodes, unusedCodeCount }`
- パスキー登録（セットアップ / リカバリー）のレスポンスにも `unusedRecoveryCodeCount` が入る。
  新規発行した場合は発行数（10）、残りを使い続ける場合はその残数。

## 4. 関連ドキュメント

- [認証アーキテクチャ刷新設計書](./spec/auth-architecture-redesign.md) — セッション方式（Redis + opaque sessionId）の設計
- [frontend-guidelines.md](./frontend-guidelines.md) — 画面実装のルール（モーダル・エラー表示など）
- [global-exception-handling.md](./global-exception-handling.md) — 429（`TooManyRequestsException`）を含む例外の HTTP 変換
