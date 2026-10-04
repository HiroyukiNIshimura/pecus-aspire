# 開発者向け生成処理とリポジトリ支援

> 本ページは、2026-10-04時点のmanifest、スクリプト、Agent／Skill定義から確認した開発者向け作業経路をまとめる。設定ファイルや生成物の内容は扱わず、生成・保守処理をCoatiの実行時機能と区別する。

## 概要

このリポジトリには、npm workspace単位の開発コマンド、環境設定やAPI型の生成、ヘルプ検索用索引の作成、共有Editorのbuild、画像・依存バージョンの保守スクリプト、作業を補助するCopilot Agent／Skillがある。これらは開発者がコマンドを実行したり、対象タスクを明示してAgent／Skillを利用したりすると動く。アプリのサービスが起動した後にこれら一式を実行する仕組みではない。

## 1. npm workspaceとパッケージスクリプト

ルートのworkspaceは `packages/*`、`pecus.Frontend`、`pecus.LexicalConverter` を登録する。`packages/coati-editor` はそのworkspace配下にある共有パッケージである。ルートmanifestには依存更新確認・更新のscriptがあり、個別のbuildやlint等は各package manifestに置かれている。

- FrontendはNext.jsのdev／buildのほか、OpenAPIクライアント、409型、ヘルプ索引の生成scriptを持つ。
- LexicalConverterはTypeScript build、dev build後の起動、lint／check系scriptを持つ。
- `@coati/editor` は `tsup` によるbundle作成と型宣言の生成をbuildで行い、複数のentry pointをpackage exportsとして公開する。

これらはnpmから開発者が呼び出すコマンドであり、manifest上の `start` や `dev` は各サービスの起動コマンドである。どのサービスをどう接続して起動するかはそれぞれの実行構成に属し、ここで扱う生成scriptとは別の関心事である。

根拠: [ルートpackage manifest](../../package.json)、[Frontend package manifest](../../pecus.Frontend/package.json)、[LexicalConverter package manifest](../../pecus.LexicalConverter/package.json)、[coati-editor package manifest](../../packages/coati-editor/package.json)、[型宣言生成script](../../packages/coati-editor/scripts/build-dts.mjs)。

## 2. 設定ファイルの生成

開発者が `generate-appsettings.js` を実行すると、スクリプトはbase設定を読み、`-D`／`-P`または`--env`で選択された環境overrideがあれば再帰的にマージし、対応する環境変数で値を上書きしてから出力を組み立てる。優先関係は **base → 選択したoverride → 環境変数** である。ここでは設定の実値や設定ファイル本体を開かず、構造・出力先だけを示す。

主な出力先は `pecus.AppHost/appsettings.json`、`pecus.WebApi/appsettings.json`、`pecus.BackFire/appsettings.json`、`pecus.DbManager/appsettings.json`、`pecus.Frontend/.env.local`。production選択時には `deploy/.env` も生成する。Frontend向けの環境ファイルは単体開発時のfallback等に使う生成物としてスクリプト内で扱われており、設定値を手編集する対象ではない。

Frontendの `predev` はこのスクリプトを開発設定で呼ぶ一方、`prebuild` は呼ばない。手動実行とFrontendのlifecycle hookを、アプリの起動時設定読込と混同しないこと。

根拠: [設定生成script](../../scripts/generate-appsettings.js)、[Frontendのlifecycle scripts](../../pecus.Frontend/package.json)。

## 3. OpenAPIからFrontendクライアントと409型を生成

API契約を更新する開発者向けの `full:api` は、概ね次の順に処理する。

1. 稼働中Web APIからOpenAPI文書をFrontend内の作業用spec領域へ取得する。
2. 既存のservice client出力を削除し、OpenAPI generatorでAxiosベースのservice群を生成する。
3. 取得済みOpenAPI文書から409 Conflict応答の `current` 型を抽出し、競合データ型を生成する。
4. 生成serviceファイル群を走査し、利用しやすいclient instanceとOpenAPI設定関数を含むwrapperを生成する。

`generate:api` 内の順序は、既存出力のclean → OpenAPI client生成 → 409型生成。`full:api` はその後にwrapper生成を続ける。409型scriptはOpenAPI文書中の409 responseとschemaを解析し、wrapper生成scriptはserviceファイル名からclient構成を作る。生成されたservice群、409型、wrapperは自動生成物であり、手編集しない。

これとは別に、Frontendの手書き `PecusApiClient.ts` は生成物を接続する層である。base URL解決とaccess token取得を生成wrapperへ渡し、生成clientとAxiosのエラーを処理する関数を提供する。409型の生成は契約を表す型を用意し、手書き層は通信時のエラー検出・変換を担う、という境界で読む。

根拠: [Frontend package manifest（`full:api`／各生成script）](../../pecus.Frontend/package.json)、[service wrapper生成script](../../pecus.Frontend/scripts/generate-pecus-api-client.js)、[409型生成script](../../pecus.Frontend/scripts/generate-conflict-types.js)、[手書きAPI接続層](../../pecus.Frontend/src/connectors/api/PecusApiClient.ts)。

## 4. `predev`／`prebuild`とヘルプ検索索引

npmのlifecycleにより、Frontendの `dev`／`build` の前処理はそれぞれ次のとおり。

| lifecycle | 前処理の順序 |
|---|---|
| `predev` | 409型生成 → help検索index生成 → API wrapper生成 → 開発用設定生成 |
| `prebuild` | 409型生成 → help検索index生成 → API wrapper生成 |

この前処理は、既存のOpenAPI specやservice clientを使う箇所を含む。`predev`／`prebuild`自体はOpenAPI取得・service client全体の再生成を行わない。契約からの再生成は別途 `full:api` の作業経路である。

help index scriptはFrontendの日本語help Markdownを読み、検索用のtitle／description／plain text／見出し等をまとめたJSONを生成する。出力は `src/content/help/search-index.json`。記事の作成や編集時にこのJSONを直接編集せず、Frontendのpredev／prebuildまたは明示scriptによる生成対象として扱う。

根拠: [Frontend package manifest](../../pecus.Frontend/package.json)、[help index生成script](../../pecus.Frontend/scripts/generate-help-index.ts)。

## 5. Help author Agent／Skillと画像

Help author Agentはユーザーからヘルプ作成・更新を依頼されたときに利用する作業支援であり、実画面・実装を確認して草稿と画面画像を用意する。定義上、画面キャプチャはWebPで `pecus.Frontend/public/help/images/` に保存し、記事Markdownは `pecus.Frontend/src/content/help/ja/` に置く。保存済みWebPを記事から参照する前に実在を確認し、検索indexは直接編集しない。これは人のレビューを前提とした編集ワークフローであり、通常のアプリ表示時に自動で画面を撮影・記事を作る機能ではない。

別の `convert-to-webp.js` はJPEG／JPGをWebPへ変換する単体スクリプトである。入力・任意出力パスはリポジトリルート基準（絶対パスも許容）、出力が既存なら上書きせず失敗し、成功後は既定で元JPEGを削除する。元画像を残す選択肢も用意されているため、実行前に入力・出力を確認する。

根拠: [Help author Agent](../../.github/agents/coati-help-author.agent.md)、[Help author Skill](../../.github/skills/coati-help-author/SKILL.md)、[WebP変換script](../../scripts/convert-to-webp.js)、[help index生成script](../../pecus.Frontend/scripts/generate-help-index.ts)。

## 6. 共有Editor buildと保守・画像生成script

### 共有Editor

`packages/coati-editor` のbuildはbundle作成後、型宣言生成scriptを実行する。型scriptは一時出力を作って複数entry pointの型をroll upし、完了後に一時ディレクトリを削除する。FrontendとLexicalConverterが同じworkspace packageを依存先として利用する。Editorの変更後にpackage buildを行う手順であり、アプリ実行時にbundleを再生成するものではない。

根拠: [coati-editor package manifest](../../packages/coati-editor/package.json)、[型宣言生成script](../../packages/coati-editor/scripts/build-dts.mjs)、[Frontend manifest](../../pecus.Frontend/package.json)、[LexicalConverter manifest](../../pecus.LexicalConverter/package.json)。

### Lexical version updater

開発者が `update-lexical-version.js` を起動し、指定versionを渡すと、root、Editor、Frontend、LexicalConverterの各manifestにあるLexical系依存／overrideを更新する。任意オプションではnpm依存の更新確認・更新、各workspaceでのinstall、Editor buildも実行できる。更新対象はpackage manifestと選択されたinstall/build工程であり、アプリの起動時処理ではない。

### WebP、achievement badge、Bot icon

`convert-to-webp.js` は前節のとおりJPEGからWebPへの変換用。`generate-achievement-badges.js` と `generate-bot-icons.js` は開発者が個別に起動し、任意で対象コードを絞って画像生成サービスへ依頼する資材scriptである。通常実行時は必要な認証情報を環境から受け取り、生成したPNGとWebPを `scripts/images/` に保存する。既存PNGがあれば通常生成ではスキップする。dry-runは外部生成を行わず、既存PNGがある場合はWebP変換のみ行う。画像のprompt、認証値、外部endpointは本ページに複製しない。

以上は手動実行を起点とする保守・資材生成であり、ユーザーがachievementを獲得したりBotを利用したりするアプリ実行時の処理とは異なる。

根拠: [Lexical version updater](../../scripts/update-lexical-version.js)、[WebP変換script](../../scripts/convert-to-webp.js)、[achievement badge生成script](../../scripts/generate-achievement-badges.js)、[Bot icon生成script](../../scripts/generate-bot-icons.js)。

## 7. Repository instructions、Agent、Skillの利用モデル

リポジトリ内の支援定義は、アプリのサービス構成ではなく開発作業の規約と手順である。

- ルートのCopilot指示は全体共通の優先ルールを示し、適用対象に応じたinstructionsが領域固有の差分を定める。`AGENTS.md` はinstructionsとskillsの役割を案内し、関連作業ではSkillを確認するよう促す。
- Agent定義は担当作業、利用可能ツール、呼び出し可否などを宣言する。Help author Agentはユーザーから明示的に依頼できる。コードベース解説は親Agentがページ単位の執筆Agentへ担当を委譲する設計で、担当Agentは割り当てられた1ページを扱う。
- Skillは特定作業の手順・安全境界を提供する。Help author、Lexical変換、Markdown送信など、依頼内容に合うSkillを読み、その手順に沿って作業する。Skillの説明やAgentの存在は、アプリ内の自動処理を意味しない。

根拠: [Copilot共通指示](../../.github/copilot-instructions.md)、[AGENTS.md](../../AGENTS.md)、[Skill一覧](../../.github/skills/README.md)、[Help author Agent](../../.github/agents/coati-help-author.agent.md)、[コードベース解説親Agent](../../.github/agents/codebase-docs-ja.agent.md)、[コードベース解説ページAgent](../../.github/agents/codebase-docs-page-ja.agent.md)、[コードベース構成案Agent](../../.github/agents/codebase-docs-outline-ja.agent.md)。

## 8. Markdown submitは個別の外部送信

Markdown submit Skillと付属scriptは、利用者がMarkdownをCoati外部APIへ送信する作業を明示的に依頼した場合の支援手順である。scriptはsubjectと、ファイルまたは本文、workspace／owner識別情報、認証設定を入力としてHTTP POSTを行い、成功・失敗の応答を出力する。通常のFrontend→WebApiリクエスト経路や画面表示の副作用ではなく、外部へ内容を送る独立した操作である。

このページでは送信先URL、送信本文、認証値を掲載しない。送信は自動起動せず、対象本文と送信先を利用者が明示して実行する作業として扱う。秘密情報は環境変数またはsecret managerで管理し、ログや会話へ表示しない。

根拠: [Markdown submit Skill](../../.github/skills/coati-markdown-submit/SKILL.md)、[送信script](../../.github/skills/coati-markdown-submit/scripts/submit-markdown.js)。

## 9. CI／テスト自動化の調査範囲と限界

今回、ルート・Frontend・LexicalConverter・Editorのpackage manifestに宣言されたscriptと、標準的なCI配置（`.github/workflows/`、Jenkinsfile、Azure Pipelines、GitLab CI、CircleCI）のファイル名を確認した。確認したmanifest内には専用のtest scriptはなく、標準配置候補にも該当ファイルは見つからなかった。`deploy/ops/smoke-test.sh` は稼働中slotのHTTP到達性／healthを調べる運用補助scriptで、単体テストsuiteやCI定義とは別である。

この確認はリポジトリ内の上記候補とmanifestに限る。外部CIサービスの設定、リポジトリ外のworkflow、別形式の自動化、実行環境での手動検証の有無までは確認できず、CIが存在しないとは断定しない。

根拠: [ルートpackage manifest](../../package.json)、[Frontend package manifest](../../pecus.Frontend/package.json)、[LexicalConverter package manifest](../../pecus.LexicalConverter/package.json)、[coati-editor package manifest](../../packages/coati-editor/package.json)、[運用smoke-test script](../../deploy/ops/smoke-test.sh)、[Copilot共通指示](../../.github/copilot-instructions.md)。

## 主なコード実体

| 領域 | 主な実体 |
|---|---|
| workspace／package scripts | [root](../../package.json)、[Frontend](../../pecus.Frontend/package.json)、[LexicalConverter](../../pecus.LexicalConverter/package.json)、[coati-editor](../../packages/coati-editor/package.json) |
| 設定・API・help index生成 | [generate-appsettings.js](../../scripts/generate-appsettings.js)、[generate-pecus-api-client.js](../../pecus.Frontend/scripts/generate-pecus-api-client.js)、[generate-conflict-types.js](../../pecus.Frontend/scripts/generate-conflict-types.js)、[generate-help-index.ts](../../pecus.Frontend/scripts/generate-help-index.ts) |
| Editor／保守／画像 | [build-dts.mjs](../../packages/coati-editor/scripts/build-dts.mjs)、[update-lexical-version.js](../../scripts/update-lexical-version.js)、[convert-to-webp.js](../../scripts/convert-to-webp.js)、[generate-achievement-badges.js](../../scripts/generate-achievement-badges.js)、[generate-bot-icons.js](../../scripts/generate-bot-icons.js) |
| Repo支援・外部送信 | [共通Copilot指示](../../.github/copilot-instructions.md)、[Help author Agent](../../.github/agents/coati-help-author.agent.md)、[Help author Skill](../../.github/skills/coati-help-author/SKILL.md)、[Markdown submit Skill](../../.github/skills/coati-markdown-submit/SKILL.md) |

## 関連ページ

- [実行時システムの境界と起動トポロジー](system-topology.md)
- [Frontendのリクエストとセッション](frontend-request-flow.md)
- [Web APIの契約・認証・エラー境界](webapi-contracts-security.md)
- [共有エディターとLexical変換](rich-content-pipeline.md)
- [ヘルス・メトリクス・可観測性](observability.md)
- [配布・デプロイ・復旧運用](deployment-operations.md)