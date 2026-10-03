# フロントエンド

> `pecus.Frontend`の現在のNext.js App Router実装を説明します。SSRを基本としつつ、操作に応じてServer ActionsやNext.js API Routesも使う構成です。

## アプリケーションの構造

共通のRoot Layoutは`src/app/layout.tsx`です。ページ群はApp Routerのroute groupに分かれており、括弧付きのグループ名はURLパスには現れません。

- `(workspace-full)` — ワークスペースやアイテムを中心とする画面
- `(dashboard)` — ダッシュボードや一覧画面
- `(admin-full)` — 管理者向け画面
- `(profile)` — プロフィール設定
- `(entrance)` — サインイン等の入口画面
- `(backoffice-full)` — バックオフィス
- `api/` — Next.js Route Handlers
- `help/` — ヘルプページ

Root LayoutはHTML、共通フッター、フォント、テーマ初期化などを担当します。ルートの個別レイアウトは各route groupの`layout.tsx`を参照してください。

- [Root Layout](../../pecus.Frontend/src/app/layout.tsx)
- [App Routerのページ群](../../pecus.Frontend/src/app/)

## WebApiとのデータ経路

初期描画・更新の処理はひとつの方法に固定されていません。代表的な経路は次の3つです。

| 用途 | 処理経路 | 実装例 |
|---|---|---|
| ページ初期データ | Server Component → APIクライアント → WebApi → props → Client Component | [プロフィールページ](../../pecus.Frontend/src/app/%28profile%29/profile/page.tsx) |
| 更新・サーバー処理 | Client Component等 → Server Action → APIクライアント → WebApi | [認証Server Actions](../../pecus.Frontend/src/actions/auth.ts) |
| クライアントからの動的取得・プロキシ | Client Component → Next.js API Route → APIクライアントまたは認証済みHTTPクライアント → WebApi | [管理ワークスペースAPI Route](../../pecus.Frontend/src/app/api/admin/workspaces/route.ts)、[アイテム詳細API Route](../../pecus.Frontend/src/app/api/workspaces/[id]/items/[itemId]/route.ts) |

たとえばワークスペース一覧ページはSSR初期データを受け取り、Client Componentで検索・追加読み込みを行います。管理スキル一覧は画面内の動的更新にNext.js API Routeを使っています。したがって「すべての読み取りはSSR」などと単純化せず、対象画面の実装を確認してください。

生成済みAPI型・サービスは`src/connectors/api/pecus/`配下にあり、手動編集の対象ではありません。APIクライアントの組み立ては[`PecusApiClient.ts`](../../pecus.Frontend/src/connectors/api/PecusApiClient.ts)を参照してください。

## Server ActionsとAPI Routes

- Server Actionsは`src/actions/`にあり、WebApi呼び出しやサーバー上での処理をまとめます。
- Route Handlersは`src/app/api/`にあり、動的取得やファイルの認証付きプロキシなどを提供します。
- Client ComponentがWebApiを直接呼ぶのではなく、Server ActionまたはNext.js API Routeを経由する実装が基本です。
- API Routeごとに利用するAPIクライアントやエラー変換の形が異なる場合があります。

[`src/actions/README.md`](../../pecus.Frontend/src/actions/README.md)は構成の手掛かりになりますが、実際の現状は個別のAction／Route Handlerを参照してください。

## セッションと認証

ログイン処理はWebApiから受け取ったトークンをFrontend用Redisのセッションとして保存し、ブラウザーCookieには`sessionId`を保存します。トークンそのものはサーバー側のセッションデータとして管理されます。

`src/proxy.ts`は対象ページリクエストで`sessionId` Cookieの有無などを扱いますが、Proxy内でRedisを引いて詳細なセッション検証を行う実装ではありません。`ServerSessionManager`がRedisからセッションを取得し、APIクライアントが必要なトークンを利用します。Matcherから除外されるパスもあるため、認証境界はProxyだけでなく各Route Handler／API呼び出しを含めて確認してください。

- [Proxy](../../pecus.Frontend/src/proxy.ts)
- [ServerSessionManager](../../pecus.Frontend/src/libs/serverSession.ts)
- [Redisクライアント](../../pecus.Frontend/src/libs/redis.ts)
- [ログイン・ログアウトAction](../../pecus.Frontend/src/actions/auth.ts)

## 関連ページ

- [システム構成](./architecture.md)
- [開発構成と設定](./development-and-configuration.md)
- [Frontend開発ガイド](../frontend-guidelines.md)
- [SSR設計ガイド](../ssr-design-guidelines.md)

最終確認日: 2026-10-03
