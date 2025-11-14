# API 認証（クライアント向け）

本リポのフロントエンド方針（最重要・要約）
- ブラウザ向け`pecus.Frontend`では、アクセストークン/リフレッシュトークンはクッキー（httpOnly: false）に保存します（`src/middleware.ts`準拠、LocalStorage/SessionStorageは不使用）。
- SSR では Middleware が期限前に自動リフレッシュし、CSR では Axios インターセプターが必要時にリフレッシュします。
- Server Actions/API Routes では `cookies()`/`SessionManager` からクッキーを取得し、`createPecusApiClients()`が Authorization を付与します。

このドキュメントは、本システムの API を利用するクライアント実装者向けに、認証トークン（アクセストークン／リフレッシュトークン）の扱い方、保管方法、リフレッシュの運用、エラーハンドリング、及び実装例を日本語でまとめたものです。

## 概要

- サーバーは短時間有効のアクセストークン（JWT）と長期間有効なリフレッシュトークンを組み合わせて認証を行います。
- アクセストークンは API リクエストの Authorization ヘッダに `Bearer <access_token>` として送信します。
- リフレッシュトークンはアクセストークン失効時に新しいアクセストークンを発行するために使用します（リフレッシュエンドポイントへ送信）。
- サーバー側ではリフレッシュトークンや JTI（JWT の一意識別子）を Redis に記録／追跡し、取り消し（ブラックリスト）を可能にしています。

> 注: 正確なエンドポイント名（ログイン/リフレッシュ/ログアウト）はプロジェクトの API ドキュメントを参照してください。以下の例では概念的に `/api/entrance/auth/login`、`/api/entrance/auth/refresh`、`/api/entrance/auth/logout` を使用しています。

## トークンの種類と役割

- アクセストークン（短期間有効、例: 数分〜数時間）
  - API への各リクエストで使用する。署名付き JWT で、ペイロードにユーザー ID 等が含まれる。
  - 盗難・漏洩リスクを減らすため寿命は短めに設定されています。

- リフレッシュトークン（長期間有効、例: 数日〜数十日）
  - アクセストークンが期限切れになったときに、新しいアクセストークンを取得するために使用します。
  - サーバーはリフレッシュトークンを Redis 等で管理し、取り消しや一括無効化を可能にしています（安全対策）。

## トークンの保管（推奨）

- セキュリティが最優先です。保存方法はクライアントの種類（ブラウザ SPA / モバイル / サーバーサイド）ごとに異なります。

ブラウザ（本リポの`pecus.Frontend`）
- クッキーで保存（`httpOnly: false`, `sameSite: 'strict'`, `secure: 本番のみ true`）。
- クライアントJS（Axios インターセプター）がクッキーからトークンを参照し、必要時に付与・更新します。

その他クライアントの指針
- モバイルアプリ: OSのセキュアストレージ（Keychain/Keystore）を使用。
- サーバー間連携: 環境変数/シークレットマネージャで安全に管理。

## ログイン（認証）

- クライアントはユーザー認証情報をサーバーへ送信してログインし、アクセストークンとリフレッシュトークンを受け取ります。
- 受け取ったら上記保管方針に従って保存します。

curl 例（概念）:

```bash
curl -X POST https://api.example.com/api/entrance/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret"}'
```

成功時のサーバー応答（例）:

```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "...",
  "expiresIn": 3600
}
```

## API リクエスト方法

- すべての保護された API は Authorization ヘッダにアクセストークンを付与して呼び出します。
- SSR/Server Actions/API Routes では `createPecusApiClients()` が付与、CSR では Axios が付与します。

Fetch の例（概念・サーバー側実装時）:

```js
const res = await fetch('/api/workspaces', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

Axios の例（概念・サーバー側実装時）:

```js
axios.get('/api/workspaces', {
  headers: { Authorization: `Bearer ${accessToken}` }
});
```

## アクセストークン期限切れの扱い（リフレッシュ戦略）

- 401 (Unauthorized) が返ってきた場合、クライアントは次の流れでリフレッシュを試みます：
  1. 既にリフレッシュ中の処理があるか確認。あればその完了を待つ（同時に複数回リフレッシュを送らないため）。
  2. リフレッシュトークンをリフレッシュエンドポイントに送り、新しいアクセストークン（と必要に応じて新しいリフレッシュトークン）を受け取る。
  3. 取得成功で元のリクエストを再実行する。
  4. 失敗（リフレッシュトークン無効等）であればログアウトフローを実行してクライアント側のトークンを削除し、ログイン画面へ誘導する。

重要な注意点：リフレッシュ処理は原則サーバー側で「リフレッシュトークンの回転（rotation）」や JTI 登録/ブラックリストなどのセキュリティロジックを行います。クライアントはサーバーの仕様に従って実装してください。

### axios インターセプタの実装例（シングル・リフレッシュ実行）

以下はよくあるパターンの簡易実装例です（概念コード）。本リポのブラウザUIでは CSR 時はクッキーから取得、SSR 時は Middleware による事前リフレッシュを前提に動作します。

```js
let isRefreshing = false;
let refreshPromise = null;

axios.interceptors.response.use(
  r => r,
  async error => {
    const originalReq = error.config;
    if (error.response && error.response.status === 401 && !originalReq._retry) {
  禁止: ブラウザからの WebApi 直 `fetch`、および SSR/Server Actions からの WebApi 直 `fetch`。例外として「リフレッシュ API 呼び出し」は循環回避のため `fetch` 直呼び出しを許可します。
          .then(res => {
            const { accessToken, refreshToken } = res.data;
  - SSR/Server Actions での WebApi 直 `fetch` は禁止です（`createPecusApiClients()` を使用）。
  - ブラウザから WebApi を直 `fetch` するのも禁止です（Server Actions または API Routes を経由）。
            return accessToken;
          })
          .finally(() => { isRefreshing = false; });
      }

      const newAccessToken = await refreshPromise;
      if (!newAccessToken) {
        // refresh 失敗 -> ログアウト
        logoutAndRedirect();
        return Promise.reject(error);
      }

      originalReq._retry = true;
      originalReq.headers['Authorization'] = `Bearer ${getAccessToken()}`;
      return axios(originalReq);
          // インターセプター循環を避けるため、ここは fetch を使用（例外的に直呼び出し可）
          refreshPromise = fetch('/api/entrance/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: getRefreshToken() })
          })
            .then(async (res) => {
              if (!res.ok) return null;
              const data = await res.json();
              const { accessToken, refreshToken } = data;
              setAccessToken(accessToken);
              setRefreshToken(refreshToken);
              return accessToken;
            })
            .finally(() => { isRefreshing = false; });

## ログアウト（取り消し）

- クライアントはログアウト時にサーバーへリフレッシュトークンの取り消しを依頼し、サーバーは Redis 等で該当トークンを削除・JTI をブラックリスト化します。
- ブラウザUIではサーバー側/ミドルウェアでクッキーを削除します（localStorage は未使用）。

## トークン取り消し（サーバー側での一括無効化）

- 管理者操作やセキュリティ事故対応では、サーバーはユーザーに紐づく全リフレッシュトークンを無効化できます（`refresh_user:{userId}` に格納されているトークンを全て削除し、対応する JTI をブラックリストに入れる等）。クライアントはサーバーからの 401/403 を検知してセッション終了等を行ってください。

## エラーハンドリング要件

- リフレッシュ失敗時は必ずクライアント側でトークンを削除して再ログインに誘導すること。
- トークン取得や認証系の API 呼び出しでは、ユーザーに対して具体的かつ安全なエラーメッセージを表示する（例: "セッションの有効期限が切れました。再ログインしてください。"）。内部エラーの詳細は表示しないこと。

## セキュリティ考慮

- XSS 対策を最優先にする。アクセストークン／リフレッシュトークンが JavaScript から読めるストレージにある場合、XSS により漏洩するリスクを負う。
- CSRF: リフレッシュトークンをクッキー経由で送る設計にする場合は CSRF 対策（SameSite/CSRF トークンなど）を実装する。別案として、リフレッシュはリクエストボディにトークンを入れて行うことで CSRF リスクを軽減できる。
- トークンはログに出力しない。エラー時もトークンの断片を含めない。

- [ ] アクセストークンを Authorization: Bearer ヘッダで送っている
- [ ] アクセストークンの失効時に自動でリフレッシュして再実行する仕組みがある
- [ ] リフレッシュ処理は同時並行を考慮し、二重送信を避けている
- [ ] リフレッシュ失敗時にセッションを破棄してログイン画面へ誘導する
- [ ] トークンを安全に保管している（ブラウザは Cookie（httpOnly: false, sameSite: 'strict'）／モバイルはKeychain等）
- [ ] SSR は Middleware により期限前リフレッシュ、CSR は Axios により401時リフレッシュ
- [ ] トークンをログに出力していない

---

現場に合わせてさらに具体的な実装（例: React + axios フルサンプル、service worker でのキャッシュ制御など）を追加できます。要望があれば、使用中のフロント技術スタック（React/Vue/Angular/ネイティブ等）を教えてください。