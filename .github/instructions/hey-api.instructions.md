---
description: "Use when generating, configuring, or migrating the pecus.Frontend Hey API TypeScript client from OpenAPI 3.1, including Axios integration, nullable types, operationId changes, and generated-output handling."
---

# Hey API 指示

## 適用範囲

- 対象スキーマ: `pecus.Frontend/.spec/open-api-scheme.json`
- 生成先: `pecus.Frontend/src/connectors/hey-api-axios/`
- 生成スクリプト: `npm run hey:gen-client`
- 既存クライアント: `pecus.Frontend/src/connectors/api/`

## 生成ルール

- Hey API の生成物は手編集しない。
- `hey-api-axios` は自動生成専用ディレクトリとする。手書きのアダプター、認証処理、エラー処理を配置しない。
- 生成時に出力先ディレクトリ内の既存ファイルが削除されるため、生成前に手書きファイルを置かない。
- 手書きの互換層や認証設定は `src/connectors/backend/` など生成先の外側に配置する。
- OpenAPI スキーマの変更後は、生成物だけでなく nullable 型、レスポンス型、リクエスト型、メソッド名を確認する。

## HTTP クライアント

- このプロジェクトでは Axios を継続利用する。
- Next.js 用 Fetch クライアントである `@hey-api/client-next` へ変更しない。
- 生成時は既存の `axios` 依存を利用する次のオプションを指定する。

```bash
npm run hey:gen-client
```

- `@hey-api/client-axios` は、現在の `@hey-api/openapi-ts@next` と npm の peer dependency 解決が衝突するため、追加インストールしない。
- 生成プラグインは `@hey-api/openapi-ts@next` の CLI で `--client @hey-api/client-axios` として指定する。
- `npm install --force` や `--legacy-peer-deps` で peer dependency の不整合を強制解決しない。

## 移行ルール

- 既存の `src/connectors/api/` を直ちに削除または置換しない。
- 既存の `PecusApiClient.ts` が担う認証、Cookie、409 Conflict、4xx/5xx エラー変換の責務を確認してから互換層を設計する。
- `getAccessToken()` と `withCredentials: true` 相当の挙動を維持する。
- ファイルダウンロードなど既存の Axios helper と重複する機能は、nullable 型移行と同時に変更しない。
- 生成された SDK のエラー戻り値と既存の例外ベースの呼び出し方を比較し、`Server Actions` の利用側を一括変更しない。

## operationId

- 現在の共通スキーマには `operationId` がないため、メソッド名はパス由来になる。
- `operationId` を追加すると、Hey API と現行 `openapi-typescript-codegen` の両方で生成メソッド名が変わる。
- 命名規約と利用箇所の移行方針が確定するまで、共通スキーマへ `operationId` を追加しない。

## 検証

生成後は少なくとも次を実行する。

```bash
cd pecus.Frontend
npm run hey:gen-client
npx tsc --noEmit --pretty false
```

生成物が Axios を使用していること、nullable なプロパティに `null` が含まれること、生成先の外側に手書きファイルがあることを確認する。
