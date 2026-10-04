# Coati コードベース解説

Coati（開発コード `pecus`）の現行実装を、サービス境界から機能処理、開発・運用経路へ順にたどる開発者向け解説です。本文はコード、プロジェクト定義、Compose、スクリプト等を確認して作成しています。初回作成時の最終確認日は **2026-10-04** です。設計意図や仕様を定める文書ではなく、コードから確認できない動作は本文で未確認として扱います。

## 読み進める順

1. [実行時システムの境界と起動トポロジー](system-topology.md) — Aspireの開発時リソース、サービス境界、Redis 2系統、Composeとの違い。
2. [Frontendのリクエストとセッション](frontend-request-flow.md) — Next.jsの画面構成、SSR／Server Actions／API Routes、セッションとSignalR接続。
3. [Web APIの契約・認証・エラー境界](webapi-contracts-security.md) — HTTPパイプライン、JWT／API Key、認可、検証、例外、OpenAPI。
4. [永続化モデルとデータベース初期化](data-model-lifecycle.md) — EF Coreモデル、`xmin`、DbManager、migration、seed、pgroongaとファイル保存。
5. [ワークスペース・アイテム・タスクの業務フロー](workspace-workflows.md) — Item／Taskの画面からAPI・DB・検索・添付への経路。
6. [チャット・アジェンダ・リアルタイム通知](collaboration-realtime.md) — チャット／アジェンダの保存とSignalR、Redis Pub/Sub通知の分離。
7. [AI連携とバックグラウンドジョブ](ai-background-jobs.md) — AI client、Bot、Hangfire enqueue、BackFireの定期job。
8. [共有エディターとLexical変換](rich-content-pipeline.md) — `@coati/editor`、Lexical変換gRPC、protoと.NET client。
9. [ヘルス・メトリクス・可観測性](observability.md) — health endpoint、OpenTelemetry、Prometheusとtarget同期。
10. [配布・デプロイ・復旧運用](deployment-operations.md) — Compose、Blue/Green、build／deploy PC、migration、backup／restore。
11. [開発者向け生成処理とリポジトリ支援](developer-workflows.md) — 設定・API型・help index・共有パッケージの生成、Agent／Skill。

## 参照上の注意

- 章の順序と担当範囲は [`OUTLINE.md`](OUTLINE.md) に基づきます。構成案は執筆計画であり、現行動作の根拠には本文中のソースリンクを参照してください。
- 本文の未確認事項は、推測で補わずコード上で確かめられなかった範囲を示します。とくに外部API認証の合成、FrontendのログインAction応答、添付・復旧手順、メトリクス更新やジョブ再試行の保証等は該当ページの記述を確認してください。
- 設計意図・履歴・規約については、[仕様書の索引](../spec/INDEX.md)および[ドキュメント全体の索引](../INDEX.md)を参照してください。これらは本解説の現行コード記述とは役割が異なります。
