# Coatiのヒントワークスペース自動作成 実装計画

## 概要
シードデータ投入時および新規組織作成時に、「Coatiのヒント」というドキュメントモードのワークスペースを自動的に作成する。
また、そのワークスペースにはユーザーガイドとなる初期アイテム（ドキュメント）を自動的に投入する。

## 実装タスク

### 1. 定数・データ定義
`pecus.Libs/Utils/AppConstants.cs` および `pecus.Libs/Utils/DefaultData/CoatiHintItems.cs`（新規作成）に定義を追加する。

**AppConstants.cs:**
```csharp
namespace Pecus.Libs.Utils;

public static class AppConstants
{
    /// <summary>
    /// デフォルトのヒント用ワークスペース名
    /// </summary>
    public const string DefaultHintWorkspaceName = "Coatiのヒント";

    /// <summary>
    /// デフォルトのヒント用ワークスペースの説明
    /// </summary>
    public const string DefaultHintWorkspaceDescription = "Coatiの使い方やヒントをまとめたワークスペースです。";
}
```

**CoatiHintItems.cs (新規):**
初期アイテムのデータ構造と内容を定義する。

```csharp
namespace Pecus.Libs.Utils.DefaultData;

public record DefaultWorkspaceItem(string Subject, string Body);

public static class CoatiHintItems
{
    public static readonly List<DefaultWorkspaceItem> Items = new()
    {
        new DefaultWorkspaceItem(
            "ようこそ Coati へ",
            """
            # Coati へようこそ！

            Coati は、チームの知識を共有し、生産性を高めるためのプラットフォームです。
            このワークスペースは「ドキュメントモード」で作成されており、Wikiのように情報を整理するのに適しています。

            ## 何から始めますか？
            - 左側のサイドバーからページを作成できます。
            - `Cmd/Ctrl + K` でコマンドパレットを開き、素早く移動や操作ができます。
            """
        ),
        new DefaultWorkspaceItem(
            "ドキュメントの書き方",
            """
            # Markdown が使えます

            Coati のエディタは Markdown 記法をサポートしています。

            - **太字**: `**text**`
            - *斜体*: `*text*`
            - リスト: `- item`
            - コードブロック: ` ``` `

            ## AI による支援
            エディタ上で `/` を入力するか、AI アイコンをクリックすると、文章の生成や要約を依頼できます。
            """
        ),
        new DefaultWorkspaceItem(
            "AI機能の活用",
            """
            # AI アシスタント

            Coati には強力な AI アシスタントが組み込まれています。

            - **要約**: 長いドキュメントを瞬時に要約します。
            - **翻訳**: 多言語間のコミュニケーションをサポートします。
            - **アイデア出し**: ブレストのパートナーとして活用できます。
            """
        )
    };
}
```

### 2. シードデータ投入ロジックの修正
**対象ファイル**: `pecus.Libs/DB/Seed/DatabaseSeeder.cs`

*   `SeedSystemWorkspacesAsync` メソッド（仮名）を追加し、`SeedAllAsync` から呼び出す。
*   **処理フロー**:
    1.  全組織を取得。
    2.  各組織について、「Coatiのヒント」ワークスペースが存在しなければ作成。
        *   `Mode`: `WorkspaceMode.Document`
        *   `OwnerId`: 組織の管理者
    3.  ワークスペース作成後、アイテム連番用シーケンスを作成 (`CREATE SEQUENCE ...`)。
    4.  **アイテム作成処理**:
        *   `CoatiHintItems.Items` をループ。
        *   `WorkspaceItem` エンティティを作成し、`ItemNumber` を 1 から順に割り当てる。
        *   `_context.WorkspaceItems.AddRange` で保存。
    5.  **シーケンス値の更新**:
        *   アイテム作成後、シーケンスの現在値をアイテム数に合わせて進める。
        *   SQL: `SELECT setval('{sequenceName}', {lastItemNumber})`

### 3. 組織作成ロジックの修正
**対象ファイル**: `pecus.WebApi/Services/OrganizationService.cs`

*   `CreateOrganizationWithUserAsync` メソッド内のトランザクション処理に追加。
*   **処理フロー**:
    1.  組織・管理者ユーザー作成後、「Coatiのヒント」ワークスペースを作成。
    2.  アイテム連番用シーケンスを作成。
    3.  管理者をメンバーに追加。
    4.  **アイテム作成処理**:
        *   シードデータと同様に `CoatiHintItems.Items` から `WorkspaceItem` を作成・保存。
        *   `ItemNumber` を手動採番。
    5.  **シーケンス値の更新**:
        *   `SELECT setval(...)` でシーケンスを更新。

### 4. 確認・テスト
*   **シード実行**: `dotnet run --project pecus.DbManager`
*   **新規作成**: API経由で組織作成を行い、ワークスペースと初期アイテム（3件程度）が作成されているか確認。
*   **連番確認**: 初期アイテム作成後、手動でアイテムを追加した際に `ItemNumber` が重複せず、正しくインクリメントされるか確認（シーケンス更新が正しく行われているかの確認）。

## 注意事項
*   **シーケンス制御**: 初期データを `ItemNumber` 指定でINSERTした場合、PostgreSQLのシーケンスは自動的に進まないため、必ず `setval` で同期をとる必要がある。これを忘れると、ユーザーが次にアイテムを作成する際に主キー/ユニーク制約違反（重複エラー）が発生する。
*   **コンテンツ管理**: 初期アイテムの内容はコード（`CoatiHintItems.cs`）で管理するが、長くなる場合はリソースファイルや別ファイルへの分離も検討する（現状はクラス内定義で可）。
