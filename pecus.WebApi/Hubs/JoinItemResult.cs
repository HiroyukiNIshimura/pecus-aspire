using Pecus.Services;

namespace Pecus.Hubs;

/// <summary>
/// JoinItem の戻り値。プレゼンスユーザー一覧と編集状態を含む。
/// </summary>
/// <param name="ExistingUsers">既に入室しているユーザー一覧</param>
/// <param name="EditStatus">現在の編集状態</param>
public record JoinItemResult(
    List<PresenceUser> ExistingUsers,
    ItemEditStatus EditStatus
);
