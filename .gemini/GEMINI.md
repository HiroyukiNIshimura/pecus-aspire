# Pecus Aspire プロジェクト指示書

このプロジェクトはAIエージェントによって自律的に構築されています。以下の規約、アーキテクチャルール、およびワークフローを厳格に遵守してください。

## コア・ルールと禁止事項
- **APIクライアント生成:** `npm run full:api` を実行してはいけません（**絶対禁止**）。これは人間の開発者専用のコマンドです。
- **API直接アクセス:** フロントエンド（クライアントコンポーネントやブラウザの直fetch）から `pecus.WebApi` を直接呼び出してはいけません（**絶対禁止**）。データの変更は必ず Server Actions（`src/actions/`）を経由し、データの取得は SSR（Server Components）または API Routes を経由して `createPecusApiClients()` を使用してください。
- **自動生成ファイル:** 自動生成されたファイル（例：`PecusApiClient.generated.ts`）を手動で編集してはいけません（**絶対禁止**）。
- **スコープと複数プロジェクトの変更:** 明示的な承認なしに複数プロジェクトをまたぐ横断変更を行ってはいけません。指示がない限り、業務ロジックのリファクタリングは行わないでください。
- **ドキュメントの参照:** 具体的な実装については常に `docs/` を参照してください。関連コードを変更する前に、各ドキュメントの冒頭にある「AI エージェント向け要約（必読）」を必ず読んでください。

## アーキテクチャと技術スタック
- **アプリ名:** Coati（コードネーム: pecus）
- **技術スタック:** .NET 10 / EF Core 10 / .NET Aspire 13.2 / Next.js 16.2 / React 19.2 / Tailwind CSS 4.2 / FlyonUI 2.4
- **オーケストレーション:** `pecus.AppHost/AppHost.cs` がエントリポイントであり、サービスの起動順序と依存関係（PostgreSQL, Redis, WebApi, DbManager, BackFire, Frontend）を管理しています。
- **テスト:** テストプロジェクトは存在しません。テストの作成を提案したり、実装を試みたりしないでください（**絶対禁止**）。

## バックエンド・ガイドライン（`pecus.WebApi`, `pecus.Libs`, `pecus.BackFire`, `pecus.DbManager`）
- **コントローラー:** MVCコントローラー + `HttpResults`（`Ok<T>`, `Created<T>`）を使用してください。`IActionResult` の使用は禁止です。例外処理は `GlobalExceptionFilter` に委譲してください。
- **DTO:** 検証属性（`[Required]`, `[MaxLength]` 等）を厳密に付与してください。DTO は API 仕様書として扱われます。
- **Enum:** nullable（`?`）を推奨します。`HasDefaultValue()` は使用しないでください（**絶対禁止**）。レスポンス DTO では `JsonStringEnumConverter<TEnum>` を明示してください。
- **トランザクション:** サービス層で `BeginTransactionAsync` を使用して開始してください。コントローラーでのトランザクション開始は禁止です。
- **同時実行制御:** `DbUpdateConcurrencyException` を catch し、`FindAsync` で最新状態を取得後、`ConcurrencyException<T>` をスローしてください。
- **Hangfireタスク:** DI経由（`IBackgroundJobClient` / `IRecurringJobManager`）で使用してください。静的API（`BackgroundJob.Enqueue`等）の使用は厳格に禁止されています。

## フロントエンド・ガイドライン（`pecus.Frontend`）
- **レンダリング:** SSR（Server Component）ファースト。読み取りは Server Component に維持し、対話的なUIが必要な場所でのみ `"use client"` を使用してください。
- **レイアウトとCSS:** ページコンポーネント内で `h-screen` や `min-h-screen` を使用してはいけません（**絶対禁止**）。代わりに `flex-1` を使用してください。レイアウト変更前には必ず `docs/layout-template.md` を確認してください。
- **Tailwind:** 任意値（例：`z-[10]`, `w-[200px]`）を使用してはいけません（**絶対禁止**）。FlyonUI のセマンティックカラー（例：`-ghost` ではなく `-secondary`）を使用してください。daisyUI は禁止です。
- **アイコン:** `@iconify/tailwind4` を使用してください。
- **認証トークン:** `ServerSessionManager.getValidAccessToken()` を通じてRedisから取得・管理されます。Cookie には `sessionId` のみが保存されます。

## 開発ワークフローとコマンド
エージェントが自律的に実行して良いコマンド/悪いコマンドの区別に注意してください。
- **バックエンド:** `dotnet format pecus.sln` -> `dotnet clean pecus.sln` -> `dotnet build pecus.sln` -> `dotnet run --project pecus.AppHost` (※エージェントによるrun実行は禁止)
- **フロントエンド:** `cd pecus.Frontend` -> `npm run lint` -> `npm run format` -> `npx tsc --noEmit` -> `npm run build` -> `npm run dev` (※エージェントによるdev/build実行は禁止)
