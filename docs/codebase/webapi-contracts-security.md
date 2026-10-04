# Web APIの契約・認証・エラー境界

> **現行コード確認済み。確認日: 2026-10-04。** 本ページは共通のHTTP/API境界を説明します。個々の業務操作やDBモデル全体には踏み込まず、認可・失効条件は確認できた実装だけを記述します。

## 概要

`pecus.WebApi` はASP.NET CoreのControllerをHTTP入口とし、起動時にDB・サービス・認証・フィルター・OpenAPIを登録します。通常ControllerではJWTを既定の認証schemeとし、認証ユーザーを基底Controllerで取得した後、必要に応じて組織／ワークスペース権限ヘルパーで操作単位のアクセスを確認します。入力検証と例外は共通フィルターでHTTP応答へ変換されます。[`Program.cs`](../../pecus.WebApi/Program.cs) [`BaseSecureController.cs`](../../pecus.WebApi/Controllers/BaseSecureController.cs) [`GlobalExceptionFilter.cs`](../../pecus.WebApi/Filters/GlobalExceptionFilter.cs)

外部APIは別の基底ControllerとAPI Key認証schemeを持ちます。一方、OpenAPIの認証記述は実際のscheme境界を完全には表していない箇所があり、後述の確認事項に注意が必要です。

## 構造とリクエストフロー

### 起動登録とHTTPパイプライン

`Program.cs` はAspire接続名から`ApplicationDbContext`を登録し、ドメインサービス、認証関連サービス、SignalR Hub、バックグラウンドサービスなどをDIへ登録します。認証はJWT Bearerを既定のauthenticate／challenge schemeとし、別schemeとして`ApiKey`も登録します。Controllerには`GlobalExceptionFilter`、`ValidationFilter`、および引数なしのグローバル`AuthorizeFilter`が追加されています。[`Program.cs`](../../pecus.WebApi/Program.cs)

構築後の主な順序は、HTTP logging・HTTPSリダイレクト、開発環境でのCORS、認証、認可、ControllerとHubのマッピングです。OpenAPI JSONとSwagger UIも開発環境でのみマッピングされます。Hubは`/hubs/notifications`に公開され、Hub自身にも`[Authorize]`があります。[`Program.cs`](../../pecus.WebApi/Program.cs) [`NotificationHub.cs`](../../pecus.WebApi/Hubs/NotificationHub.cs)

### JWT、SignalR、API Keyの境界

- **JWT:** `JwtBearerUtil`はユーザーID、組織ID、ロール、権限などのclaimを含むJWTを発行します。起動時のJWT Bearer設定では署名鍵、issuer、audience、有効期間を検証します。トークン検証後にはブラックリスト照会とユーザーの存在・有効状態も確認します。ブラックリストへの登録条件や個別の失効操作の全体像は、このページの対象ソースだけから一般化しません。[`JwtBearerUtil.cs`](../../pecus.WebApi/Libs/JwtBearerUtil.cs) [`Program.cs`](../../pecus.WebApi/Program.cs)
- **SignalR token extraction:** JWT Bearerの`OnMessageReceived`は、リクエストパスが`/hubs`配下の場合に限り、クエリの`access_token`を認証トークンとして取り出します。これはHub接続用の取り出し処理であり、通常のREST API要求のトークン取得方法を置き換えるものではありません。[`Program.cs`](../../pecus.WebApi/Program.cs)
- **API Key:** `ApiKeyAuthenticationHandler`は`X-API-KEY`ヘッダーから値を受け取り、`ExternalApiKeyService`でハッシュ照合します。サービスの検証条件として、失効済みでないことと有効期限内であることが確認できます。キーの発行時に平文を返すのは発行処理のみで、保存モデルにはハッシュが置かれます。本ページではキーや設定値そのものは掲載しません。[`ApiKeyAuthenticationHandler.cs`](../../pecus.WebApi/Authentication/ApiKeyAuthenticationHandler.cs) [`ExternalApiKeyService.cs`](../../pecus.Libs/DB/Services/ExternalApiKeyService.cs) [`ExternalApiKey.cs`](../../pecus.Libs/DB/Models/ExternalApiKey.cs)

### 認証済みユーザーと操作単位の権限

通常APIの`BaseSecureController`は`[Authorize]`を持ち、アクション実行前にJWT principalからユーザーID・組織IDを取得します。その後`ProfileService`からユーザー情報（ロールを含む）を読み、存在と有効状態を確認して`CurrentUserId`、`CurrentOrganizationId`、`CurrentUser`をアクションへ公開します。`RequireAdminRole()`はAdminまたはBackOfficeロールを確認するヘルパーです。[`BaseSecureController.cs`](../../pecus.WebApi/Controllers/BaseSecureController.cs) [`JwtBearerUtil.cs`](../../pecus.WebApi/Libs/JwtBearerUtil.cs)

認証済みであることと、特定ワークスペースで操作できることは別の判定です。`OrganizationAccessHelper`はユーザーの所属組織とワークスペースの組織・有効状態を照合します。編集権限チェックではワークスペースメンバーのロールも確認し、アクセス不可は404、Viewerの編集操作は403にします。たとえば`WorkspaceItemController`は読取時にアクセス可否を、更新時に編集権限を確認してからサービスを呼びます。[`WorkspaceAccessHelper.cs`](../../pecus.WebApi/Libs/WorkspaceAccessHelper.cs) [`WorkspaceItemController.cs`](../../pecus.WebApi/Controllers/WorkspaceItemController.cs)

External API側は`BaseExternalApiController`を継承し、`[Authorize(AuthenticationSchemes = ApiKeyAuthenticationOptions.SchemeName)]`を指定します。アクション前に認証principalのAPI Key ID・組織IDを読み、DBからキーと組織を取得して`CurrentApiKey`等を設定します。`ExternalController`はこれらの組織IDを外部サービス呼び出しへ渡します。サービス内部の全クエリ条件まではここでは説明しません。[`BaseExternalApiController.cs`](../../pecus.WebApi/Controllers/External/BaseExternalApiController.cs) [`ExternalController.cs`](../../pecus.WebApi/Controllers/External/ExternalController.cs) [`ApiKeyAuthenticationOptions`／handler](../../pecus.WebApi/Authentication/ApiKeyAuthenticationHandler.cs)

### 検証と例外からHTTP応答への変換

`ValidationFilter`はModelStateが無効な場合、アクションを実行せず400を返します。応答には共通の`ErrorResponse`としてステータスと検証失敗メッセージを含め、ModelStateのエラーから組み立てた`details`を追加します。Base Controllerには`[ApiController]`も付いています。[`ValidationFilter.cs`](../../pecus.WebApi/Filters/ValidationFilter.cs) [`BaseSecureController.cs`](../../pecus.WebApi/Controllers/BaseSecureController.cs) [`BaseExternalApiController.cs`](../../pecus.WebApi/Controllers/External/BaseExternalApiController.cs)

`GlobalExceptionFilter`は既知の例外をHTTPエラー契約へまとめます。

| 例外／経路 | 応答 |
|---|---|
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `BadRequestException`、`DuplicateException`、`InvalidOperationException` | 400 |
| `IConcurrencyException` | 409。`statusCode`、`message`、競合時の`current`を返す |
| その他の予期しない例外 | 500。応答メッセージは一般化される |

このフィルターはController実行中の例外変換を担います。JWT認証ミドルウェアによるchallengeなど、Controllerの実行前に成立する認証応答とは経路が異なります。[`GlobalExceptionFilter.cs`](../../pecus.WebApi/Filters/GlobalExceptionFilter.cs) [`ConcurrencyException.cs`](../../pecus.WebApi/Exceptions/ConcurrencyException.cs) [`IConcurrencyException.cs`](../../pecus.WebApi/Exceptions/IConcurrencyException.cs)

### 409競合応答とFrontend型

代表例のWorkspaceItem更新では、サービスが`DbUpdateConcurrencyException`を捕捉し、最新のアイテム情報を取得して`ConcurrencyException<T>`として投げ直します。共通フィルターは例外インターフェースを通してそのモデルを`current`に載せ、409を返します。Controllerの`ProducesResponseType`も409のレスポンス型を宣言しています。競合検出のDB実装全般は永続化ページに委ねます。[`WorkspaceItemService.cs`](../../pecus.WebApi/Services/WorkspaceItemService.cs) [`ConcurrencyException.cs`](../../pecus.WebApi/Exceptions/ConcurrencyException.cs) [`GlobalExceptionFilter.cs`](../../pecus.WebApi/Filters/GlobalExceptionFilter.cs) [`WorkspaceItemController.cs`](../../pecus.WebApi/Controllers/WorkspaceItemController.cs) [`ConcurrencyErrorResponse.cs`](../../pecus.WebApi/Models/Responses/Common/ConcurrencyErrorResponse.cs)

Frontendの手書き接続層`PecusApiClient.ts`はAPI例外のステータスを確認し、409を`ConcurrencyError`として検出します。`generate-conflict-types.js`は保存済みOpenAPI JSON内の409レスポンスを走査し、`current`のschema参照から型を抽出して競合データ型を生成します。APIサービスコードの生成・接続層生成とその開発者向け実行順序は11ページの対象です。[`PecusApiClient.ts`](../../pecus.Frontend/src/connectors/api/PecusApiClient.ts) [`generate-conflict-types.js`](../../pecus.Frontend/scripts/generate-conflict-types.js) [`pecus.Frontend/package.json`](../../pecus.Frontend/package.json) [`generate-pecus-api-client.js`](../../pecus.Frontend/scripts/generate-pecus-api-client.js)

### OpenAPI公開とFrontend生成の接点

Web APIは`v1` OpenAPI文書を登録し、OpenAPI 3.0を指定しています。schema transformerで整数型とenum表現を調整し、認証schemeを検出するdocument transformerでBearer/JWT security schemeを登録します。実行時にOpenAPI JSONとSwagger UIをマップするのは開発環境です。[`Program.cs`](../../pecus.WebApi/Program.cs) [`BearerSecuritySchemeTransformer.cs`](../../pecus.WebApi/OpenApi/BearerSecuritySchemeTransformer.cs)

Frontend側の`full:api`手順はOpenAPI文書を取得し、API service型・クライアントを生成したうえで、409専用型とサービスwrapperを生成します。`PecusApiClient.ts`は生成されたAPI clientを利用し、接続先とアクセストークン取得を実行時に設定する手書き層です。生成操作そのものは本ページでは行いません。[`pecus.Frontend/package.json`](../../pecus.Frontend/package.json) [`generate-pecus-api-client.js`](../../pecus.Frontend/scripts/generate-pecus-api-client.js) [`PecusApiClient.ts`](../../pecus.Frontend/src/connectors/api/PecusApiClient.ts)

**OpenAPI上の差分:** `BearerSecuritySchemeTransformer`はBearer schemeが登録されていると、Externalを含む文書内の全operationへBearer security requirementを追加します。一方、External controllerの実行時属性はApiKey schemeを指定しており、このtransformerにはApiKey security schemeの追加処理がありません。そのため、生成OpenAPIの認証記述をExternal APIの実行時認証仕様そのものとして読むことはできません。[`BearerSecuritySchemeTransformer.cs`](../../pecus.WebApi/OpenApi/BearerSecuritySchemeTransformer.cs) [`BaseExternalApiController.cs`](../../pecus.WebApi/Controllers/External/BaseExternalApiController.cs)

## 主なコード実体

| 役割 | コード |
|---|---|
| 起動・DI・認証／認可・OpenAPI・HTTPパイプライン | [`Program.cs`](../../pecus.WebApi/Program.cs) |
| JWT生成とprincipalからのclaim取得 | [`JwtBearerUtil.cs`](../../pecus.WebApi/Libs/JwtBearerUtil.cs) |
| 通常APIのユーザー文脈 | [`BaseSecureController.cs`](../../pecus.WebApi/Controllers/BaseSecureController.cs) |
| 組織／ワークスペース境界 | [`WorkspaceAccessHelper.cs`](../../pecus.WebApi/Libs/WorkspaceAccessHelper.cs) |
| External API Key認証・Controller基底 | [`ApiKeyAuthenticationHandler.cs`](../../pecus.WebApi/Authentication/ApiKeyAuthenticationHandler.cs), [`BaseExternalApiController.cs`](../../pecus.WebApi/Controllers/External/BaseExternalApiController.cs) |
| 入力検証と例外変換 | [`ValidationFilter.cs`](../../pecus.WebApi/Filters/ValidationFilter.cs), [`GlobalExceptionFilter.cs`](../../pecus.WebApi/Filters/GlobalExceptionFilter.cs) |
| 409契約と代表例 | [`ConcurrencyErrorResponse.cs`](../../pecus.WebApi/Models/Responses/Common/ConcurrencyErrorResponse.cs), [`WorkspaceItemController.cs`](../../pecus.WebApi/Controllers/WorkspaceItemController.cs) |
| OpenAPI security記述 | [`BearerSecuritySchemeTransformer.cs`](../../pecus.WebApi/OpenApi/BearerSecuritySchemeTransformer.cs) |
| Frontend接続・409検出／型生成 | [`PecusApiClient.ts`](../../pecus.Frontend/src/connectors/api/PecusApiClient.ts), [`generate-conflict-types.js`](../../pecus.Frontend/scripts/generate-conflict-types.js) |

## 確認上の注意・未確認事項

- `Program.cs`には引数なしのグローバル`AuthorizeFilter()`があり、External基底にはApiKey schemeを指定する`[Authorize]`があります。各フィルター／属性のポリシーが実行時にどう合成され、External APIがAPI Keyだけで認証されるかは、このページでは統合実行で検証していません。したがって「Externalは必ずAPI Keyのみで通る」とは断定しません。[`Program.cs`](../../pecus.WebApi/Program.cs) [`BaseExternalApiController.cs`](../../pecus.WebApi/Controllers/External/BaseExternalApiController.cs)
- JWTブラックリストの登録・解除条件や、ユーザー状態変更と既発行トークンの失効タイミングは、本ページの確認範囲から一般化できません。確認できたのはJWT検証時にブラックリスト照会とユーザー有効性確認が呼ばれることです。[`Program.cs`](../../pecus.WebApi/Program.cs)
- API Keyの検証コードではハッシュ一致、未失効、有効期限を確認します。組織状態など追加の有効条件が認証全体でどう扱われるかは、ここで読んだ範囲を超えて断定しません。[`ExternalApiKeyService.cs`](../../pecus.Libs/DB/Services/ExternalApiKeyService.cs)

## 関連ページ

- [Frontendのリクエストとセッション](frontend-request-flow.md) — FrontendのSSR／Server Actions、セッション、API呼び出し経路。
- [永続化モデルとデータベース初期化](data-model-lifecycle.md) — EF CoreモデルとDB競合情報の全体像。
- [ワークスペース・アイテム・タスクの業務フロー](workspace-workflows.md) — 個別のWorkspace／Item／Task操作。
- [チャット・アジェンダ・リアルタイム通知](collaboration-realtime.md) — SignalRの利用フローと通知。
- [開発者向け生成処理とリポジトリ支援](developer-workflows.md) — OpenAPIからFrontend型・クライアントを生成する開発作業。
