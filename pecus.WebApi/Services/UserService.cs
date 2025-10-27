using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;
using System.Security.Cryptography;
using System.Text;

namespace Pecus.Services;

/// <summary>
/// ユーザー管理サービス
/// </summary>
public class UserService
{
    private readonly ApplicationDbContext _context;
    private readonly TokenBlacklistService? _tokenBlacklistService;

    public UserService(
        ApplicationDbContext context,
        TokenBlacklistService? tokenBlacklistService = null
    )
    {
        _context = context;
        _tokenBlacklistService = tokenBlacklistService;
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
    public async Task<(List<User> users, int totalCount)> GetUsersByOrganizationPagedAsync(
        int organizationId,
        int page,
        int pageSize,
        bool? activeOnly = null
    )
    {
        var query = _context
            .Users.Include(u => u.Roles)
            .Where(u => u.OrganizationId == organizationId)
            .AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(u => u.IsActive);
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
        var hash = HashPassword(password);
        return hash == passwordHash;
    }

    /// <summary>
    /// パスワードを検証（public）
    /// </summary>
    public static bool VerifyPasswordPublic(string password, string passwordHash)
    {
        return VerifyPassword(password, passwordHash);
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
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
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
}
