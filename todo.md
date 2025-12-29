## Coati

* 各種メール通知機能  送信処理[x] テンプレート[x]
  [x] テスト

**開発環境では以下のエンドポイントでデザイン確認可能**
https://localhost:7265/
GET /api/dev/email-preview/index	テンプレート一覧をHTMLで表示（ブラウザ用インデックスページ）

### [x] アイテムへのファイル添付機能（すっかり忘れてた😅）

* [] Tooltip対応 title\s*=\s*(?:"[^"]*"|'[^']*'|\{[\s\S]*?\}) docs/ui-hint-components.md → スマフォ考えるとボタンにもやってくのは微妙

### 組織設定

### ユーザー設定

## エディタ

## AI

## タスク

## ジョブ

## マイクロサービス

## その他

* [] Aspire 13.1.0へのアプデ→まだEF周りがついてきてない
* [x] ログレベルの切り替え方式変更。※いまいちなので後で見直す
* [] デモ環境用のシードデータ投入

## バグ

### 本番環境

Frontエンドの.envを作ってないバグ。
エージェントが理解しないので今日はもうやめ。
ビルド通らないからといってダミーセットし始めたやつ
# Build-time dummy values for SSR pages that check env vars
# These are only used during build, not at runtime
ENV ConnectionStrings__redisFrontend="localhost:6379"
ENV PECUS_API_URL="http://localhost:5000"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-dummy-secret"

   ▲ Next.js 16.0.10

   - Local:         http://localhost:3000⁠

   - Network:       http://0.0.0.0:3000⁠


 ✓ Starting...

 ✓ Ready in 42ms

[Middleware] SessionId found: bc7bd655..., allowing access

 ⨯ Error: 環境変数 ConnectionStrings__redisFrontend が設定されていません

    at module evaluation (build/server/chunks/ssr/_719d23a0._.js:139:86377)

    at instantiateModule (build/server/chunks/ssr/[turbopack]_runtime.js:715:9)

    at getOrInstantiateModuleFromParent (build/server/chunks/ssr/[turbopack]_runtime.js:738:12)

    at Context.esmImport [as i] (build/server/chunks/ssr/[turbopack]_runtime.js:228:20)

    at module evaluation (build/server/chunks/ssr/_1db09255._.js:2:9273)

    at instantiateModule (build/server/chunks/ssr/[turbopack]_runtime.js:715:9)

    at getOrInstantiateModuleFromParent (build/server/chunks/ssr/[turbopack]_runtime.js:738:12)

    at Context.esmImport [as i] (build/server/chunks/ssr/[turbopack]_runtime.js:228:20)

    at module evaluation (build/server/chunks/ssr/[root-of-the-server]__5347848c._.js:1:19759)

    at instantiateModule (build/server/chunks/ssr/[turbopack]_runtime.js:715:9)

 ⨯ Error: 環境変数 ConnectionStrings__redisFrontend が設定されていません

    at module evaluation (build/server/chunks/ssr/_719d23a0._.js:139:86377)

    at instantiateModule (build/server/chunks/ssr/[turbopack]_runtime.js:715:9)

    at getOrInstantiateModuleFromParent (build/server/chunks/ssr/[turbopack]_runtime.js:738:12)

    at Context.esmImport [as i] (build/server/chunks/ssr/[turbopack]_runtime.js:228:20)

    at module evaluation (build/server/chunks/ssr/_1db09255._.js:2:9273)

    at instantiateModule (build/server/chunks/ssr/[turbopack]_runtime.js:715:9)

    at getOrInstantiateModuleFromParent (build/server/chunks/ssr/[turbopack]_runtime.js:738:12)

    at Context.esmImport [as i] (build/server/chunks/ssr/[turbopack]_runtime.js:228:20)

    at module evaluation (build/server/chunks/ssr/[root-of-the-server]__5347848c._.js:1:19759)

    at instantiateModule (build/server/chunks/ssr/[turbopack]_runtime.js:715:9)