namespace Pecus.Libs.AI.Schema;

/// <summary>
/// 構造化出力スキーマのプロバイダー別制約
/// 各プロバイダーが受理できる JSON Schema のサブセットが異なるため、
/// 送信直前にプロバイダーごとの正規化を行う
/// </summary>
public enum AiJsonSchemaProfile
{
    /// <summary>
    /// OpenAI Structured Outputs（strict: true）
    /// 全プロパティ required、additionalProperties: false、ルートは object のみ
    /// </summary>
    OpenAiStrict,

    /// <summary>
    /// Anthropic Claude 構造化出力
    /// additionalProperties: false 必須、数値・文字列制約は不可
    /// </summary>
    Anthropic,

    /// <summary>
    /// Google Gemini 構造化出力
    /// JSON Schema ネイティブ。未強制の制約は送信前に除去する
    /// </summary>
    Gemini,

    /// <summary>
    /// Kimi (Moonshot) Structured Output
    /// MFJS の制約に合わせて additionalProperties: false を付与する
    /// </summary>
    Kimi
}
