# フロントエンドの要求経路とセッション

## 概要

Coati の Next.js フロントエンドでは、認証が必要な画面の要求を Proxy が入口で振り分け、ページデータ取得とセッション処理はサーバー側の Server Components、Server Actions、Route Handlers が担います。ブラウザー Cookie に保持するのはセッション識別子だけで、認証トークンやセッション情報は Redis に置きます。通常の JSON API 呼び出し、ファイルを中継する Route Handler、SignalR のリアルタイム接続はそれぞれ異なる経路です。([Proxy](../../pecus.Frontend/src/proxy.ts)、[ServerSessionManager](../../pecus.Frontend/src/libs/serverSession.ts)、[Hey API client とファイル用 Axios](../../pecus.Frontend/src/connectors/HeyApiClient.ts)、[SignalR Provider](../../pecus.Frontend/src/providers/SignalRProvider.tsx))

このページでは、画面描画時の API 呼び出しから Redis セッション、ログイン／更新／ログアウト、バイナリ用 Route Handler、ブラウザーから WebApi への SignalR 接続までを説明します。Cookie や認証トークンの実値は掲載しません。

## SSR-first画面データ取得

認証済みのダッシュボード画面は Server Component がサーバー上でデータを取得し、取得結果を Client Component に props として渡す構成です。ダッシュボードのページは `force-dynamic` を指定し、複数の統計 API を `Promise.allSettled` で並列に呼び出します。失敗した取得は該当データを `null` にし、個別にログへ記録して、他の取得結果とともに `DashboardClient` に渡します。([ダッシュボードのページ](../../pecus.Frontend/src/app/%28dashboard%29/page.tsx))

認証済みレイアウトも Server Component で、プロフィール設定・現在ユーザー情報を API から取得して Client 側のヘッダー等へ渡します。この取得で 401 を検出した場合はサインイン画面へリダイレクトし、それ以外のエラーは既定値を使ってログに記録します。ページとレイアウトは API エラーの扱いが同一ではなく、各呼び出し側が画面要件に応じて処理します。([認証済みレイアウト](../../pecus.Frontend/src/app/%28dashboard%29/layout.tsx)、[HTTP エラー分類](../../pecus.Frontend/src/libs/apiError.ts))

Next.js Proxy は画面要求の前段にありますが、保護されたページに付与するキャッシュ無効化ヘッダーとログイン画面への振り分けを行う層です。SSR データの取得や Redis 参照を Proxy 内で行う設計ではありません。([Proxy](../../pecus.Frontend/src/proxy.ts))

Next.js 設定では Server Actions の body size limit を 50 MB にし、許可 Origin を環境変数（未指定時は localhost）から構成しています。これは Server Action の要求条件であり、画像・添付・export の取得を Server Action に集約する意味ではありません。([Next.js 設定](../../pecus.Frontend/next.config.ts)、[ファイル Route Handler](../../pecus.Frontend/src/app/api/workspaces/%5Bid%5D/items/%5BitemId%5D/attachments/%5BfileName%5D/route.ts))

## Cookie sessionIdとRedisセッション

Proxy は保護対象のパスで Cookie に `sessionId` が存在するかを確認します。存在しない要求は `/signin` にリダイレクトし、存在する要求は続行させます。ここで確認するのは識別子の有無だけで、Redis 内のセッションの存在やトークンの有効性を Proxy が検証することはありません。`/signin` などの公開パスは通過し、パスワード設定・リセットのパスでは Cookie があれば削除して画面を表示します。また、Proxy の matcher は `/api`、静的アセット等を除外します。([Proxy](../../pecus.Frontend/src/proxy.ts))

Cookie と Redis の対応付け、およびフロントエンド側のセッション状態・トークン期限の確認は `ServerSessionManager` が受け持ちます。`getSession()` は Cookie の識別子をキーに Redis を参照し、セッションが見つかった場合は最終アクセス時刻を更新して非アクティブ TTL を設定し直します。Redis に該当データがなければ `null` を返します。通常のセッション作成ではリフレッシュ期限を基準に TTL を決め、最大 30 日に制限します。Cookie は `httpOnly`、本番時 `secure`、`sameSite: lax` として設定されます。([ServerSessionManager](../../pecus.Frontend/src/libs/serverSession.ts))

Redis クライアントは `ioredis` を使うシングルトンです。接続先は Aspire または Docker 向け環境変数から取得し、接続情報そのものは本文に含めません。開発環境ではホットリロード時にグローバル領域へインスタンスを保持します。([Redis クライアント](../../pecus.Frontend/src/libs/redis.ts)、[環境変数アクセス層](../../pecus.Frontend/src/libs/env.ts))

この責務分担で「トークン検証」は一つの処理を指すわけではありません。Proxy は Cookie の存在だけを確認し、Next.js 内のセッション参照、記録されたアクセストークン期限の判定と更新は `ServerSessionManager` が行います。一方、保護された WebApi エンドポイントに送られる認証情報の受理・拒否は WebApi の認証ミドルウェアと `[Authorize]` が担います。([Proxy](../../pecus.Frontend/src/proxy.ts)、[ServerSessionManager](../../pecus.Frontend/src/libs/serverSession.ts)、[WebApi パイプラインと Hub マッピング](../../pecus.WebApi/Program.cs)、[RefreshController](../../pecus.WebApi/Controllers/Entrance/RefreshController.cs))

## ログイン・更新・ログアウト

**ログイン**は Server Action `login()` から始まります。入力をスキーマで検証し、リクエストヘッダーから取得できるクライアント IP と端末情報を添えて Hey API 経由で WebApi のログイン API を呼び出します。WebApi の公開ログインエンドポイントは利用者を認証し、アクセストークンとリフレッシュトークンを含む応答を返します。([ログイン Server Action](../../pecus.Frontend/src/actions/auth.ts)、[Hey API ログイン呼び出し](../../pecus.Frontend/src/connectors/HeyApiClient.ts)、[WebApi ログインコントローラー](../../pecus.WebApi/Controllers/Entrance/EntranceAuthController.cs))

Action は応答のトークン・期限・利用者・端末情報を `ServerSessionManager.createSession()` に渡し、Redis にセッションを保存します。ブラウザー Cookie に設定されるのは生成した `sessionId` だけです。Action の成功応答には画面で使うロールとランディング先を含め、セッションのトークン値は成功データとして返しません。([ログイン Server Action](../../pecus.Frontend/src/actions/auth.ts)、[セッション作成](../../pecus.Frontend/src/libs/serverSession.ts))

**アクセストークンの期限更新**は API 呼び出しに使う `getAccessToken()` から `getValidAccessToken()` を経て実行されます。セッション中の期限まで 5 分を切ると `ServerSessionManager` は WebApi の refresh エンドポイントへサーバー間リクエストを送り、成功した新しいトークン情報で Redis のセッションを更新します。同一プロセス内で同一セッションの更新が並行した場合は、進行中の Promise を共有して重複更新を抑えます。WebApi 側ではリフレッシュトークンを検証して旧トークンを失効させ、新しいトークンを発行します。更新 API が非成功ステータスを返した場合、フロントエンドはセッションを破棄します。([期限判定・更新処理](../../pecus.Frontend/src/libs/serverSession.ts)、[API client のトークン取得](../../pecus.Frontend/src/connectors/auth.ts)、[WebApi refresh エンドポイント](../../pecus.WebApi/Controllers/Entrance/RefreshController.cs))

**ログアウト**では Server Action が現在の Redis セッションを取得し、アクセストークンがある場合に WebApi の logout エンドポイントへ失効要求を送ります。その後 `destroySession()` が Redis エントリーと Cookie を削除し、Action は `/signin` へリダイレクトします。WebApi への呼び出しで例外が発生してもローカルのセッション削除は続行します。コードはその呼び出しの HTTP ステータスを判定せず、ネットワーク例外を捕捉した場合も削除処理に進みます。WebApi 側の logout はアクセストークンを `[Authorize]` で要求し、現在のトークンと要求に含まれるリフレッシュトークンを無効化します。([ログアウト Server Action](../../pecus.Frontend/src/actions/auth.ts)、[セッション破棄](../../pecus.Frontend/src/libs/serverSession.ts)、[WebApi logout エンドポイント](../../pecus.WebApi/Controllers/Entrance/RefreshController.cs))

## server-side API clientと例外経路

Hey API wrapper の `createHeyApiClient()` は WebApi のサーバー向け base URL、`withCredentials`、`throwOnError` を設定し、`auth` callback から `getAccessToken()` が返すアクセストークンを供給します。各ラッパー関数は生成された Hey API 関数を呼び、成功時は応答データを取り出します。`throwOnError: true` のため API エラーは wrapper 内で一律に画面遷移へ変換されず、呼び出し側へ例外として渡されます。([Hey API wrapper](../../pecus.Frontend/src/connectors/HeyApiClient.ts)、[トークン取得 Action](../../pecus.Frontend/src/connectors/auth.ts)、[生成 client の初期化](../../pecus.Frontend/src/connectors/hey-api-axios/client.gen.ts))

例外を画面表示にどう変換するかは利用箇所の責務です。共通の `handleServerFetch()` は 401 をサインインへのリダイレクト、403 を権限エラーの結果、404 を Next.js の `notFound()`、その他をフェッチエラーの結果にします。Server Action 向け `handleApiErrorForAction()` は業務上扱う 4xx を `ApiResponse` に分類し、5xx は詳細を隠して既定メッセージを返します。Route Handler の `parseRouterError()` は同様の HTTP エラー分類を JSON の HTTP レスポンスに写します。一方、ダッシュボードのように `Promise.allSettled` で個別失敗を処理する箇所もあります。([Server Component 向け fetch 処理](../../pecus.Frontend/src/libs/serverFetch.ts)、[Server Action 向けエラー処理](../../pecus.Frontend/src/actions/apiErrorPolicy.ts)、[Route Handler 向けエラー処理](../../pecus.Frontend/src/app/api/routerError.ts)、[ダッシュボードのページ](../../pecus.Frontend/src/app/%28dashboard%29/page.tsx))

この通常の API wrapper と、ファイル・バイナリを扱う Axios 経路は区別が必要です。`createAuthenticatedAxios()` もサーバー側で同じセッション経由のアクセストークンを取得しますが、別の Axios インスタンスを作り、各 Route Handler が `arraybuffer` 等で取得した本文と必要なレスポンスヘッダーをブラウザーへ中継します。([Hey API wrapper と認証付き Axios](../../pecus.Frontend/src/connectors/HeyApiClient.ts))

## Route Handlerとブラウザー直結通信

Next.js Route Handler は、ブラウザーが WebApi のファイル API を直接呼び出す代わりに、フロントエンドサーバーが認証を付与して中継する用途にも使われています。たとえば画像 Route Handler はファイル種別とリソース ID を検証し、WebApi の downloads API から画像バイト列を取得して Content-Type とキャッシュヘッダーを付けて返します。([画像 Route Handler](../../pecus.Frontend/src/app/api/images/%5BfileType%5D/%5BresourceId%5D/%5BfileName%5D/route.ts))

添付ファイル Route Handler はバックエンドからバイト列を取得し、`download=true` の場合にはダウンロード用 Content-Disposition を設定します。インライン表示では Content-Type とプライベートキャッシュヘッダーを返します。アイテムの export Route Handler は形式を Markdown、HTML、JSON に限定し、バックエンドの export 結果と Content-Disposition を中継します。このようなファイル経路は、JSON API を呼ぶ Hey API wrapper の応答処理とは別に扱われます。([添付ファイル Route Handler](../../pecus.Frontend/src/app/api/workspaces/%5Bid%5D/items/%5BitemId%5D/attachments/%5BfileName%5D/route.ts)、[export Route Handler](../../pecus.Frontend/src/app/api/workspaces/%5Bid%5D/items/%5BitemId%5D/export/%5Bformat%5D/route.ts)、[認証付き Axios](../../pecus.Frontend/src/connectors/HeyApiClient.ts))

SignalR は上記の Route Handler を経由しません。認証済みレイアウトが Client 側の `SignalRProvider` を配置し、ブラウザー内で SignalR 接続を構築します。接続 URL は Server Action `getSignalRHubUrl()` が公開 API URL から作り、接続時の `accessTokenFactory` は別の Server Action `getSignalRToken()` を呼び出して有効なアクセストークンを取得します。つまり Hub 通信はブラウザーから公開 WebApi へ直接行われ、SignalR 用 Server Action は接続 URL と認証情報の供給を担います。Hub の WebApi 内パスは `/hubs/notifications` で、公開 API URL に `/backend` のようなベースパスが含まれる環境ではその配下の URL が生成されます。([認証済みレイアウト](../../pecus.Frontend/src/app/%28dashboard%29/layout.tsx)、[SignalR Provider](../../pecus.Frontend/src/providers/SignalRProvider.tsx)、[SignalR 用 Server Actions](../../pecus.Frontend/src/actions/signalr.ts)、[公開 API URL の取得](../../pecus.Frontend/src/libs/env.ts)、[WebApi Hub マッピング](../../pecus.WebApi/Program.cs))

WebApi は `/hubs/notifications` に Hub をマップし、Hub は `[Authorize]` により認証を要求します。接続後はサーバー側でユーザー等のグループへ参加させ、ブラウザー側は通知イベントを受け取ります。SignalR 用の再接続設定も Client 側 Provider が行います。([WebApi Hub マッピング](../../pecus.WebApi/Program.cs)、[NotificationHub](../../pecus.WebApi/Hubs/NotificationHub.cs)、[SignalR Provider](../../pecus.Frontend/src/providers/SignalRProvider.tsx))

## 要求経路図

```text
ページ要求
  └─ Next.js Proxy
       ├─ 公開パス・対象外アセット → 通過
       ├─ sessionId なし           → /signin へ
       └─ sessionId あり           → 通過（ここでは Redis / token を検証しない）
            └─ Server Component / Server Action
                 ├─ ServerSessionManager → Cookie の sessionId → Redis セッション
                 │    └─ 必要なら WebApi refresh → Redis の token/期限を更新
                 └─ Hey API wrapper → WebApi 通常 API → SSR 用データ

ブラウザーのファイル要求
  └─ Next.js Route Handler → 認証付き Axios → WebApi ファイル API
       └─ 画像 / 添付 / export のレスポンスをブラウザーへ中継

ブラウザーのリアルタイム要求
  └─ SignalRProvider → 公開 WebApi の /hubs/notifications
       └─ accessTokenFactory が Server Action から有効な token を取得
```

ページ要求の認証入口とセッション参照は Proxy と `ServerSessionManager` に分かれ、API データ取得・ファイル中継・SignalR は別の通信経路になります。([Proxy](../../pecus.Frontend/src/proxy.ts)、[ServerSessionManager](../../pecus.Frontend/src/libs/serverSession.ts)、[Hey API wrapper](../../pecus.Frontend/src/connectors/HeyApiClient.ts)、[ファイル Route Handler](../../pecus.Frontend/src/app/api/images/%5BfileType%5D/%5BresourceId%5D/%5BfileName%5D/route.ts)、[SignalR Provider](../../pecus.Frontend/src/providers/SignalRProvider.tsx))

## 主なコード実体

| 役割 | 実装 |
| --- | --- |
| ページ要求の振り分け | [Next.js Proxy](../../pecus.Frontend/src/proxy.ts) |
| Redis セッション・期限更新 | [ServerSessionManager](../../pecus.Frontend/src/libs/serverSession.ts)、[Redis client](../../pecus.Frontend/src/libs/redis.ts) |
| ログイン・ログアウト | [認証 Server Actions](../../pecus.Frontend/src/actions/auth.ts) |
| JSON API と認証付き Axios | [Hey API wrapper](../../pecus.Frontend/src/connectors/HeyApiClient.ts) |
| API 例外の分類 | [Server Fetch](../../pecus.Frontend/src/libs/serverFetch.ts)、[Action error policy](../../pecus.Frontend/src/actions/apiErrorPolicy.ts)、[Router error](../../pecus.Frontend/src/app/api/routerError.ts) |
| ファイル中継 | [画像](../../pecus.Frontend/src/app/api/images/%5BfileType%5D/%5BresourceId%5D/%5BfileName%5D/route.ts)、[添付](../../pecus.Frontend/src/app/api/workspaces/%5Bid%5D/items/%5BitemId%5D/attachments/%5BfileName%5D/route.ts)、[export](../../pecus.Frontend/src/app/api/workspaces/%5Bid%5D/items/%5BitemId%5D/export/%5Bformat%5D/route.ts) |
| SignalR の公開接続 | [SignalR Provider](../../pecus.Frontend/src/providers/SignalRProvider.tsx)、[SignalR Server Actions](../../pecus.Frontend/src/actions/signalr.ts)、[WebApi Hub](../../pecus.WebApi/Hubs/NotificationHub.cs) |
| ランタイム・依存関係 | [Next.js 設定](../../pecus.Frontend/next.config.ts)、[Frontend package 定義](../../pecus.Frontend/package.json) |

Frontend の依存定義には Next.js、Redis 用 `ioredis`、ファイル中継用 `axios`、ブラウザー SignalR 用 `@microsoft/signalr` が含まれます。([Frontend package 定義](../../pecus.Frontend/package.json))

## 関連ページ

- [システム概要](./00-system-overview.md)
- [Web API・認証・公開契約](./02-webapi-boundary-security.md)
- [SignalR・プレゼンス・チャット通知](./05-realtime-chat-notifications.md)
- [共有 Lexical エディターと変換 gRPC](./08-editor-lexical-pipeline.md)

最終確認日: 2026-10-12
