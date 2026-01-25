namespace Pecus.Libs.AI;

/// <summary>
/// AI用システムプロンプトを構築するためのビルダークラス
/// </summary>
public sealed class SystemPromptBuilder
{
    private PersonaConfig? _persona;
    private RoleConfig? _role;
    private List<string> _constraints = [];
    private string? _rawPersona;
    private string? _rawConstraint;

    /// <summary>
    /// ペルソナ設定を追加
    /// </summary>
    /// <param name="persona">ペルソナ設定</param>
    /// <returns>ビルダーインスタンス</returns>
    public SystemPromptBuilder WithPersona(PersonaConfig? persona)
    {
        if (persona == null) return this;
        _persona = persona;
        return this;
    }

    /// <summary>
    /// 役割設定を追加
    /// </summary>
    /// <param name="role">役割設定</param>
    /// <returns>ビルダーインスタンス</returns>
    public SystemPromptBuilder WithRole(RoleConfig? role)
    {
        if (role == null) return this;

        _role = role;
        return this;
    }

    /// <summary>
    /// 行動指針（制約）を追加
    /// </summary>
    /// <param name="constraint">制約条件</param>
    /// <returns>ビルダーインスタンス</returns>
    public SystemPromptBuilder AddConstraint(string constraint)
    {
        if (!string.IsNullOrWhiteSpace(constraint))
        {
            _constraints.Add(constraint);
        }
        return this;
    }

    /// <summary>
    /// 複数の行動指針（制約）を追加
    /// </summary>
    /// <param name="constraints">制約条件のリスト</param>
    /// <returns>ビルダーインスタンス</returns>
    public SystemPromptBuilder AddConstraints(IEnumerable<string> constraints)
    {
        foreach (var constraint in constraints)
        {
            AddConstraint(constraint);
        }
        return this;
    }

    /// <summary>
    /// 生のペルソナ文字列を設定（DBから取得した値など）
    /// </summary>
    /// <param name="persona">ペルソナ文字列</param>
    /// <returns>ビルダーインスタンス</returns>
    public SystemPromptBuilder WithRawPersona(string? persona)
    {
        _rawPersona = persona;
        return this;
    }

    /// <summary>
    /// 生の行動指針文字列を設定（DBから取得した値など）
    /// </summary>
    /// <param name="constraint">行動指針文字列</param>
    /// <returns>ビルダーインスタンス</returns>
    public SystemPromptBuilder WithRawConstraint(string? constraint)
    {
        _rawConstraint = constraint;
        return this;
    }

    /// <summary>
    /// システムプロンプト文字列を構築
    /// </summary>
    /// <returns>構築されたシステムプロンプト</returns>
    public string Build()
    {
        var sections = new List<string>();

        // 生のペルソナ文字列を優先
        if (!string.IsNullOrWhiteSpace(_rawPersona))
        {
            sections.Add(_rawPersona.Trim());
        }
        else if (_persona != null)
        {
            sections.Add(BuildPersonaSection(_persona));
        }

        if (_role != null)
        {
            sections.Add(BuildRoleSection(_role));
        }

        // 生の行動指針文字列を優先
        if (!string.IsNullOrWhiteSpace(_rawConstraint))
        {
            sections.Add(_rawConstraint.Trim());
        }
        else if (_constraints.Count > 0)
        {
            sections.Add(BuildConstraintsSection(_constraints));
        }

        return string.Join("\n\n", sections);
    }

    private static string BuildPersonaSection(PersonaConfig persona)
    {
        var lines = new List<string> { "<persona>" };

        if (!string.IsNullOrWhiteSpace(persona.NameAndTitle))
        {
            lines.Add($"名前/肩書き: あなたは「{persona.NameAndTitle}」です。");
        }

        if (!string.IsNullOrWhiteSpace(persona.PersonalityAndTone))
        {
            lines.Add($"性格/口調: {persona.PersonalityAndTone}");
        }

        if (!string.IsNullOrWhiteSpace(persona.Background))
        {
            lines.Add($"バックグラウンド: {persona.Background}");
        }

        lines.Add("</persona>");

        return string.Join("\n", lines);
    }

    private static string BuildRoleSection(RoleConfig role)
    {
        var lines = new List<string> { "<role>" };

        if (!string.IsNullOrWhiteSpace(role.MainRole))
        {
            lines.Add($"主な役割: 私の「{role.MainRole}」として機能してください。");
        }

        if (!string.IsNullOrWhiteSpace(role.FinalGoal))
        {
            lines.Add($"最終目標: {role.FinalGoal}");
        }

        lines.Add("</role>");

        return string.Join("\n", lines);
    }

    private static string BuildConstraintsSection(List<string> constraints)
    {
        var lines = new List<string> { "<constraints>" };

        foreach (var constraint in constraints)
        {
            lines.Add(constraint);
        }

        lines.Add("</constraints>");

        return string.Join("\n", lines);
    }
}

/// <summary>
/// ペルソナ設定
/// </summary>
/// <param name="NameAndTitle">名前/肩書き</param>
/// <param name="PersonalityAndTone">性格/口調</param>
/// <param name="Background">バックグラウンド</param>
public sealed record PersonaConfig(
    string? NameAndTitle = null,
    string? PersonalityAndTone = null,
    string? Background = null
);

/// <summary>
/// 役割設定
/// </summary>
/// <param name="MainRole">主な役割</param>
/// <param name="FinalGoal">最終目標</param>
public sealed record RoleConfig(
    string? MainRole = null,
    string? FinalGoal = null
);