namespace Pecus.Libs.AI;

/// <summary>
/// AI に与える役割（Role）をランダムに取得するヘルパー
/// </summary>
public static class RoleRandomizer
{
    private static readonly Random _random = new();

    /// <summary>
    /// 定義済みの役割リスト
    /// </summary>
    private static readonly RoleConfig[] _roles =
    [
        new RoleConfig(
            MainRole: "メンター",
            FinalGoal: "ユーザーの成長を支援し、気づきを与える質問を投げかけること"
        ),
        new RoleConfig(
            MainRole: "ブレインストーミングパートナー",
            FinalGoal: "多角的な視点からアイデアを広げ、新しい発想を引き出すこと"
        ),
        new RoleConfig(
            MainRole: "批評家",
            FinalGoal: "建設的な批判を通じて、計画や提案の弱点を明らかにすること"
        ),
        new RoleConfig(
            MainRole: "応援団長",
            FinalGoal: "ユーザーのモチベーションを高め、前向きな気持ちにさせること"
        ),
        new RoleConfig(
            MainRole: "整理整頓アドバイザー",
            FinalGoal: "情報を整理し、優先順位を明確にする手助けをすること"
        ),
        new RoleConfig(
            MainRole: "質問者",
            FinalGoal: "本質的な問いかけで、ユーザー自身の考えを深めさせること"
        ),
        new RoleConfig(
            MainRole: "要約者",
            FinalGoal: "複雑な情報をシンプルにまとめ、理解しやすくすること"
        ),
        new RoleConfig(
            MainRole: "デバッグパートナー",
            FinalGoal: "問題の原因を一緒に特定し、解決策を見つけること"
        ),
        new RoleConfig(
            MainRole: "タイムキーパー",
            FinalGoal: "時間を意識させ、効率的なタスク遂行を促すこと"
        ),
        new RoleConfig(
            MainRole: "リスクアナリスト",
            FinalGoal: "潜在的なリスクを洗い出し、予防策を提案すること"
        ),
        new RoleConfig(
            MainRole: "ユーザー代弁者",
            FinalGoal: "エンドユーザーの視点に立って意見を述べること"
        ),
        new RoleConfig(
            MainRole: "シンプル化の達人",
            FinalGoal: "複雑なものをシンプルに、難しいことを簡単に説明すること"
        ),
        new RoleConfig(
            MainRole: "アイデア検証者",
            FinalGoal: "アイデアの実現可能性を検証し、具体的なステップを提案すること"
        ),
        new RoleConfig(
            MainRole: "雑談相手",
            FinalGoal: "リラックスした会話を通じて、ユーザーの気分転換を助けること"
        ),
        new RoleConfig(
            MainRole: "学習サポーター",
            FinalGoal: "新しい概念や技術の理解を助け、学習を促進すること"
        ),
    ];

    /// <summary>
    /// ランダムに役割を取得
    /// </summary>
    /// <returns>ランダムに選ばれた RoleConfig</returns>
    public static RoleConfig GetRandomRole()
    {
        var index = _random.Next(_roles.Length);
        return _roles[index];
    }

    /// <summary>
    /// 指定した数の役割をランダムに取得（重複なし）
    /// </summary>
    /// <param name="count">取得する役割の数</param>
    /// <returns>ランダムに選ばれた RoleConfig の配列</returns>
    public static RoleConfig[] GetRandomRoles(int count)
    {
        if (count <= 0)
        {
            return [];
        }

        if (count >= _roles.Length)
        {
            return [.. _roles];
        }

        return _roles
            .OrderBy(_ => _random.Next())
            .Take(count)
            .ToArray();
    }

    /// <summary>
    /// 全ての定義済み役割を取得
    /// </summary>
    /// <returns>全ての RoleConfig の配列</returns>
    public static RoleConfig[] GetAllRoles() => [.. _roles];

    /// <summary>
    /// 役割の総数を取得
    /// </summary>
    public static int Count => _roles.Length;
}
