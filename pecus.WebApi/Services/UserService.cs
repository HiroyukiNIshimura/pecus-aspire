using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.DB.Models;
using Pecus.Models.Requests;

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
    /// ユーザーをページネーション付きで取得
    /// </summary>
    public async Task<(List<User> users, int totalCount)> GetUsersPagedAsync(
        int page,
        int pageSize,
        bool? activeOnly = null
    )
    {
        var query = _context.Users.Include(u => u.Roles).AsQueryable();

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
    /// ユーザーを更新
    /// </summary>
    public async Task<User> UpdateUserAsync(
        int userId,
        UpdateUserRequest request,
        int? updatedByUserId = null,
        string? currentJti = null
    )
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        if (request.Email != null)
        {
            // メールアドレスの重複チェック（自分自身以外で既に使用されていないか）
            if (await _context.Users.AnyAsync(u => u.Email == request.Email && u.Id != userId))
            {
                throw new DuplicateException("メールアドレスは既に使用されています。");
            }
            user.Email = request.Email;
        }

        if (request.Password != null)
        {
            user.PasswordHash = HashPassword(request.Password);

            // パスワード変更時は現在のトークン以外の既存トークンを無効化
            if (_tokenBlacklistService != null)
            {
                await _tokenBlacklistService.BlacklistAllUserTokensExceptCurrentAsync(
                    userId,
                    currentJti
                );
            }
        }

        if (request.AvatarType != null)
        {
            user.AvatarType = request.AvatarType;
        }

        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedByUserId = updatedByUserId;

        await _context.SaveChangesAsync();
        return user;
    }

    /// <summary>
    /// ユーザーを更新
    /// </summary>
    public async Task<User> UpdateUserAsync(
        int userId,
        string? email = null,
        string? password = null
    )
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("ユーザーが見つかりません。");
        }

        if (email != null)
        {
            user.Email = email;
        }

        if (password != null)
        {
            user.PasswordHash = HashPassword(password);
        }

        await _context.SaveChangesAsync();
        return user;
    }

    /// <summary>
    /// ユーザー情報を更新（SaveChangesを呼び出すのみ）
    /// </summary>
    public async Task UpdateUserAsync(int userId) => await _context.SaveChangesAsync();

    /// <summary>
    /// ユーザーを無効化
    /// </summary>
    public async Task<bool> DeactivateUserAsync(int userId, int? updatedByUserId = null)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return false;
        }

        user.IsActive = false;
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
    /// パスワードをハッシュ化
    /// </summary>
    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
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
    /// ユーザーにロールを割り当て
    /// </summary>
    public async Task<bool> AssignRoleToUserAsync(int userId, int roleId)
    {
        var user = await _context
            .Users.Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return false;
        }

        var role = await _context.Roles.FindAsync(roleId);
        if (role == null)
        {
            return false;
        }

        if (!user.Roles.Contains(role))
        {
            user.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        return true;
    }

    /// <summary>
    /// ユーザーからロールを削除
    /// </summary>
    public async Task<bool> RemoveRoleFromUserAsync(int userId, int roleId)
    {
        var user = await _context
            .Users.Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return false;
        }

        var role = user.Roles.FirstOrDefault(r => r.Id == roleId);
        if (role == null)
        {
            return false;
        }

        user.Roles.Remove(role);
        await _context.SaveChangesAsync();

        return true;
    }

    /// <summary>
    /// ユーザーが特定の権限を持っているか確認
    /// </summary>
    public async Task<bool> UserHasPermissionAsync(int userId, string permissionName)
    {
        var user = await _context
            .Users.Include(u => u.Roles)
            .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return false;
        }

        return user.Roles.SelectMany(r => r.Permissions).Any(p => p.Name == permissionName);
    }

    /// <summary>
    /// ユーザーの全権限を取得
    /// </summary>
    public async Task<List<Permission>> GetUserPermissionsAsync(int userId)
    {
        var user = await _context
            .Users.Include(u => u.Roles)
            .ThenInclude(r => r.Permissions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return new List<Permission>();
        }

        return user.Roles.SelectMany(r => r.Permissions).Distinct().ToList();
    }
}
