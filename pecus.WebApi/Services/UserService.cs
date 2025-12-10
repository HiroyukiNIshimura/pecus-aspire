using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;
using System.Security.Cryptography;

namespace Pecus.Services;

/// <summary>
/// ユーザー管理サービス
/// </summary>
/// <remarks>
/// <para>
/// <strong>責務</strong>：ユーザーの基本情報・属性の取得・管理を担当
/// </para>
/// <list type="bullet">
/// <item>
///   <description>
///     ユーザー基本情報：ユーザーID、ログインID、ユーザー名、メール、アバター等の属性
///   </description>
/// </item>
/// <item>
///   <description>
///     ユーザー属性：スキル、ロール、権限、組織、ワークスペース等の関連情報
///   </description>
/// </item>
/// </list>
/// <para>
/// <strong>対比：ProfileService との使い分け</strong>
/// </para>
/// <list type="bullet">
/// <item>
///   <description>
///     <strong>UserService</strong>：ユーザーの基本情報・属性
///     <br/>ユーザー名、アバター、スキル、ロール、属性管理
///   </description>
/// </item>
/// <item>
///   <description>
///     <strong>ProfileService</strong>：ユーザー設定・セキュリティ関連
///     <br/>メール変更（セキュリティ）、デバイス管理（セッション）
///   </description>
/// </item>
/// </list>
/// </remarks>
public class UserService
{
    private readonly ApplicationDbContext _context;
    private readonly RefreshTokenService _refreshTokenService;

    public UserService(
        ApplicationDbContext context,
        RefreshTokenService refreshTokenService
    )
    {
        _context = context;
        _refreshTokenService = refreshTokenService;
    }

    /// <summary>
    /// ログイン認証（EmailまたはLoginIdとパスワード）
    /// </summary>
    public async Task<User?> AuthenticateAsync(LoginRequest request)
    {
        // EmailまたはLoginIdで検索
        var user = await _context
            .Users.Include(u => u.Roles)
            .FirstOrDefaultAsync(u =>
                (u.Email == request.LoginIdentifier || u.LoginId == request.LoginIdentifier)
                && u.IsActive
            );

        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return null;
        }

        // 最終ログイン日時を更新
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return user;
    }

    /// <summary>
    /// ユニークなLoginIdを生成
    /// </summary>
    private static async Task<string> GenerateUniqueLoginIdAsync(ApplicationDbContext context)
    {
        string loginId;
        bool exists;

        do
        {
            loginId = CodeGenerator.GenerateLoginId();

            // 既に存在するかチェック
            exists = await context.Users.AnyAsync(u => u.LoginId == loginId);
        } while (exists);

        return loginId;
    }

    /// <summary>
    /// ユーザーIDで取得(ロールと権限を含む)
    /// </summary>
    public async Task<User?> GetUserByIdAsync(int userId) =>
       await _context
      .Users.Include(u => u.Roles)
          .ThenInclude(r => r.Permissions)
      .Include(u => u.UserSkills).ThenInclude(us => us.Skill)
      .Include(u => u.Setting)
      .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

    /// <summary>
    /// 組織IDでユーザーをページネーション付きで取得
    /// </summary>
    /// <remarks>
    /// このメソッドは名前付き引数の使用を強く推奨します。
    ///
    /// 使用例:
    /// <code>
    /// await GetUsersByOrganizationPagedAsync(
    ///     organizationId: 1,
    ///     page: 1,
    ///     pageSize: 10,
    ///     isActive: true,
    ///     username: "admin",
    ///     skillIds: new List&lt;int&gt; { 1, 2, 3 },
    ///     skillFilterMode: "and"
    /// )
    /// </code>
    /// </remarks>
    public async Task<(List<User> users, int totalCount)> GetUsersByOrganizationPagedAsync(
        int organizationId,
        int page,
        int pageSize,
        bool? isActive = null,
        string? username = null,
        List<int>? skillIds = null,
        string skillFilterMode = "and"
    )
    {
        // 1. ベースクエリ（Include なし）
        var query = _context
            .Users
            .Where(u => u.OrganizationId == organizationId)
            .AsQueryable();

        // 2. フィルタ条件を適用
        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(username))
        {
            query = query.Where(u => u.Username.StartsWith(username));
        }

        if (skillIds != null && skillIds.Any())
        {
            // スキルフィルターモードに応じて AND/OR を切り替え
            if (skillFilterMode?.ToLower() == "or")
            {
                // OR条件: いずれかのスキルを持つユーザー
                query = query.Where(u => u.UserSkills.Any(us => skillIds.Contains(us.SkillId)));
            }
            else
            {
                // AND条件（デフォルト）: すべてのスキルを持つユーザー
                // サブクエリを使ってSQL側で評価させる
                foreach (var skillId in skillIds)
                {
                    var currentSkillId = skillId; // クロージャ対策
                    query = query.Where(u => u.UserSkills.Any(us => us.SkillId == currentSkillId));
                }
            }
        }

        query = query.OrderBy(u => u.Id);

        // 3. 総件数を取得（Include なし）
        var totalCount = await query.CountAsync();

        // 4. ページング + Include + AsSplitQuery でデカルト爆発防止
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(u => u.Roles)
            .Include(u => u.UserSkills)
                .ThenInclude(us => us.Skill)
            .Include(u => u.Setting)
            .AsSplitQuery()
            .ToListAsync();

        return (users, totalCount);
    }

    /// <summary>
    /// ユーザーを更新（プロフィール情報のみ）
    /// </summary>
    public async Task<User> UpdateUserAsync(
        int userId,
        UpdateUserRequest request,
        int? updatedByUserId = null
    )
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        // Usernameの更新
        user.Username = request.Username.Trim();

        // AvatarType="user-avatar"の場合、UserAvatarPathが必須
        if (request.AvatarType == AvatarType.UserAvatar && string.IsNullOrWhiteSpace(request.UserAvatarPath))
        {
            throw new InvalidOperationException(
                "AvatarType が 'user-avatar' の場合、UserAvatarPath は必須です。"
            );
        }

        user.AvatarType = request.AvatarType;

        // UserAvatarPathが指定されている場合のみ更新
        if (!string.IsNullOrWhiteSpace(request.UserAvatarPath))
        {
            user.UserAvatarPath = request.UserAvatarPath;
        }

        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = updatedByUserId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(userId);
        }

        return user;
    }

    /// <summary>
    /// ユーザーのアバターを更新
    /// </summary>
    public async Task<User> UpdateUserAvatarAsync(
        int userId,
        AvatarType avatarType,
        string userAvatarPath,
        int updatedByUserId
    )
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        user.AvatarType = avatarType;
        user.UserAvatarPath = userAvatarPath;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = updatedByUserId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(userId);
        }

        return user;
    }

    /// <summary>
    /// ユーザーのアクティブ状態を設定
    /// </summary>
    public async Task<bool> SetUserActiveStatusAsync(int userId, bool isActive, int updatedByUserId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return false;
        }

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = updatedByUserId;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            await RaiseConflictException(userId);
        }

        return true;
    }

    /// <summary>
    /// ユーザーを削除
    /// </summary>
    public async Task<bool> DeleteUserAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return false;
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// パスワードなしでユーザーを作成（管理者用）
    /// ロール情報も同時に登録します
    /// </summary>
    public async Task<User> CreateUserWithoutPasswordAsync(
        CreateUserWithoutPasswordRequest request,
        int? createdByUserId = null
    )
    {
        // メールアドレスの重複チェック
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new DuplicateException("メールアドレスは既に使用されています。");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // ユニークなLoginIdを生成
            var loginId = await GenerateUniqueLoginIdAsync(_context);

            // パスワード設定トークンを生成（24時間有効）
            var token = GeneratePasswordResetToken();
            var tokenExpiresAt = DateTime.UtcNow.AddHours(24);

            var user = new User
            {
                LoginId = loginId,
                Username = request.Username,
                Email = request.Email,
                PasswordHash = "", // パスワードは未設定
                PasswordResetToken = token,
                PasswordResetTokenExpiresAt = tokenExpiresAt,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId,
                IsActive = true,
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // ユーザー設定を作成（初期値はメール受信可）
            var setting = new UserSetting
            {
                UserId = user.Id,
                CanReceiveEmail = true,
                UpdatedAt = DateTimeOffset.UtcNow,
                UpdatedByUserId = createdByUserId,
            };

            _context.UserSettings.Add(setting);
            await _context.SaveChangesAsync();

            // ロールを設定（指定されている場合）
            if (request.Roles != null && request.Roles.Any())
            {
                // 指定されたロールIDが実際に存在するか確認
                var roles = await _context.Roles
                    .Where(r => request.Roles.Contains(r.Id))
                    .ToListAsync();

                if (roles.Count != request.Roles.Count)
                {
                    throw new InvalidOperationException("指定されたロールIDの一部が無効です。");
                }

                // ロールを追加
                foreach (var role in roles)
                {
                    user.Roles.Add(role);
                }

                await _context.SaveChangesAsync();
            }

            await transaction.CommitAsync();
            return user;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// パスワード設定トークンを使ってパスワードを設定
    /// </summary>
    public async Task<bool> SetUserPasswordAsync(SetUserPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == request.Token
            && u.PasswordResetTokenExpiresAt > DateTime.UtcNow
            && string.IsNullOrEmpty(u.PasswordHash) // パスワードが未設定のユーザーのみ
        );

        if (user == null)
        {
            return false; // 無効なトークンまたは期限切れ
        }

        // パスワードを設定
        user.PasswordHash = HashPassword(request.Password);
        user.PasswordResetToken = null; // トークンをクリア
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // すべてのデバイスのログイン状態をリセットする場合
        if (request.ResetAllDeviceSessions == true)
        {
            await _refreshTokenService.RevokeAllUserRefreshTokensAsync(user.Id);
        }

        return true;
    }

    /// <summary>
    /// パスワードリセットをリクエスト（メールアドレスベース）
    /// </summary>
    public async Task<(bool success, User? user)> RequestPasswordResetAsync(
        RequestPasswordResetRequest request
    )
    {
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.Email == request.Email && u.IsActive
        );

        if (user == null)
        {
            // セキュリティのため、ユーザーが存在しない場合も成功を返す
            return (true, null);
        }

        // パスワードリセットトークンを生成（24時間有効）
        var token = GeneratePasswordResetToken();
        var tokenExpiresAt = DateTime.UtcNow.AddHours(24);

        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiresAt = tokenExpiresAt;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, user);
    }

    /// <summary>
    /// パスワードリセットをリクエスト（管理者用）
    /// </summary>
    public async Task<(bool success, User? user)> RequestPasswordResetByUserIdAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

        if (user == null)
        {
            return (false, null);
        }

        // パスワードリセットトークンを生成（24時間有効）
        var token = GeneratePasswordResetToken();
        var tokenExpiresAt = DateTime.UtcNow.AddHours(24);

        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiresAt = tokenExpiresAt;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return (true, user);
    }

    /// <summary>
    /// パスワードをリセット
    /// </summary>
    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u =>
            u.PasswordResetToken == request.Token
            && u.PasswordResetTokenExpiresAt > DateTime.UtcNow
            && !string.IsNullOrEmpty(u.PasswordHash) // パスワードが設定済みのユーザーのみ
        );

        if (user == null)
        {
            return false; // 無効なトークンまたは期限切れ
        }

        // パスワードをリセット
        user.PasswordHash = HashPassword(request.Password);
        user.PasswordResetToken = null; // トークンをクリア
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// パスワードを検証
    /// </summary>
    private static bool VerifyPassword(string password, string passwordHash)
    {
        return PasswordHasher.VerifyPassword(password, passwordHash);
    }

    /// <summary>
    /// パスワードを検証（public）
    /// </summary>
    public static bool VerifyPasswordPublic(string password, string passwordHash)
    {
        return PasswordHasher.VerifyPassword(password, passwordHash);
    }

    /// <summary>
    /// パスワード設定トークンを生成
    /// </summary>
    private static string GeneratePasswordResetToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var tokenBytes = new byte[32];
        rng.GetBytes(tokenBytes);
        return Convert.ToBase64String(tokenBytes);
    }

    /// <summary>
    /// パスワードをハッシュ化
    /// </summary>
    private static string HashPassword(string password)
    {
        return PasswordHasher.HashPassword(password);
    }

    /// <summary>
    /// ユーザーのスキルを設定（洗い替え、楽観的ロック対応）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="skillIds">スキルIDのリスト</param>
    /// <param name="userRowVersion">ユーザーの楽観的ロック用のRowVersion</param>
    /// <param name="updatedByUserId">更新者のユーザーID</param>
    /// <returns>スキル更新の成功フラグ</returns>
    public async Task<bool> SetUserSkillsAsync(
        int userId,
        List<int>? skillIds,
        uint? userRowVersion = null,
        int? updatedByUserId = null
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = await _context
                .Users.Include(u => u.UserSkills)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return false;
            }

            // 楽観的ロック：UserRowVersionが指定されている場合は競合チェック
            if (userRowVersion != null && user.RowVersion != userRowVersion)
            {
                await RaiseConflictException(userId);
            }

            // 既存のスキルをすべて削除
            _context.UserSkills.RemoveRange(user.UserSkills);
            await _context.SaveChangesAsync();

            // 新しいスキルを追加
            if (skillIds != null && skillIds.Any())
            {
                foreach (var skillId in skillIds)
                {
                    var userSkill = new UserSkill
                    {
                        UserId = userId,
                        SkillId = skillId,
                        AddedAt = DateTime.UtcNow,
                        AddedByUserId = updatedByUserId,
                    };
                    _context.UserSkills.Add(userSkill);
                }
            }

            // 更新時刻を設定
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = updatedByUserId;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// 組織のユーザー統計情報を取得
    /// </summary>
    public async Task<UserStatistics> GetUserStatisticsByOrganizationAsync(int organizationId)
    {
        var statistics = new UserStatistics
        {
            ActiveUserCount = 0,
            InactiveUserCount = 0,
            SkillCounts = new List<SkillUserCountResponse>(),
            RoleCounts = new List<RoleUserCountResponse>(),
            WorkspaceParticipationCount = 0,
            NoWorkspaceParticipationCount = 0
        };

        // DbContextは並列実行に対応していないため、逐次実行に変更
        // アクティブなユーザー数
        statistics.ActiveUserCount = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.IsActive)
            .CountAsync();

        // 非アクティブなユーザー数
        statistics.InactiveUserCount = await _context.Users
            .Where(u => u.OrganizationId == organizationId && !u.IsActive)
            .CountAsync();

        // スキルごとのユーザー数
        statistics.SkillCounts = await _context.UserSkills
            .Where(us => us.User.OrganizationId == organizationId)
            .GroupBy(us => new { us.Skill.Id, us.Skill.Name })
            .Select(g => new SkillUserCountResponse
            {
                Id = g.Key.Id,
                Name = g.Key.Name,
                Count = g.Select(us => us.UserId).Distinct().Count()
            })
            .OrderBy(s => s.Name)
            .ToListAsync();

        // ロールごとのユーザー数（多対多リレーションを経由）
        var roleCounts = await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .SelectMany(u => u.Roles)
            .GroupBy(r => new { r.Id, r.Name })
            .Select(g => new
            {
                g.Key.Id,
                g.Key.Name,
                Count = g.Count()
            })
            .OrderBy(r => r.Name)
            .ToListAsync();

        // ロールごとのユーザー数（匿名型からRoleUserCountResponseに変換）
        statistics.RoleCounts = roleCounts
            .Select(r => new RoleUserCountResponse
            {
                Id = r.Id,
                Name = r.Name,
                Count = r.Count
            })
            .ToList();

        // ワークスペース参加状況
        statistics.WorkspaceParticipationCount = await _context.Users
            .Where(u => u.OrganizationId == organizationId && u.WorkspaceUsers.Any())
            .CountAsync();

        var totalUserCount = await _context.Users
            .Where(u => u.OrganizationId == organizationId)
            .CountAsync();

        statistics.NoWorkspaceParticipationCount = totalUserCount - statistics.WorkspaceParticipationCount;

        return statistics;
    }

    /// <summary>
    /// ユーザーのロールを設定（洗い替え、楽観的ロック対応）
    /// </summary>
    /// <param name="userId">ユーザーID</param>
    /// <param name="roleIds">ロールIDのリスト</param>
    /// <param name="userRowVersion">ユーザーの楽観的ロック用のRowVersion</param>
    /// <param name="updatedByUserId">更新者のユーザーID</param>
    /// <returns>ロール更新の成功フラグ</returns>
    public async Task<bool> SetUserRolesAsync(
        int userId,
        List<int>? roleIds,
        uint? userRowVersion = null,
        int? updatedByUserId = null
    )
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // ユーザーを取得（AsSplitQuery でデカルト爆発を防止）
            var user = await _context.Users
                .Include(u => u.Roles)
                .AsSplitQuery()
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return false;
            }

            // 楽観的ロック：UserRowVersionが指定されている場合は競合チェック
            if (userRowVersion != null && user.RowVersion != userRowVersion)
            {
                await RaiseConflictException(userId);
            }

            // 現在のロールをクリア
            user.Roles.Clear();

            // 新しいロールを設定（ロールIDがある場合のみ）
            if (roleIds != null && roleIds.Any())
            {
                // 指定されたロールIDが実際に存在するか確認
                var roles = await _context.Roles
                    .Where(r => roleIds.Contains(r.Id))
                    .ToListAsync();

                if (roles.Count != roleIds.Count)
                {
                    throw new InvalidOperationException("指定されたロールIDの一部が無効です。");
                }

                // ロールを追加
                foreach (var role in roles)
                {
                    user.Roles.Add(role);
                }
            }

            // 更新時刻を設定
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedByUserId = updatedByUserId;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task RaiseConflictException(int userId)
    {
        var latestUser = await _context.Users
            .Include(u => u.Roles)
            .Include(u => u.Setting)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (latestUser == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }
        throw new ConcurrencyException<UserDetailResponse>(
            "別のユーザーが同時に変更しました。ページをリロードして再度操作してください。",
            new UserDetailResponse
            {
                Id = latestUser.Id,
                OrganizationId = latestUser.OrganizationId,
                LoginId = latestUser.LoginId,
                Username = latestUser.Username,
                Email = latestUser.Email,
                AvatarType = latestUser.AvatarType,
                UserAvatarPath = latestUser.UserAvatarPath,
                IdentityIconUrl = IdentityIconHelper.GetIdentityIconUrl(
                    iconType: latestUser.AvatarType,
                    userId: latestUser.Id,
                    username: latestUser.Username,
                    email: latestUser.Email,
                    avatarPath: latestUser.UserAvatarPath
                ),
                Roles = latestUser.Roles.Select(r => new UserRoleResponse
                {
                    Id = r.Id,
                    Name = r.Name
                }).ToList(),
                IsAdmin = latestUser.Roles.Any(r => r.Name == "Admin"),
                CreatedAt = latestUser.CreatedAt,
                LastLoginAt = latestUser.LastLoginAt,
                RowVersion = latestUser.RowVersion!,
                Setting = latestUser.Setting != null
                    ? new UserSettingResponse
                    {
                        CanReceiveEmail = latestUser.Setting.CanReceiveEmail,
                        RowVersion = latestUser.Setting.RowVersion,
                    }
                    : new UserSettingResponse(),
            }
        );
    }

    /// <summary>
    /// pgroonga を使用したあいまいユーザー検索
    /// </summary>
    /// <remarks>
    /// ワークスペースへのメンバー追加時など、ユーザー名またはメールアドレスで
    /// あいまい検索を行う場合に使用します。
    /// 日本語の漢字のゆらぎ（斎藤/斉藤など）やタイポにも対応します。
    /// </remarks>
    /// <param name="organizationId">組織ID（同一組織内のユーザーのみ検索）</param>
    /// <param name="searchQuery">検索クエリ（ユーザー名またはメールアドレスの一部）</param>
    /// <param name="limit">取得件数上限（デフォルト20件）</param>
    /// <returns>検索にヒットしたユーザー一覧</returns>
    public async Task<List<User>> SearchUsersWithPgroongaAsync(
        int organizationId,
        string searchQuery,
        int limit = 20
    )
    {
        if (string.IsNullOrWhiteSpace(searchQuery) || searchQuery.Length < 2)
        {
            return new List<User>();
        }

        // pgroonga のあいまい検索を使用
        // &@~ 演算子：類似検索（タイポ許容）
        // ARRAY[Username, Email] @@ query：複数カラムに対する全文検索
        // スキル名での検索もサポート（UserSkills 経由で Skills.Name を検索）
        // 注意: xmin は PostgreSQL のシステムカラムのため、SELECT * では取得されない
        //       EF Core の RowVersion プロパティ用に明示的に xmin を SELECT する
        // 注意: DISTINCT と ORDER BY pgroonga_score() の併用は PostgreSQL の制約でエラーになるため
        //       サブクエリで重複排除してから外側でスコア順にソートする
        // 注意: サブクエリ内の u.* には xmin が含まれないため、外側で sub.xmin を明示的に SELECT する
        var users = await _context.Users
            .FromSqlInterpolated($@"
                SELECT sub.""Id"", sub.""LoginId"", sub.""Username"", sub.""Email"", sub.""PasswordHash"",
                       sub.""AvatarType"", sub.""UserAvatarPath"", sub.""OrganizationId"",
                       sub.""CreatedAt"", sub.""CreatedByUserId"", sub.""LastLoginAt"",
                       sub.""UpdatedAt"", sub.""UpdatedByUserId"",
                       sub.""PasswordResetToken"", sub.""PasswordResetTokenExpiresAt"",
                       sub.""IsActive"", sub.xmin
                FROM (
                    SELECT DISTINCT ON (u.""Id"") u.*, u.xmin, pgroonga_score(u.tableoid, u.ctid) AS score
                    FROM ""Users"" u
                    LEFT JOIN ""UserSkills"" us ON u.""Id"" = us.""UserId""
                    LEFT JOIN ""Skills"" s ON us.""SkillId"" = s.""Id"" AND s.""IsActive"" = true
                    WHERE u.""OrganizationId"" = {organizationId}
                      AND u.""IsActive"" = true
                      AND (
                        ARRAY[u.""Username"", u.""Email""] &@~ {searchQuery}
                        OR s.""Name"" &@~ {searchQuery}
                      )
                    ORDER BY u.""Id"", pgroonga_score(u.tableoid, u.ctid) DESC
                ) sub
                ORDER BY sub.score DESC
                LIMIT {limit}
            ")
            .ToListAsync();

        // Include はサブクエリで処理するため、別途取得
        if (users.Any())
        {
            var userIds = users.Select(u => u.Id).ToList();

            // Roles と UserSkills を別クエリで取得
            var usersWithIncludes = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Include(u => u.Roles)
                .Include(u => u.UserSkills)
                    .ThenInclude(us => us.Skill)
                .AsSplitQuery()
                .ToListAsync();

            // pgroonga のスコア順を維持するため、元のリストの順序でマッピング
            var userDict = usersWithIncludes.ToDictionary(u => u.Id);
            return users
                .Where(u => userDict.ContainsKey(u.Id))
                .Select(u => userDict[u.Id])
                .ToList();
        }

        return users;
    }
}