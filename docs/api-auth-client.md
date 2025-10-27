# API 認証（クライアント向け）

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

推奨の優先順（安全 → 利便性の順）
1. サーバーサイド（会話セッション）や httpOnly セッションクッキーを利用する（ブラウザ）
   - httpOnly, Secure, SameSite 属性を付与して XSS による盗難リスクを低減する。
2. モバイルアプリは OS 提供の安全ストレージ（Keychain/Keystore）を利用する。
3. SPA の場合は、リフレッシュトークンを httpOnly cookie に置き、アクセストークンのみメモリに保持する（LocalStorage への永続保存は XSS に弱いため避ける）。

もしクライアント要件でローカルストレージに保存する場合は、XSS 対策（Content Security Policy、ライブラリの最小化、入力サニタイズ等）を強化してください。

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

Fetch の例:

```js
const res = await fetch('/api/workspaces', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

Axios の例:

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

以下はよくあるパターンの簡易実装例です（概念コード）。

```js
let isRefreshing = false;
let refreshPromise = null;

axios.interceptors.response.use(
  r => r,
  async error => {
    const originalReq = error.config;
    if (error.response && error.response.status === 401 && !originalReq._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = axios.post('/api/entrance/auth/refresh', { refreshToken: getRefreshToken() })
          .then(res => {
            const { accessToken, refreshToken } = res.data;
            setAccessToken(accessToken);
            setRefreshToken(refreshToken);
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
    }

    return Promise.reject(error);
  }
);
```

このパターンでは、同時に多数のリクエストが 401 を返しても、1 回だけリフレッシュ API を呼び出し、他はその完了を待ちます。

## ログアウト（取り消し）

- クライアントはログアウト時にサーバーへリフレッシュトークンの取り消しを依頼し、サーバーは Redis 等で該当トークンを削除・JTI をブラックリスト化する実装になっています。
- クライアント側でも localStorage/cookie にあるトークンを完全に削除してください。

## トークン取り消し（サーバー側での一括無効化）

- 管理者操作やセキュリティ事故対応では、サーバーはユーザーに紐づく全リフレッシュトークンを無効化できます（`refresh_user:{userId}` に格納されているトークンを全て削除し、対応する JTI をブラックリストに入れる等）。クライアントはサーバーからの 401/403 を検知してセッション終了等を行ってください。

## エラーハンドリング要件

- リフレッシュ失敗時は必ずクライアント側でトークンを削除して再ログインに誘導すること。
- トークン取得や認証系の API 呼び出しでは、ユーザーに対して具体的かつ安全なエラーメッセージを表示する（例: "セッションの有効期限が切れました。再ログインしてください。"）。内部エラーの詳細は表示しないこと。

## セキュリティ考慮

- XSS 対策を最優先にする。アクセストークン／リフレッシュトークンが JavaScript から読めるストレージにある場合、XSS により漏洩するリスクを負う。
- CSRF: リフレッシュトークンをクッキー経由で送る設計にする場合は CSRF 対策（SameSite/CSRF トークンなど）を実装する。別案として、リフレッシュはリクエストボディにトークンを入れて行うことで CSRF リスクを軽減できる。
- トークンはログに出力しない。エラー時もトークンの断片を含めない。

## 実装チェックリスト（クライアント）

- [ ] アクセストークンを Authorization: Bearer ヘッダで送っている
- [ ] アクセストークンの失効時に自動でリフレッシュして再実行する仕組みがある
- [ ] リフレッシュ処理は同時並行を考慮し、二重送信を避けている
- [ ] リフレッシュ失敗時にセッションを破棄してログイン画面へ誘導する
- [ ] トークンを安全に保管している（httpOnly cookie / Keychain 等）
- [ ] トークンをログに出力していない

---

現場に合わせてさらに具体的な実装（例: React + axios フルサンプル、service worker でのキャッシュ制御など）を追加できます。要望があれば、使用中のフロント技術スタック（React/Vue/Angular/ネイティブ等）を教えてください。