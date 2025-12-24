# 一覧検索クエリのベストプラクティス

## AI エージェント向け要約（必読）

**一覧検索は「必要最小限のデータのみ取得」が鉄則。**

- ❌ `Include()` で関連エンティティを全件ロードしてからC#でカウント → **絶対禁止**
- ✅ `Select()` 射影でDTOを直接生成し、カウントはDB側の `COUNT()` で取得

```csharp
// ❌ アンチパターン（絶対にやらない）
var workspaces = await _context.Workspaces
    .Include(w => w.WorkspaceUsers)  // 数千件のメンバーをメモリにロード
    .Include(w => w.WorkspaceItems)  // 数千件のアイテムをメモリにロード
    .ToListAsync();

var count = workspaces.WorkspaceUsers.Count;  // C#でカウント → 遅い

// ✅ 正しいパターン
var workspaces = await _context.Workspaces
    .Select(w => new WorkspaceListItemResponse
    {
        Id = w.Id,
        Name = w.Name,
        MemberCount = w.WorkspaceUsers.Count(wu => wu.User.IsActive),  // SQLのCOUNT()
        ActiveItemCount = w.WorkspaceItems.Count(wi => wi.IsActive),   // SQLのCOUNT()
    })
    .ToListAsync();
```

---

## 1. 基本原則

### 1.1 必要なデータだけを取得する

一覧画面で表示する項目を明確にし、**それ以外のデータは取得しない**。

| 項目 | 必要性の判断 |
|------|-------------|
| ID, Name, Code | 一覧表示に必須 |
| MemberCount | 数値のみ必要 → `COUNT()` で取得 |
| Members リスト | 一覧に表示しないなら**取得しない** |
| Owner | アイコン表示するなら取得、しないなら不要 |

### 1.2 Include() の使い分け

`Include()` 自体は禁止ではない。**件数が膨らむコレクション**のロードが問題。

#### ✅ Include() を使って良いケース

- **マスタテーブル参照**（Organization, Genre, User など 1:1 または N:1）
- **単一エンティティ詳細取得**（編集画面など）

```csharp
// ✅ マスタ参照は Include() で OK
var workspace = await _context.Workspaces
    .Include(w => w.Organization)  // 1件のみ
    .Include(w => w.Genre)         // 1件のみ
    .Include(w => w.Owner)         // 1件のみ
    .FirstOrDefaultAsync(w => w.Id == id);
```

#### ❌ Include() を避けるべきケース

- **コレクション（1:N）を一覧検索で全件ロード**
- **カウント目的でのコレクションロード**

```csharp
// ❌ 一覧検索でコレクションを全件ロード → 禁止
.Include(w => w.WorkspaceUsers)    // 数千件のメンバーをロード
.Include(w => w.WorkspaceItems)    // 数千件のアイテムをロード

// ✅ 代わりにSelect射影でカウントのみ取得
.Select(w => new {
    w.Id,
    MemberCount = w.WorkspaceUsers.Count()
})
```

### 1.3 カウントはDB側で計算

C# の `.Count` ではなく、EF Core がSQL `COUNT()` に変換する形で記述する。

```csharp
// ❌ C#でカウント（全件ロード後）
var count = workspace.WorkspaceItems?.Count ?? 0;

// ✅ DB側でCOUNT（Select内で記述）
ActiveItemCount = w.WorkspaceItems.Count(wi => wi.IsActive)
```

---

## 2. 実装パターン

### 2.1 サービス層でDTOを直接返す（推奨）

単一サービスで完結する場合は、サービス層で `Select()` によりDTOを直接生成することを**推奨**する。
コントローラーでのマッピング処理が不要になり、コードがシンプルになる。

```csharp
// サービス層
public async Task<(List<WorkspaceListItemResponse> workspaces, int totalCount)>
    GetWorkspacesPagedAsync(int page, int pageSize)
{
    var baseQuery = _context.Workspaces
        .AsNoTracking()
        .Where(w => w.IsActive);

    var totalCount = await baseQuery.CountAsync();

    var workspaces = await baseQuery
        .OrderByDescending(w => w.Id)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(w => new WorkspaceListItemResponse
        {
            Id = w.Id,
            Name = w.Name,
            Code = w.Code,
            // DB側でCOUNT
            MemberCount = w.WorkspaceUsers.Count(wu => wu.User != null && wu.User.IsActive),
            ActiveItemCount = w.WorkspaceItems.Count(wi => wi.IsActive),
            // 必要な関連データのみ射影
            Owner = w.Owner != null ? new WorkspaceUserItem
            {
                UserId = w.Owner.Id,
                Username = w.Owner.Username,
                // ...
            } : null,
        })
        .ToListAsync();

    return (workspaces, totalCount);
}
```

### 2.2 コントローラーでのマッピングが必要なケース

複数サービスからデータを取得し、コントローラーがファサードとして組み合わせる場合はこの限りではない。

```csharp
// 例: 複数サービスのデータを組み合わせる場合
public async Task<Ok<DashboardResponse>> GetDashboard()
{
    var workspaces = await _workspaceService.GetWorkspacesAsync();
    var notifications = await _notificationService.GetUnreadAsync();
    var statistics = await _statisticsService.GetSummaryAsync();

    // コントローラーで組み合わせてレスポンスを構築
    return TypedResults.Ok(new DashboardResponse
    {
        Workspaces = workspaces,
        Notifications = notifications,
        Statistics = statistics,
    });
}
```

ただし、この場合でも**各サービスのクエリ自体は最適化されていること**が前提。

### 2.3 関連データが本当に必要な場合

一覧でアバターを表示するなど、関連データが必要な場合でも**上限を設ける**。

```csharp
// 上位5件のメンバーのみ取得（全件ロードしない）
Members = w.WorkspaceUsers
    .Where(wu => wu.User != null && wu.User.IsActive)
    .OrderBy(wu => wu.JoinedAt)
    .Take(5)  // 上限を設ける
    .Select(wu => new WorkspaceUserItem { ... })
    .ToList()
```

---

## 3. チェックリスト

新しい一覧検索を実装する前に確認：

- [ ] フロントエンドで実際に使用するフィールドを特定したか？
- [ ] `Include()` を使わずに `Select()` 射影で実装できるか？
- [ ] カウントは `COUNT()` としてDBで計算されるか？
- [ ] 関連データのリストを返す場合、上限を設けているか？
- [ ] `AsNoTracking()` を使用しているか？（読み取り専用の場合）
- [ ] ページネーションの `Skip()` / `Take()` は適切か？

---

## 4. パフォーマンス比較

実際の改善例（ワークスペース一覧、メンバー・アイテム各数千件の場合）：

| 実装方式 | レスポンス時間 | メモリ使用量 |
|---------|---------------|-------------|
| Include + C# Count | 約2秒 | 高（全件ロード） |
| Select + DB COUNT | 約800ms | 低（必要最小限） |
| Select + 不要データ削除 | 約500ms以下 | 最小 |

---

## 5. SQLログの確認方法

生成されるSQLを確認し、期待通りの `COUNT()` やサブクエリが使われているか検証する。

ログファイル: `pecus.WebApi/logs/pecus.WebApi-YYYYMMDD.log`

期待されるSQL例：
```sql
SELECT
    w."Id", w."Name", w."Code",
    (SELECT count(*)::int FROM "WorkspaceUsers" WHERE ... AND u."IsActive") AS "MemberCount",
    (SELECT count(*)::int FROM "WorkspaceItems" WHERE ... AND wi."IsActive") AS "ActiveItemCount"
FROM "Workspaces" AS w
WHERE w."IsActive"
ORDER BY w."Id" DESC
LIMIT @p OFFSET @p
```

---

## 6. 関連ドキュメント

- `docs/backend-guidelines.md` - バックエンド実装ガイドライン
- `docs/api-list-response-design.md` - API レスポンス設計
