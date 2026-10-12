# ローカル開発・設定・API／型生成

## 概要

このページでは、.NET solution と npm workspaces の境界、Aspire のローカル資源宣言、開発時の設定生成、Frontend の生成スクリプト、共有エディターのビルド経路をまとめます。[`.NET solution`](../../pecus.sln) と [`package.json` の workspaces](../../package.json) は別のプロジェクト管理単位であり、OpenAPI client、409 型、ヘルプ検索用 index、editor distribution は、それぞれの入力 source から作られる成果物です。

## .NET solution と npm workspaces

[`pecus.sln`](../../pecus.sln) には `pecus.AppHost`、`pecus.ServiceDefaults`、`pecus.WebApi`、`pecus.BackFire`、`pecus.Libs`、`pecus.DbManager` が登録されています。一方、root [`package.json`](../../package.json) の npm workspaces は `packages/*`、`pecus.Frontend`、`pecus.LexicalConverter` を対象にします。したがって Frontend と Node.js の Lexical Converter は npm workspace 側、上記の C# projects は .NET solution 側で管理されます。

`packages/coati-editor` は `@coati/editor` という package として定義され、Frontend と Lexical Converter の双方が npm dependency として参照します。[Frontend manifest](../../pecus.Frontend/package.json) と [Lexical Converter manifest](../../pecus.LexicalConverter/package.json) は参照名を `@coati/editor` とし、editor manifest は公開 entry point を `dist` 配下に指定しています。Frontend の [`HelpContent`](../../pecus.Frontend/src/components/help/HelpContent.tsx) は package の editor exports と stylesheet export を利用します。workspace dependency の宣言とビルド済み `dist` の生成は別の段階です。[editor manifest](../../packages/coati-editor/package.json)

## Aspire によるローカル起動準備

`pecus.AppHost` は PostgreSQL と `pecusdb`、Backend 用 Redis、Frontend 用 Redis、Lexical Converter、DbManager、BackFire、WebApi、Frontend をローカル実行資源として宣言します。[AppHost の資源登録](../../pecus.AppHost/AppHost.cs) では、DbManager は DB と Converter を参照し両方を待機し、BackFire は Backend Redis・DB・Converter を参照して待機します。WebApi は DB・Backend Redis・Converter を参照し、DbManager と BackFire の待機も宣言します。Frontend は WebApi と Frontend Redis を参照し、起動前にそれらを待ちます。これは AppHost に記述された開発時の参照・起動順であり、本番配置の定義ではありません。

設定生成スクリプト [`generate-appsettings.js`](../../scripts/generate-appsettings.js) は `config/settings.base.json` を読み、指定された環境の override があれば `config/settings.base.<env>.json` をマージし、続いてプロセス環境変数による override を適用します。設定値はここでは掲載しません。開発用 `-D` は base と dev override を入力に使うモードです。

開発用の生成先は `pecus.AppHost/appsettings.json`、`pecus.WebApi/appsettings.json`、`pecus.BackFire/appsettings.json`、`pecus.DbManager/appsettings.json` と `pecus.Frontend/.env.local` です。AppHost は生成された設定の `Infrastructure` と `Folders` を読み、resource の指定や開発用データパスの組み立てに使います。[generator の入出力処理](../../scripts/generate-appsettings.js) [AppHost の設定読込・resource setup](../../pecus.AppHost/AppHost.cs)

## Frontend の predev / prebuild

Frontend の `predev` は競合型生成、ヘルプ検索 index 生成、開発用設定生成の順に実行し、その後の `dev` が Next.js 開発サーバーを起動します。`prebuild` は競合型とヘルプ検索 index の生成を行いますが、設定生成は含みません。これらは [`pecus.Frontend/package.json`](../../pecus.Frontend/package.json) に宣言された lifecycle scripts です。

- **競合型:** [`generate-conflict-types.js`](../../pecus.Frontend/scripts/generate-conflict-types.js) は `.spec/open-api-scheme.json` を読み、409 Conflict response の schema から `src/connectors/ConflictDataTypes.generated.ts` を生成します。型は [`concurrencyError.ts`](../../pecus.Frontend/src/libs/concurrencyError.ts) の競合エラー処理から参照されています。
- **ヘルプ検索 index:** [`generate-help-index.ts`](../../pecus.Frontend/scripts/generate-help-index.ts) は `src/content/help/ja/` の Markdown 記事を読み、検索用の情報を `src/content/help/search-index.json` に書き出します。この JSON は source 記事ではなく生成物です。[`src/app/help/layout.tsx`](../../pecus.Frontend/src/app/help/layout.tsx) が読み込み、[`HelpSearch`](../../pecus.Frontend/src/components/help/HelpSearch.tsx) と [`search.ts`](../../pecus.Frontend/src/libs/help/search.ts) が検索に使います。

## OpenAPI から Hey API Axios client へ

API client の生成は `predev`／`prebuild` に含まれず、Frontend manifest の個別 scripts で行います。WebApi は開発環境で OpenAPI document を公開し、`download:api` がその document を `.spec/open-api-scheme.json` に保存します。`hey:gen-client` はその download の後、Hey API CLI に Axios client を指定して `src/connectors/hey-api-axios/` へ生成します。[WebApi OpenAPI setup](../../pecus.WebApi/Program.cs) [Frontend scripts](../../pecus.Frontend/package.json)

生成 directory の扱いは開発ワークフローの規則です。[Hey API instructions](../../.github/instructions/hey-api.instructions.md) は `hey-api-axios` を自動生成専用とし、生成物を手編集しないこと、手書きの互換処理を生成先の外に置くことを定めています。手書きの [`HeyApiClient.ts`](../../pecus.Frontend/src/connectors/HeyApiClient.ts) は生成 client を import し、server-only の client wrapper を提供します。Frontend の [Server Action module](../../pecus.Frontend/src/actions/workspace.ts) はこの wrapper を使う側です。つまり、OpenAPI schema と生成 client を直接手で同期するのではなく、生成後の wrapper と Server Actions を手書き側の境界として扱います。

## Lexical version 同期と editor build

[`update-lexical-version.js`](../../scripts/update-lexical-version.js) は root overrides、`packages/coati-editor`、Frontend、Lexical Converter の各 manifest にある `lexical`／`@lexical/*` dependency version を一括更新します。`--install` は root と各 workspace directory で install を実行する任意の処理です。`--build` を指定した場合は install も有効になり、最後に `packages/coati-editor` の build を実行します。このスクリプトは依存更新のための開発用補助であり、アプリ起動時の処理ではありません。

editor の build script は `tsup` による JavaScript／CSS bundle 生成の後、[`build-dts.mjs`](../../packages/coati-editor/scripts/build-dts.mjs) を呼び出します。[`tsup.config.ts`](../../packages/coati-editor/tsup.config.ts) は entry point と module format を定義し、`build-dts.mjs` は TypeScript declaration を一時領域へ出力した後、API Extractor で各 entry point の declaration を `dist` に roll up します。[editor package manifest](../../packages/coati-editor/package.json) の exports はこの `dist` を参照します。`dist` は build artifact であり、手書き source や設計根拠として扱うものではありません。

## source → generator → artifact → consumer

各経路は入力と利用側が異なります。下図の artifact は生成・build の出力であり、編集対象の source ではありません。

```text
WebApi の OpenAPI document
  → Frontend download / Hey API generation
  → .spec/open-api-scheme.json → src/connectors/hey-api-axios/
  → HeyApiClient.ts → Server Actions

.spec/open-api-scheme.json
  → generate-conflict-types.js
  → ConflictDataTypes.generated.ts
  → libs/concurrencyError.ts

src/content/help/ja/*.md
  → generate-help-index.ts
  → src/content/help/search-index.json
  → app/help/layout.tsx → HelpSearch / help search

packages/coati-editor/src
  → tsup + build-dts.mjs
  → packages/coati-editor/dist
  → Frontend / Lexical Converter (@coati/editor)
```

API の生成経路は [WebApi OpenAPI setup](../../pecus.WebApi/Program.cs)、[Frontend manifest](../../pecus.Frontend/package.json)、[Hey API instructions](../../.github/instructions/hey-api.instructions.md)、[HeyApiClient wrapper](../../pecus.Frontend/src/connectors/HeyApiClient.ts)、[Server Action](../../pecus.Frontend/src/actions/workspace.ts) で確認できます。競合型とヘルプ検索の各経路は、それぞれの [競合型 generator](../../pecus.Frontend/scripts/generate-conflict-types.js) と [consumer](../../pecus.Frontend/src/libs/concurrencyError.ts)、[help index generator](../../pecus.Frontend/scripts/generate-help-index.ts) と [layout consumer](../../pecus.Frontend/src/app/help/layout.tsx) が示します。editor の build と consumer の境界は [tsup config](../../packages/coati-editor/tsup.config.ts)、[declaration build script](../../packages/coati-editor/scripts/build-dts.mjs)、[package manifest](../../packages/coati-editor/package.json)、[Frontend consumer](../../pecus.Frontend/src/components/help/HelpContent.tsx)、[Lexical Converter manifest](../../pecus.LexicalConverter/package.json) に記述されています。

## 関連資料

- [設定ファイル管理](../config-management.md) — 生成設定の役割と管理方針。
- [SSR 設計ガイドライン](../ssr-design-guidelines.md) — Frontend server-side code の設計背景。
- [共有 editor package の利用例](../../pecus.Frontend/src/components/help/HelpContent.tsx) — Frontend から `@coati/editor` を参照する実例。

---

最終確認日: 2026-10-12
