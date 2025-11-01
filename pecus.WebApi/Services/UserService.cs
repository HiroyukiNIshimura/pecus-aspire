using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Libs.Security;
using Pecus.Models.Requests;
using Pecus.Models.Responses.User;
using System.Security.Cryptography;

namespace Pecus.Services;

/// <summary>
/// ユーザー管理サービス
/// </summary>
public class UserService
{
    private readonly ApplicationDbContext _context;
    public UserService(
        ApplicationDbContext context
    )
    {
        _context = context;
    }

    /// <summary>
    /// ユーザーを作成
    /// </summary>
    public async Task<User> CreateUserAsync(CreateUserRequest request, int? createdByUserId = null)
    {
        // 既存ユーザーチェック
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            throw new DuplicateException("ユーザー名は既に使用されています。");
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new DuplicateException("メールアドレスは既に使用されています。");
        }

        // ユニークなLoginIdを生成
        var loginId = await GenerateUniqueLoginIdAsync(_context);

        var user = new User
        {
            LoginId = loginId,
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            OrganizationId = request.OrganizationId,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = createdByUserId,
            IsActive = true,
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return user;
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
       .FirstOrDefaultAsync(u => u.Id == userId);

    /// <summary>
    /// ユーザー名で取得(ロールと権限を含む)
    /// </summary>
    public async Task<User?> GetUserByUsernameAsync(string username) =>
        await _context
            .Users.Include(u => u.Roles)
            .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.Username == username);

    /// <summary>
    /// LoginIdで取得(ロールと権限を含む)
    /// </summary>
    public async Task<User?> GetUserByLoginIdAsync(string loginId) =>
        await _context
            .Users.Include(u => u.Roles)
            .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.LoginId == loginId);

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
    ///     skillIds: new List&lt;int&gt; { 1, 2, 3 }
    /// )
    /// </code>
    /// </remarks>
    public async Task<(List<User> users, int totalCount)> GetUsersByOrganizationPagedAsync(
        int organizationId,
        int page,
        int pageSize,
      bool? isActive = null,
        string? username = null,
        List<int>? skillIds = null
    )
    {
        var query = _context
          .Users.Include(u => u.Roles)
                  .Include(u => u.UserSkills).ThenInclude(us => us.Skill)
                  .Where(u => u.OrganizationId == organizationId)
                  .AsQueryable();

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
            // 指定されたスキルをすべて持つユーザーを検索
            query = query.Where(u => skillIds.All(skillId => u.UserSkills.Any(us => us.SkillId == skillId)));
        }

        query = query.OrderBy(u => u.Id);

        var totalCount = await query.CountAsync();
        var users = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

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
        if (!string.IsNullOrWhiteSpace(request.Username))
        {
            user.Username = request.Username.Trim();
        }

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

        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = updatedByUserId;

        await _context.SaveChangesAsync();
        return user;
    }

    /// <summary>
    /// ユーザーのアバター情報を更新
    /// </summary>
    public async Task<User> UpdateUserAvatarAsync(
        int userId,
        string avatarType,
        string avatarUrl,
        int updatedByUserId
    )
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        user.AvatarType = avatarType;
        user.AvatarUrl = avatarUrl;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = updatedByUserId;

        await _context.SaveChangesAsync();
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
        await _context.SaveChangesAsync();
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
    /// </summary>
    public async Task<User> CreateUserWithoutPasswordAsync(
        CreateUserWithoutPasswordRequest request,
        int? createdByUserId = null
    )
    {
        // メールアドレスの重複チェックのみ
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new DuplicateException("メールアドレスは既に使用されています。");
        }

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

        return user;
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
    /// ユーザーのスキルを設定（洗い替え）
    /// </summary>
    public async Task<bool> SetUserSkillsAsync(int userId, List<int> skillIds, int updatedByUserId)
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

            // 既存のスキルをすべて削除
            _context.UserSkills.RemoveRange(user.UserSkills);
            await _context.SaveChangesAsync();

            // 新しいスキルを追加
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
    /// ユーザープロフィールを更新（基本情報 + スキル）
    /// </summary>
    public async Task<User?> UpdateProfileAsync(int userId, UpdateProfileRequest request, int updatedByUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 基本プロフィール情報の更新
            var updateUserRequest = new UpdateUserRequest
            {
                Username = request.Username,
                AvatarType = request.AvatarType,
                AvatarUrl = request.AvatarUrl
            };

            var updatedUser = await UpdateUserAsync(userId, updateUserRequest, updatedByUserId);
            if (updatedUser == null)
            {
                return null;
            }

            // スキルの更新（指定されている場合のみ）
            if (request.SkillIds != null)
            {
                var skillUpdateSuccess = await SetUserSkillsAsync(
                    userId,
                    request.SkillIds,
                    updatedByUserId
                );

                if (!skillUpdateSuccess)
                {
                    return null;
                }
            }

            await transaction.CommitAsync();
            return updatedUser;
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
        var statistics = new UserStatistics();

        // ユーザーを取得（スキルとロール情報を含む）
        var users = await _context.Users
        .Include(u => u.UserSkills).ThenInclude(us => us.Skill)
        .Include(u => u.Roles)
        .Include(u => u.WorkspaceUsers)
        .Where(u => u.OrganizationId == organizationId)
        .ToListAsync();

        // アクティブ/非アクティブのユーザー数
        statistics.ActiveUserCount = users.Count(u => u.IsActive);
        statistics.InactiveUserCount = users.Count(u => !u.IsActive);

        // スキルごとのユーザー数
        statistics.SkillCounts = users
         .SelectMany(u => u.UserSkills)
         .GroupBy(us => new { us.Skill.Id, us.Skill.Name })
            .Select(g => new SkillUserCountResponse
            {
                Id = g.Key.Id,
                Name = g.Key.Name,
                Count = g.Select(us => us.UserId).Distinct().Count()
            })
          .OrderBy(s => s.Name)
            .ToList();

        // ロールごとのユーザー数
        statistics.RoleCounts = users
           .SelectMany(u => u.Roles)
           .GroupBy(r => new { r.Id, r.Name })
            .Select(g => new RoleUserCountResponse
            {
                Id = g.Key.Id,
                Name = g.Key.Name,
                Count = g.Select(r => r.Users).SelectMany(u => u).Select(u => u.Id).Distinct().Count()
            })
            .OrderBy(r => r.Name)
        .ToList();

        // ワークスペース参加状況
        var usersWithWorkspaces = users.Count(u => u.WorkspaceUsers.Any());
        statistics.WorkspaceParticipationCount = usersWithWorkspaces;
        statistics.NoWorkspaceParticipationCount = users.Count - usersWithWorkspaces;

        return statistics;
    }
}
