## tsup の TypeScript 6/7 対応状況を確認する。
https://github.com/egoist/tsup/issues/1389
Rollup は tsup の内部依存として使用されている。現在のビルドは成功しているが、TypeScript 6/7 対応状況と、現行バージョンでの対応要否を確認する。

## Hey API の TypeScript 7 対応後に安定版へ切り替える。
現在は `@hey-api/openapi-ts` の `@next` 相当のプレリリース版を使用している。TypeScript 7 に対応した安定版が公開されたら、安定版へ更新して生成クライアントを再生成する。
