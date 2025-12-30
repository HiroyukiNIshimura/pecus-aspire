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

Serverアクション
pecus.Frontend/src/connectors/api/PecusApiClient.tsのparseErrorResponseは本来ハンドルできなかったその他のエラーのためのものなのに、エラーをまとめるために改竄されてる。

APIルーター
pecus.Frontend/src/app/api/routerError.tsのparseRouterErrorもエラーをまとめてサーバーエラーにしてしまっている。
折角NextResponseはそういうことができるようになっているのに😭