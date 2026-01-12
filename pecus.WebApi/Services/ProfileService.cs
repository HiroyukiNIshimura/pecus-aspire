using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Security;

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
    private readonly FileUploadService _fileUploadService;
    private readonly IWebHostEnvironment _environment;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public ProfileService(
        ApplicationDbContext context,
        ILogger<ProfileService> logger,
        RefreshTokenService refreshTokenService,
        UserService userService,
        FileUploadService fileUploadService,
        IWebHostEnvironment environment
    )
    {
        _context = context;
        _logger = logger;
        _refreshTokenService = refreshTokenService;
        _userService = userService;
        _fileUploadService = fileUploadService;
        _environment = environment;
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
    /// ユーザーの接続したデバイス情報の一覧を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>デバイス（セッション）情報の一覧</returns>
    public async Task<List<DeviceResponse>> GetUserDevicesAsync(int userId)
    {
        var devices = await _context.Devices
            .Where(d => d.UserId == userId && d.IsRevoked == false)
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
            FirstSeenAt = d.FirstSeenAt,
            LastSeenAt = d.LastSeenAt,
            LastIpMasked = d.LastIpMasked,
            LastSeenLocation = d.LastSeenLocation,
            Timezone = d.Timezone,
        }).ToList();

        return response;
    }

    /// <summary>
    /// 現在のリクエスト情報からデバイスをマッチングしてPublicIdを取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="deviceType">デバイス種別</param>
    /// <param name="os">OS</param>
    /// <param name="userAgent">User-Agent</param>
    /// <param name="ipAddress">IPアドレス</param>
    /// <returns>マッチしたデバイスのPublicId、見つからない場合はnull</returns>
    public async Task<string?> FindMatchingDevicePublicIdAsync(
        int userId,
        DeviceType deviceType,
        OSPlatform os,
        string? userAgent,
        string? ipAddress)
    {
        var hashedIdentifier = GenerateDeviceIdentifier(deviceType, os, userAgent, ipAddress);

        var device = await _context.Devices
            .AsNoTracking()
            .Where(d => d.UserId == userId && d.HashedIdentifier == hashedIdentifier && !d.IsRevoked)
            .Select(d => new { d.PublicId })
            .FirstOrDefaultAsync();

        return device?.PublicId;
    }

    /// <summary>
    /// デバイス識別子を生成します（RefreshTokenServiceと同じロジック）
    /// </summary>
    private static string GenerateDeviceIdentifier(DeviceType deviceType, OSPlatform os, string? userAgent, string? ipAddress)
    {
        var identifier = $"{deviceType}:{os}:{userAgent ?? "unknown"}:{ipAddress ?? "unknown"}";
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hash = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(identifier));
        return Convert.ToBase64String(hash);
    }

    /// <summary>
    /// 自ユーザーの設定を更新
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="request">更新リクエスト</param>
    /// <returns>更新後の設定レスポンス。ユーザーが見つからない場合は null</returns>
    public async Task<UserSettingResponse?> UpdateOwnSettingAsync(int userId, UpdateUserSettingRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = await _context.Users
                .Include(u => u.Setting)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            if (user == null)
            {
                _logger.LogWarning("ユーザー設定更新失敗: ユーザーが見つかりません。UserId: {UserId}", userId);
                return null;
            }

            var setting = user.Setting;

            if (setting == null)
            {
                setting = new UserSetting
                {
                    UserId = userId,
                    CanReceiveEmail = request.CanReceiveEmail,
                    CanReceiveRealtimeNotification = request.CanReceiveRealtimeNotification,
                    TimeZone = request.TimeZone,
                    Language = request.Language,
                    LandingPage = request.LandingPage,
                    FocusScorePriority = request.FocusScorePriority,
                    FocusTasksLimit = request.FocusTasksLimit,
                    WaitingTasksLimit = request.WaitingTasksLimit,
                    BadgeVisibility = request.BadgeVisibility,
                    UpdatedAt = DateTimeOffset.UtcNow,
                    UpdatedByUserId = userId,
                };

                _context.UserSettings.Add(setting);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new UserSettingResponse
                {
                    CanReceiveEmail = setting.CanReceiveEmail,
                    CanReceiveRealtimeNotification = setting.CanReceiveRealtimeNotification,
                    TimeZone = setting.TimeZone,
                    Language = setting.Language,
                    LandingPage = setting.LandingPage,
                    FocusScorePriority = setting.FocusScorePriority,
                    FocusTasksLimit = setting.FocusTasksLimit,
                    WaitingTasksLimit = setting.WaitingTasksLimit,
                    BadgeVisibility = setting.BadgeVisibility,
                    RowVersion = setting.RowVersion,
                };
            }

            setting.CanReceiveEmail = request.CanReceiveEmail;
            setting.CanReceiveRealtimeNotification = request.CanReceiveRealtimeNotification;
            setting.TimeZone = request.TimeZone;
            setting.Language = request.Language;
            setting.LandingPage = request.LandingPage;
            setting.FocusScorePriority = request.FocusScorePriority;
            setting.FocusTasksLimit = request.FocusTasksLimit;
            setting.WaitingTasksLimit = request.WaitingTasksLimit;
            setting.BadgeVisibility = request.BadgeVisibility;
            setting.UpdatedAt = DateTimeOffset.UtcNow;
            setting.UpdatedByUserId = userId;

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(setting).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogDebug(
                "ユーザー設定を更新しました。UserId: {UserId}, CanReceiveEmail: {CanReceiveEmail}",
                userId,
                request.CanReceiveEmail
            );

            return new UserSettingResponse
            {
                CanReceiveEmail = setting.CanReceiveEmail,
                CanReceiveRealtimeNotification = setting.CanReceiveRealtimeNotification,
                TimeZone = setting.TimeZone,
                Language = setting.Language,
                LandingPage = setting.LandingPage,
                FocusScorePriority = setting.FocusScorePriority,
                FocusTasksLimit = setting.FocusTasksLimit,
                WaitingTasksLimit = setting.WaitingTasksLimit,
                BadgeVisibility = setting.BadgeVisibility,
                RowVersion = setting.RowVersion,
            };
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            _logger.LogWarning(
                "ユーザー設定更新失敗: 競合が発生しました。UserId: {UserId}",
                userId
            );
            await RaiseSettingConflictException(userId);
            return null; // RaiseSettingConflictException が throw するため、ここには到達しない
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(
                "ユーザー設定更新失敗: 予期しないエラーが発生しました。UserId: {UserId}, Error: {Error}",
                userId,
                ex.Message
            );
            throw;
        }
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
            _logger.LogDebug("デバイスに関連するリフレッシュトークンを無効化しました。DeviceId: {DeviceId}, TokenCount: {TokenCount}", deviceId, device.RefreshTokens.Count(rt => !rt.IsRevoked));
        }

        return true;
    }

    /// <summary>
    /// ユーザー情報を取得（有効性チェック用）
    /// </summary>
    /// <remarks>
    /// コントローラーでユーザーの有効性チェックを行うための簡潔なメソッドです。
    /// ユーザーが存在し、かつ有効（IsActive = true）な場合のみユーザー情報を返します。
    /// ロール情報も含めて取得します。
    /// </remarks>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ユーザー情報（ロール含む）、見つからないか無効な場合は null</returns>
    public async Task<User?> GetUserAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Roles)
            .Include(u => u.Setting)
            .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
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
    public async Task<UserDetailResponse?> GetOwnProfileAsync(int userId)
    {
        var user = await _userService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        var response = new UserDetailResponse
        {
            Id = user.Id,
            OrganizationId = user.OrganizationId,
            LoginId = user.LoginId,
            Username = user.Username,
            Email = user.Email,
            AvatarType = user.AvatarType,
            UserAvatarPath = user.UserAvatarPath,
            IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                iconType: user.AvatarType,
                userId: user.Id,
                username: user.Username,
                email: user.Email,
                avatarPath: user.UserAvatarPath
            ),
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
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
            IsAdmin = user.Roles?.Any(r => r.Name == SystemRole.Admin || r.Name == SystemRole.BackOffice) ?? false,
            IsActive = user.IsActive,
            RowVersion = user.RowVersion!,
            Setting = new UserSettingResponse
            {
                CanReceiveEmail = user.Setting?.CanReceiveEmail ?? true,
                CanReceiveRealtimeNotification = user.Setting?.CanReceiveRealtimeNotification ?? true,
                TimeZone = user.Setting?.TimeZone ?? "Asia/Tokyo",
                Language = user.Setting?.Language ?? "ja-JP",
                LandingPage = user.Setting?.LandingPage,
                FocusScorePriority = user.Setting?.FocusScorePriority ?? FocusScorePriority.Deadline,
                FocusTasksLimit = user.Setting?.FocusTasksLimit ?? 5,
                WaitingTasksLimit = user.Setting?.WaitingTasksLimit ?? 5,
                BadgeVisibility = user.Setting?.BadgeVisibility,
                RowVersion = user.Setting?.RowVersion ?? 0,
            },
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

            // 古いUserAvatarPathを保存（削除用）
            var oldAvatarPath = user.UserAvatarPath;

            // ユーザー名の更新
            if (!string.IsNullOrWhiteSpace(request.Username))
            {
                user.Username = request.Username.Trim();
            }

            // アバタータイプ・アバターURLの更新
            if (request.AvatarType != null)
            {
                // AvatarType="UserAvatar"の場合
                if (request.AvatarType == AvatarType.UserAvatar)
                {
                    // 新しいUserAvatarPathが指定されている場合は更新
                    if (!string.IsNullOrWhiteSpace(request.UserAvatarPath))
                    {
                        user.UserAvatarPath = request.UserAvatarPath;
                    }
                    // 既存のUserAvatarPathもない場合はエラー
                    else if (string.IsNullOrWhiteSpace(user.UserAvatarPath))
                    {
                        throw new InvalidOperationException(
                            "AvatarType が 'UserAvatar' の場合、画像をアップロードするか、既存の画像が必要です。"
                        );
                    }
                    // 既存のUserAvatarPathがある場合はそのまま使用（何もしない）
                }
                else
                {
                    // UserAvatar以外の場合、UserAvatarPathは保持する（削除しない）
                    // これにより、後でUserAvatarに戻したときに画像を再利用できる
                }

                user.AvatarType = request.AvatarType;
            }

            // 更新メタデータを設定
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = userId; // 自己変更

            // OriginalValue に設定することで WHERE 句に RowVersion 条件が追加される
            _context.Entry(user).Property(e => e.RowVersion).OriginalValue = request.RowVersion;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // UserAvatarPathが変更された場合、古いファイルを削除
            if (
                request.AvatarType == AvatarType.UserAvatar &&
                !string.IsNullOrWhiteSpace(oldAvatarPath) &&
                !string.IsNullOrWhiteSpace(user.UserAvatarPath) &&
                oldAvatarPath != user.UserAvatarPath &&
                user.OrganizationId.HasValue
            )
            {
                try
                {
                    // 新しいファイル名を取得（UserAvatarPathにはファイル名のみが保存されている）
                    var newFileName = user.UserAvatarPath;

                    // ユーザーのアバターディレクトリパスを構築
                    var avatarDirectory = Path.Combine(
                        _environment.ContentRootPath,
                        "uploads",
                        user.OrganizationId.Value.ToString(),
                        "avatar",
                        userId.ToString()
                    );

                    // ディレクトリが存在する場合、新しいファイル以外を削除
                    if (Directory.Exists(avatarDirectory))
                    {
                        var allFiles = Directory.GetFiles(avatarDirectory);
                        var deletedFiles = new List<string>();

                        foreach (var filePath in allFiles)
                        {
                            var fileName = Path.GetFileName(filePath);

                            // 新しいファイル名のベース部分（拡張子なし）を取得
                            // WebP変換により拡張子が変わる可能性があるため、ベース部分で比較
                            var newFileNameWithoutExt = Path.GetFileNameWithoutExtension(newFileName);
                            var currentFileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);

                            // ベース部分が一致するファイル（.webp, .jpg, .png など）と_org付きファイルは保護
                            // 例: abc.webp, abc.jpg, abc_org.jpg などすべて保護
                            var isNewFile = currentFileNameWithoutExt == newFileNameWithoutExt;
                            var isOriginalFile = currentFileNameWithoutExt == $"{newFileNameWithoutExt}_org";

                            if (!isNewFile && !isOriginalFile)
                            {
                                File.Delete(filePath);
                                deletedFiles.Add(fileName);
                            }
                        }

                        if (deletedFiles.Count > 0)
                        {
                            _logger.LogDebug(
                                "古いアバターファイルを削除しました。UserId: {UserId}, DeletedFiles: {DeletedFiles}",
                                userId,
                                string.Join(", ", deletedFiles)
                            );
                        }
                    }
                }
                catch (Exception ex)
                {
                    // ファイル削除失敗はログのみ（トランザクションは成功扱い）
                    _logger.LogWarning(
                        ex,
                        "古いアバターファイルの削除に失敗しました。UserId: {UserId}, UserAvatarPath: {UserAvatarPath}",
                        userId,
                        user.UserAvatarPath
                    );
                }
            }

            _logger.LogDebug(
                "プロフィール情報を更新しました。UserId: {UserId}, UpdatedFields: {UpdatedFields}",
                userId,
                "username, avatar"
            );

            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync();
            _logger.LogWarning("プロフィール更新失敗: 競合が発生しました。UserId: {UserId}", userId);
            await RaiseUserConflictException(userId);
            return false; // RaiseUserConflictException が throw するため、ここには到達しない
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
    public async Task<bool> SetOwnSkillsAsync(int userId, List<int>? skillIds, uint? userRowVersion = null)
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

        _logger.LogDebug(
            "自身のスキルを更新しました。UserId: {UserId}, SkillCount: {SkillCount}",
            userId,
            skillIds?.Count ?? 0
        );

        return true;
    }

    private async Task RaiseSettingConflictException(int userId)
    {
        var latestSetting = await _context.UserSettings.FirstOrDefaultAsync(us => us.UserId == userId);
        if (latestSetting == null)
        {
            throw new NotFoundException("ユーザー設定が見つかりません。");
        }

        throw new ConcurrencyException<UserSettingResponse>(
            "別のユーザーが同時に設定を変更しました。最新の設定を取得して再度操作してください。",
            new UserSettingResponse
            {
                CanReceiveEmail = latestSetting.CanReceiveEmail,
                CanReceiveRealtimeNotification = latestSetting.CanReceiveRealtimeNotification,
                TimeZone = latestSetting.TimeZone,
                Language = latestSetting.Language,
                LandingPage = latestSetting.LandingPage,
                FocusScorePriority = latestSetting.FocusScorePriority,
                FocusTasksLimit = latestSetting.FocusTasksLimit,
                WaitingTasksLimit = latestSetting.WaitingTasksLimit,
                BadgeVisibility = latestSetting.BadgeVisibility,
                RowVersion = latestSetting.RowVersion,
            }
        );
    }

    private async Task RaiseUserConflictException(int userId)
    {
        var latestUser = await GetOwnProfileAsync(userId);
        if (latestUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        throw new ConcurrencyException<UserDetailResponse>(
            "別のユーザーが同時にプロフィールを変更しました。最新のプロフィールを取得して再度操作してください。",
            latestUser
        );
    }

    /// <summary>
    /// ユーザーの公開設定を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>ユーザーの公開設定</returns>
    public async Task<UserPublicSettings> GetUserPublicSettingsAsync(int userId)
    {
        var setting = await _context.UserSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (setting == null)
        {
            // 設定が存在しない場合はデフォルト値を返す
            return new UserPublicSettings
            {
                TimeZone = "Asia/Tokyo",
                Language = "ja-JP",
                CanReceiveEmail = true,
                CanReceiveRealtimeNotification = true,
                LandingPage = null,
                FocusScorePriority = FocusScorePriority.Deadline,
                FocusTasksLimit = 5,
                WaitingTasksLimit = 5,
            };
        }

        return new UserPublicSettings
        {
            TimeZone = setting.TimeZone,
            Language = setting.Language,
            CanReceiveEmail = setting.CanReceiveEmail,
            CanReceiveRealtimeNotification = setting.CanReceiveRealtimeNotification,
            LandingPage = setting.LandingPage,
            FocusScorePriority = setting.FocusScorePriority,
            FocusTasksLimit = setting.FocusTasksLimit,
            WaitingTasksLimit = setting.WaitingTasksLimit,
        };
    }

    /// <summary>
    /// 現在のユーザー情報（最小限）を取得
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <returns>現在のユーザー情報</returns>
    /// <exception cref="NotFoundException">ユーザーが見つからない場合</exception>
    public async Task<CurrentUserInfo> GetCurrentUserInfoAsync(int userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new NotFoundException("ユーザーが見つかりません。");

        var identityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
            user.AvatarType,
            user.Id,
            user.Username,
            user.Email,
            user.UserAvatarPath
        );

        return new CurrentUserInfo
        {
            Id = user.Id,
            OrganizationId = user.OrganizationId ?? 0,
            Username = user.Username,
            Email = user.Email,
            IdentityIconUrl = identityIconUrl,
            IsAdmin = user.Roles.Any(r => r.Name == SystemRole.Admin || r.Name == SystemRole.BackOffice),
            IsBackOffice = user.Roles.Any(r => r.Name == SystemRole.BackOffice),
        };
    }
}