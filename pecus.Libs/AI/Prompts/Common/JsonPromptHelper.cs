namespace Pecus.Libs.AI.Prompts.Common;

/// <summary>
/// JSON出力用のシステムプロンプト拡張を提供するヘルパー
/// </summary>
public static class JsonPromptHelper
{
    /// <summary>
    /// JSON出力を指示する追加プロンプト
    /// </summary>
    public const string JsonInstructionSuffix = """

        必ずJSON形式で回答してください。マークダウンのコードブロック（```json など）は使用しないでください。
        純粋なJSONのみを返してください。
        """;

    /// <summary>
    /// システムプロンプトにJSON出力指示を追加
    /// </summary>
    /// <param name="systemPrompt">元のシステムプロンプト</param>
    /// <returns>JSON指示が追加されたシステムプロンプト</returns>
    public static string AppendJsonInstruction(string systemPrompt)
    {
        return $"{systemPrompt}{JsonInstructionSuffix}";
    }
}
