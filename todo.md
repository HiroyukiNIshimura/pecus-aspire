「以下の修正を行ってください：

request.PageSize や [FromQuery] int limit のように外部からページサイズを受け取る全エンドポイントを洗い出す
各エンドポイントに対応するリクエストDTOを作成（または既存DTOに追加）
Limit/PageSizeプロパティに [Range(1, 100)] 属性を付与
コントローラー側は request.Limit ?? _config.Pagination.DefaultPageSize のパターンに統一
参考：GetRecentOccurrencesRequest.cs と AgendasController.GetRecentOccurrences」

影響範囲（対象ファイル候補）：

WorkspaceItemController.cs (173行目)
WorkspaceController.cs
MyTaskController.cs
MyItemController.cs
MyActivityController.cs
ItemActivityController.cs
TaskCommentController.cs
WorkspaceItemPinController.cs
AdminTagController.cs
AdminSkillController.cs
AdminWorkspaceController.cs
AdminUserController.cs
これは横断変更になるので、承認フローに則って進めてください。

---
管理者画面のユーザーがメチャクチャな作りになっている。
DBも同様、これじゃ組織なくならないとユーザーは絶対物理削除できない状況。