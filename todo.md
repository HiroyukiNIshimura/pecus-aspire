## tsup（rollup.js）のTypescript6対応漏れ。
https://github.com/egoist/tsup/issues/1389
現状、patch-package で npm パッケージにパッチを当てる形で対応している。

## OpenAPI 3.0 nullableスキーマの生成形式変更
Microsoft.AspNetCore.OpenApi 10.0.12 への更新後、OpenAPI 3.0固定でもnullableの表現が変わり、生成TypeScript型から `| null` が欠落するケースが発生。3.1向けの変更が3.0出力にも影響した可能性があるため、当面様子見し、必要に応じて上流Issueや修正版を確認する。
調査ではOpenAPI 3.1 + Orval/Hey API（https://www.npmjs.com/package/@hey-api/openapi-ts）で `| null` の生成を確認。Hey APIは有力だが、現行TypeScript 7環境で生成時エラーが出るため、移行は保留。
メソッド名を制御するため サーバー側でoperationIdを設定することが推奨される。
operationIdを整備すると現行の openapi-typescript-codegen でも生成メソッド名が変わるため、移行方針を決めるまでは共通スキーマへ追加しない。必要なら移行用スキーマだけで検証する。