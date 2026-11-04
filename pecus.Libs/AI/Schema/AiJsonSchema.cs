using System.Text.Json.Nodes;

namespace Pecus.Libs.AI.Schema;

/// <summary>
/// AI プロバイダーへ送信する構造化出力スキーマ
/// </summary>
/// <param name="Name">スキーマ名（プロバイダーの命名制約を満たすよう正規化済み）</param>
/// <param name="Schema">JSON Schema オブジェクト</param>
public sealed record AiJsonSchema(string Name, JsonObject Schema);
