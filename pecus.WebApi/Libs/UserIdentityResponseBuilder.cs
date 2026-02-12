using Pecus.Libs.DB.Models;
using Pecus.Models.Responses.User;

namespace Pecus.Libs;

/// <summary>
/// UserIdentityResponse の生成ヘルパー
/// </summary>
public static class UserIdentityResponseBuilder
{
    /// <summary>
    /// User エンティティから UserIdentityResponse を生成
    /// </summary>
    /// <param name="user">ユーザーエンティティ（nullの場合はnullを返す）</param>
    /// <returns>UserIdentityResponse または null</returns>
    public static UserIdentityResponse? FromUser(User? user)
    {
        if (user == null) return null;

        return new UserIdentityResponse
        {
            Id = user.Id,
            Username = user.Username,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: user.AvatarType,
                userId: user.Id,
                username: user.Username,
                email: user.Email,
                avatarPath: user.UserAvatarPath
            ),
            IsActive = user.IsActive,
        };
    }

    /// <summary>
    /// User エンティティから UserIdentityResponse を生成（ID指定版）
    /// nullable な User と ID が別々に渡される場合用（例：OwnerId と Owner）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="user">ユーザーエンティティ（nullの場合でもIDでレスポンスを生成）</param>
    /// <returns>UserIdentityResponse</returns>
    public static UserIdentityResponse FromUserWithId(int userId, User? user)
    {
        return new UserIdentityResponse
        {
            Id = userId,
            Username = user?.Username,
            IdentityIconUrl = user != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: user.AvatarType,
                    userId: user.Id,
                    username: user.Username,
                    email: user.Email,
                    avatarPath: user.UserAvatarPath
                )
                : null,
            IsActive = user?.IsActive ?? false,
        };
    }

    /// <summary>
    /// nullable な UserId と User から UserIdentityResponse を生成
    /// UserId が null の場合は null を返す
    /// </summary>
    /// <param name="userId">ユーザーID（nullの場合はnullを返す）</param>
    /// <param name="user">ユーザーエンティティ</param>
    /// <returns>UserIdentityResponse または null</returns>
    public static UserIdentityResponse? FromNullableUserWithId(int? userId, User? user)
    {
        if (userId == null) return null;

        return new UserIdentityResponse
        {
            Id = userId.Value,
            Username = user?.Username,
            IdentityIconUrl = user != null
                ? IdentityIconHelper.GetIdentityIconUrl(
                    iconType: user.AvatarType,
                    userId: user.Id,
                    username: user.Username,
                    email: user.Email,
                    avatarPath: user.UserAvatarPath
                )
                : null,
            IsActive = user?.IsActive ?? false,
        };
    }
}