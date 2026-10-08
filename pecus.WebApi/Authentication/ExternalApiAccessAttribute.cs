using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Authentication;

/// <summary>
/// 外部APIのアクション（またはコントローラー）に必要な最低ロールを宣言する。
/// 属性が付与されていない外部APIは常に403となる（デフォルト拒否）。
/// 判定は <c>BaseExternalApiController</c> で行う。
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public sealed class ExternalApiAccessAttribute(ExternalApiKeyRole requiredRole) : Attribute
{
    /// <summary>
    /// 必要な最低ロール
    /// </summary>
    public ExternalApiKeyRole RequiredRole { get; } = requiredRole;

    /// <summary>
    /// キーのロールが要求を満たすか判定する。
    /// FullAccess は全属性を許可し、ReadOnly は ReadOnly 属性のみ許可する。
    /// </summary>
    public bool IsSatisfiedBy(ExternalApiKeyRole? keyRole) => keyRole switch
    {
        ExternalApiKeyRole.FullAccess => true,
        ExternalApiKeyRole.ReadOnly => RequiredRole == ExternalApiKeyRole.ReadOnly,
        _ => false,
    };
}
