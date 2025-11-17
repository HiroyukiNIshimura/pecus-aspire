import type { UserResponse } from "@/connectors/api/pecus";
import type { UserInfo } from "@/types/userInfo";

/**
 * UserResponse を UserInfo に変換
 *
 * WebAPI のレスポンス型（UserResponse）からコンポーネント用の型（UserInfo）へ変換します。
 * この関数を使用することで、各ページでの変換ロジックの重複を防ぎます。
 *
 * @param userResponse - WebAPI から取得したユーザー情報
 * @returns コンポーネント用のユーザー情報
 *
 * @example
 * ```typescript
 * const api = createPecusApiClients();
 * const userResponse = await api.profile.getApiProfile();
 * const user = mapUserResponseToUserInfo(userResponse);
 * ```
 */
export function mapUserResponseToUserInfo(
  userResponse: UserResponse,
): UserInfo {
  return {
    id: userResponse.id,
    name: userResponse.username ?? null,
    email: userResponse.email ?? null,
    roles: userResponse.roles ?? [],
    isAdmin: userResponse.isAdmin ?? false,
    skills: userResponse.skills?.map((s) => ({ id: s.id, name: s.name })) ?? [],
    loginId: userResponse.loginId,
    username: userResponse.username,
    rowVersion: userResponse.rowVersion,
    avatarType: userResponse.avatarType,
    userAvatarPath: userResponse.userAvatarPath,
    identityIconUrl: userResponse.identityIconUrl,
    createdAt: userResponse.createdAt,
  };
}
