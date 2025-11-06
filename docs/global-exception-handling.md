## GlobalExceptionFilter — 例外ハンドリング方針（バックエンド）

このドキュメントは、`pecus.WebApi` 内で採用しているグローバル例外ハンドリングの方式（`GlobalExceptionFilter`）について説明します。

対象ファイル

- `pecus.WebApi/Filters/GlobalExceptionFilter.cs`

目的

- コントローラ／サービスでの個別 try/catch を排除し、例外を一元的に HTTP レスポンスに変換する。
- 既知のアプリケーション例外に対して適切な HTTP ステータスコードとユーザーフレンドリーなメッセージを返す。
- 予期しない例外は 500 としてログに残す。

設計要点

- コントローラやサービスではエラー時に明示的に `TypedResults` を返すのではなく、適切な例外をスローする。
- `GlobalExceptionFilter` がスローされた例外をキャッチして、`ErrorResponse`（`Pecus.Models.Responses.Common.ErrorResponse`）を返却する。
- ロギングは例外タイプに応じてレベルを変える（既知例外は Warning、予期せぬ例外は Error）。

既定の例外 → HTTP マッピング

- `NotFoundException` → 404 Not Found
- `ConcurrencyException` → 409 Conflict（楽観的ロック競合）
- `DuplicateException` → 400 Bad Request（重複データ）
- `InvalidOperationException` → 400 Bad Request（無効な操作）
- それ以外の例外 → 500 Internal Server Error

戻り値の JSON 形式

例外はすべて `ErrorResponse` を使って返却されます（クライアント側は `StatusCode` と `Message` を参照して扱う）。

例：
{
  "statusCode": 404,
  "message": "指定されたリソースが見つかりません。"
}

サービス／コントローラでの実装パターン（サンプル）

- サービス側（例）: 競合検出・存在チェック・重複チェックは例外を投げる

```csharp
public async Task<GenreResponse> UpdateGenreAsync(int id, UpdateGenreRequest request)
{
    var genre = await _context.Genres.FindAsync(id);
    if (genre == null) throw new NotFoundException("ジャンルが見つかりません。");

    // 楽観ロックチェック
    if (!genre.RowVersion?.SequenceEqual(request.RowVersion) ?? true)
        throw new ConcurrencyException("別のユーザーが同時に変更しました。");

    // 重複チェック
    if (request.Name != null && request.Name != genre.Name)
    {
        if (await _context.Genres.AnyAsync(g => g.Name == request.Name && g.Id != id))
            throw new DuplicateException("このジャンル名は既に使用されています。");
        genre.Name = request.Name;
    }

    await _context.SaveChangesAsync();
    return MapToResponse(genre);
}
```

- コントローラ側（例）: 例外を try/catch せずに直に呼び出す

```csharp
[HttpPut("{id}")]
public async Task<Ok<GenreResponse>> UpdateGenre(int id, UpdateGenreRequest req)
{
    var res = await _genreService.UpdateGenreAsync(id, req, currentUserId);
    return TypedResults.Ok(res);
}
```

GlobalExceptionFilter の挙動（実装の要点）

- `IExceptionFilter` を実装し `OnException` で例外を判別する。
- 既知のカスタム例外は専用ハンドラ（404, 409, 400 等）へルーティングされる。
- 予期しない例外は内部でログ（Error）を出力し、汎用メッセージ（500）を返す。
- すべてのハンドラは `ObjectResult(ErrorResponse)` を返し、HTTP ステータスコードを設定する。

ロギング方針

- 既知の例外（`NotFoundException`, `DuplicateException`, `ConcurrencyException`, `InvalidOperationException`）は `LogWarning`。
- 予期せぬ例外は `LogError`（スタックトレース含む）。

フィルターの登録

- 通常は `Program.cs` / `AppHost`（本プロジェクトでは `pecus.AppHost` や `pecus.WebApi` の DI 設定箇所）で MVC フィルターとして登録します。

例（登録の参考）:

```csharp
builder.Services.AddControllers(options =>
{
    options.Filters.Add<GlobalExceptionFilter>();
});
```

注意点とガイドライン

- コントローラやサービスで過剰な try/catch を書かない。代わりに意味のあるカスタム例外を throw する。
- ユーザー向けのメッセージはすでにサービス側で日本語の具体的な文言を用意しているため、例外メッセージをそのまま ErrorResponse に載せてよい（ただし機密情報は含めない）。
- 新しい例外タイプを追加する場合は `GlobalExceptionFilter` にハンドラを追加して HTTP マッピングを定義する。

拡張例：新しい例外 `ValidationException` を 422 にマップする

1. 例外クラスを作成
2. `GlobalExceptionFilter.OnException` の switch に `ValidationException` を追加
3. ハンドラ `HandleValidationException` を実装して `StatusCode = 422` の `ErrorResponse` を返す

テスト

- 単体テスト: サービスメソッドが適切な例外をスローすること（例えば、存在しないリソースで `NotFoundException`）。
- 統合テスト: エンドポイントに対して実際に HTTP リクエストを送り、期待した HTTP ステータス・レスポンス形式（`ErrorResponse`）が返ることを検証する。

まとめ

- `GlobalExceptionFilter` による一元的な例外処理は、コードの簡潔化と一貫したエラーレスポンスの提供に役立ちます。
- サービス側は "事実検証 → 例外をスロー" のパターンを採用し、フィルターが表現の責務を担います。

--
ドキュメント作成日時: 2025-11-06
作成者: 自動生成（補助エージェント）
