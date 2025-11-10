using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Security;
using Pecus.Models.Requests;
using Pecus.Models.Responses.User;

namespace Pecus.Services;

/// <summary>
/// プロフィール関連のサービス
/// </summary>
/// <remarks>
/// <para>
/// <strong>責務</strong>：ユーザー設定・セキュリティ関連の操作を担当
/// </para>
/// <list type="bullet">
/// <item>
///   <description>
///     メールアドレス変更：セキュリティ関連操作（確認・検証・ログが必要）
///   </description>
/// </item>
/// <item>
///   <description>
///     デバイス管理：セッション・セキュリティ管理（トークン無効化が伴う）
///   </description>
/// </item>
/// </list>
/// <para>
/// <strong>対比：UserService との使い分け</strong>
/// </para>
/// <list type="bullet">
/// <item>
///   <description>
///     <strong>UserService</strong>：ユーザーの基本情報・属性
///     <br/>ユーザー名、アバター、スキル、ロール、組織などの属性管理
///   </description>
/// </item>
/// <item>
///   <description>
///     <strong>ProfileService</strong>：ユーザー設定・セキュリティ
///     <br/>メール変更（セキュリティ）、デバイス管理（セッション）
///   </description>
/// </item>
/// </list>
/// </remarks>
public class ProfileService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProfileService> _logger;
    private readonly RefreshTokenService _refreshTokenService;
    private readonly UserService _userService;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileService(
        ApplicationDbContext context,
        ILogger<ProfileService> logger,
        RefreshTokenService refreshTokenService,
        UserService userService
    )
    {
        _context = context;
        _logger = logger;
        _refreshTokenService = refreshTokenService;
        _userService = userService;
    }

    /// <summary>
    /// メールアドレスを変更
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="newEmail">新しいメールアドレス</param>
    /// <returns>成功した場合はtrue、失敗した場合はfalse</returns>
    public async Task<bool> UpdateEmailAsync(int userId, string newEmail)
    {
        // 新しいメールアドレスが既に使用されていないかチェック
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == newEmail);
        if (existingUser != null)
        {
            _logger.LogWarning("メールアドレス変更失敗: 既に使用されているメールアドレスです。UserId: {UserId}, NewEmail: {NewEmail}", userId, newEmail);
            return false;
        }

        // ユーザー取得
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("メールアドレス変更失敗: ユーザーが見つかりません。UserId: {UserId}", userId);
            return false;
        }

        // DB更新
        user.Email = newEmail;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = userId;

        await _context.SaveChangesAsync();

        _logger.LogInformation("メールアドレスを変更しました。UserId: {UserId}, NewEmail: {NewEmail}", userId, newEmail);
        return true;
    }

    /// <summary>
    /// ユーザーの有効なデバイス情報の一覧を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>デバイス情報の一覧</returns>
    public async Task<List<DeviceResponse>> GetUserDevicesAsync(int userId)
    {
        var devices = await _context.Devices
            .Where(d => d.UserId == userId && !d.IsRevoked)
            .Include(d => d.RefreshTokens)
            .OrderByDescending(d => d.LastSeenAt)
            .ToListAsync();

        var response = devices.Select(d => new DeviceResponse
        {
            Id = d.Id,
            PublicId = d.PublicId,
            Name = d.Name,
            DeviceType = d.DeviceType.ToString(),
            OS = d.OS.ToString(),
            Client = d.Client,
            AppVersion = d.AppVersion,
            FirstSeenAt = d.FirstSeenAt,
            LastSeenAt = d.LastSeenAt,
            LastIpMasked = d.LastIpMasked,
            LastSeenLocation = d.LastSeenLocation,
            Timezone = d.Timezone,
            RefreshTokenCount = d.RefreshTokens.Count(rt => !rt.IsRevoked),
            IsRevoked = d.IsRevoked,
        }).ToList();

        return response;
    }

    /// <summary>
    /// ユーザーのデバイスを削除（関連するリフレッシュトークンも削除）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="deviceId">デバイスID</param>
    /// <returns>削除に成功した場合はtrue、デバイスが見つからない場合はfalse</returns>
    public async Task<bool> DeleteUserDeviceAsync(int userId, int deviceId)
    {
        // デバイスを取得（ユーザー所有確認）
        var device = await _context.Devices
            .Include(d => d.RefreshTokens)
            .FirstOrDefaultAsync(d => d.Id == deviceId && d.UserId == userId);

        if (device == null)
        {
            _logger.LogWarning("デバイス削除失敗: デバイスが見つからないか、アクセス権限がありません。UserId: {UserId}, DeviceId: {DeviceId}", userId, deviceId);
            return false;
        }

        // 関連するリフレッシュトークンを無効化
        if (device.RefreshTokens.Any())
        {
            foreach (var refreshToken in device.RefreshTokens.Where(rt => !rt.IsRevoked))
            {
                await _refreshTokenService.RevokeRefreshTokenAsync(refreshToken.Token);
            }
            _logger.LogInformation("デバイスに関連するリフレッシュトークンを無効化しました。DeviceId: {DeviceId}, TokenCount: {TokenCount}", deviceId, device.RefreshTokens.Count(rt => !rt.IsRevoked));
        }

        return true;
    }

    /// <summary>
    /// ユーザー情報を取得（有効性チェック用）
    /// </summary>
    /// <remarks>
    /// コントローラーでユーザーの有効性チェックを行うための簡潔なメソッドです。
    /// ユーザーが存在し、かつ有効（IsActive = true）な場合のみユーザー情報を返します。
    /// </remarks>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ユーザー情報、見つからないか無効な場合は null</returns>
    public async Task<User?> GetUserAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        return user;
    }

    /// <summary>
    /// 自ユーザーのプロフィール情報を取得
    /// </summary>
    /// <remarks>
    /// ユーザーの基本情報（ユーザー名、アバター、スキル、ロール等）を取得します。
    /// 内部で UserService を呼び出してユーザー情報を取得します。
    /// </remarks>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ユーザーレスポンス、見つからない場合は null</returns>
    public async Task<UserResponse?> GetOwnProfileAsync(int userId)
    {
        var user = await _userService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        var response = new UserResponse
        {
            Id = user.Id,
            LoginId = user.LoginId,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType,
            IdentityIconUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt,
            Roles = user.Roles?
                .Select(r => new UserRoleResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                })
                .ToList() ?? new List<UserRoleResponse>(),
            Skills = user.UserSkills?
                .Select(us => new UserSkillResponse
                {
                    Id = us.Skill.Id,
                    Name = us.Skill.Name,
                })
                .ToList() ?? new List<UserSkillResponse>(),
            IsAdmin = user.Roles?.Any(r => r.Name == "Admin") ?? false,
            IsActive = user.IsActive,
            RowVersion = user.RowVersion!,
        };

        return response;
    }

    /// <summary>
    /// 自ユーザーのプロフィール情報を更新
    /// </summary>
    /// <remarks>
    /// ユーザーが自身のプロフィール（ユーザー名、アバタータイプ、アバターURL）を更新します。
    /// スキル更新は別メソッド（SetOwnSkillsAsync）で実施されます。
    /// 将来の仕様変更に対応しやすくするため、ProfileService で独立して実装しています。
    /// </remarks>
    /// <param name="userId">ユーザーID</param>
    /// <param name="request">更新情報</param>
    /// <returns>成功時は true、失敗時は false</returns>
    public async Task<bool> UpdateOwnProfileAsync(int userId, UpdateProfileRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // ユーザーを取得
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("プロフィール更新失敗: ユーザーが見つかりません。UserId: {UserId}", userId);
                return false;
            }

            // ユーザー名の更新
            if (!string.IsNullOrWhiteSpace(request.Username))
            {
                user.Username = request.Username.Trim();
            }

            // アバタータイプ・アバターURLの更新
            if (request.AvatarType != null)
            {
                // AvatarType="user-avatar"の場合、AvatarUrlが必須
                if (request.AvatarType == "user-avatar" && string.IsNullOrWhiteSpace(request.AvatarUrl))
                {
                    throw new InvalidOperationException(
                        "AvatarType が 'user-avatar' の場合、AvatarUrl は必須です。"
                    );
                }

                user.AvatarType = request.AvatarType;

                // AvatarUrlが指定されている場合のみ更新
                if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
                {
                    user.AvatarUrl = request.AvatarUrl;
                }
            }

            // 更新メタデータを設定
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = userId; // 自己変更

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation(
                "プロフィール情報を更新しました。UserId: {UserId}, UpdatedFields: {UpdatedFields}",
                userId,
                "username, avatar"
            );

            return true;
        }
        catch (DbUpdateConcurrencyException ex)
        {
            await transaction.RollbackAsync();
            _logger.LogWarning("プロフィール更新失敗: 競合が発生しました。UserId: {UserId}, Error: {Error}", userId, ex.Message);
            throw;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError("プロフィール更新失敗: 予期しないエラーが発生しました。UserId: {UserId}, Error: {Error}", userId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// 自ユーザーのパスワードを変更
    /// </summary>
    /// <remarks>
    /// ユーザーが現在のパスワードを検証した上で、新しいパスワードに変更します。
    /// 現在のパスワードが正しくない場合は false を返します。
    /// </remarks>
    /// <param name="userId">ユーザーID</param>
    /// <param name="currentPassword">現在のパスワード</param>
    /// <param name="newPassword">新しいパスワード</param>
    /// <returns>成功時は true、現在のパスワードが正しくない場合は false</returns>
    public async Task<bool> UpdatePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("パスワード変更失敗: ユーザーが見つかりません。UserId: {UserId}", userId);
                return false;
            }

            // 現在のパスワードを検証
            if (!PasswordHasher.VerifyPassword(currentPassword, user.PasswordHash))
            {
                _logger.LogWarning("パスワード変更失敗: 現在のパスワードが正しくありません。UserId: {UserId}", userId);
                return false;
            }

            // 新しいパスワードをハッシュ化
            user.PasswordHash = PasswordHasher.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = userId; // 自己変更

            await _context.SaveChangesAsync();

            _logger.LogInformation("パスワードを変更しました。UserId: {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError("パスワード変更失敗: 予期しないエラーが発生しました。UserId: {UserId}, Error: {Error}", userId, ex.Message);
            throw;
        }
    }

    /// <summary>
    /// 自ユーザーのスキルを設定
    /// </summary>
    /// <remarks>
    /// ユーザーが自身のスキルを設定します（洗い替え）。
    /// 指定されたスキル以外のスキルは削除されます。
    /// 内部で UserService を呼び出してスキル更新処理を実行します。
    /// </remarks>
    /// <param name="userId">ユーザーID</param>
    /// <param name="skillIds">スキルIDのリスト</param>
    /// <param name="userRowVersion">ユーザーの楽観的ロック用 RowVersion</param>
    /// <returns>成功時は true、失敗時は false</returns>
    public async Task<bool> SetOwnSkillsAsync(int userId, List<int>? skillIds, byte[]? userRowVersion = null)
    {
        // UserService で実装されているスキル設定を呼び出し
        // updatedByUserId を userId に設定（自己変更）
        var result = await _userService.SetUserSkillsAsync(
            userId: userId,
            skillIds: skillIds,
            userRowVersion: userRowVersion,
            updatedByUserId: userId
        );

        if (!result)
        {
            _logger.LogWarning("スキル設定失敗: ユーザーが見つかりません。UserId: {UserId}", userId);
            return false;
        }

        _logger.LogInformation(
            "自身のスキルを更新しました。UserId: {UserId}, SkillCount: {SkillCount}",
            userId,
            skillIds?.Count ?? 0
        );

        return true;
    }
}