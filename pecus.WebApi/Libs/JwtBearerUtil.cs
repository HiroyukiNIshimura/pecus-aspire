using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using Pecus.Libs.DB.Models;
using Pecus.Models.Config;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Pecus.Libs
{
    public class JwtBearerUtil
    {
        private static PecusConfig? _config;

        /// <summary>
        /// PecusConfigを設定
        /// </summary>
        public static void Initialize(PecusConfig config) => _config = config;

        /// <summary>
        /// ユーザー情報からJWTトークンを生成
        /// </summary>
        /// <param name="user">ユーザー情報</param>
        /// <returns>JWTトークン</returns>
        public static string GenerateToken(User user)
        {
            if (_config == null)
            {
                throw new InvalidOperationException(
                    "JwtBearerUtil is not initialized. Call Initialize() first."
                );
            }

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(
                    JwtRegisteredClaimNames.Iat,
                    new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                    ClaimValueTypes.Integer64
                ),
                new Claim("username", user.Username),
                new Claim("userId", user.Id.ToString()),
                new Claim("organizationId", user.OrganizationId?.ToString() ?? ""),
            };

            // ロール情報をクレームに追加
            foreach (var role in user.Roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role.Name.ToString()));
            }

            // 権限情報をクレームに追加
            var permissions = user.Roles.SelectMany(r => r.Permissions).Distinct();
            foreach (var permission in permissions)
            {
                claims.Add(new Claim("permission", permission.Name));
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config.Jwt.IssuerSigningKey)
            );
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expires = DateTime.UtcNow.AddMinutes(_config.Jwt.ExpiresMinutes);

            var token = new JwtSecurityToken(
                issuer: _config.Jwt.ValidIssuer,
                audience: _config.Jwt.ValidAudience,
                claims: claims,
                expires: expires,
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// トークンの有効期限を取得
        /// </summary>
        /// <returns>有効期限（UTC）</returns>
        public static DateTime GetTokenExpiration()
        {
            if (_config == null)
            {
                throw new InvalidOperationException(
                    "JwtBearerUtil is not initialized. Call Initialize() first."
                );
            }

            return DateTime.UtcNow.AddMinutes(_config.Jwt.ExpiresMinutes);
        }

        /// <summary>
        /// トークンの有効期限（分）を取得
        /// </summary>
        /// <returns>有効期限（分）</returns>
        public static int GetExpiresMinutes()
        {
            if (_config == null)
            {
                throw new InvalidOperationException(
                    "JwtBearerUtil is not initialized. Call Initialize() first."
                );
            }

            return _config.Jwt.ExpiresMinutes;
        }

        /// <summary>
        /// JWTトークンからユーザーIDを取得
        /// </summary>
        /// <param name="token">JWTトークン（"Bearer "プレフィックスありでも可）</param>
        /// <returns>ユーザーID</returns>
        /// <exception cref="ArgumentException">トークンが無効な場合</exception>
        /// <exception cref="InvalidOperationException">ユーザーIDクレームが見つからない場合</exception>
        public static int GetUserIdFromToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new ArgumentException("Token cannot be null or empty.", nameof(token));
            }

            // "Bearer "プレフィックスを削除
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                token = token.Substring(7);
            }

            var handler = new JwtSecurityTokenHandler();

            // トークンが読み取り可能かチェック
            if (!handler.CanReadToken(token))
            {
                throw new ArgumentException("Invalid token format.", nameof(token));
            }

            var jwtToken = handler.ReadJwtToken(token);

            // userIdクレームを取得
            var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "userId");
            if (userIdClaim == null)
            {
                // userIdがない場合、subクレームから取得を試みる
                userIdClaim = jwtToken.Claims.FirstOrDefault(c =>
                    c.Type == JwtRegisteredClaimNames.Sub
                );
            }

            if (userIdClaim == null)
            {
                throw new InvalidOperationException("UserId claim not found in token.");
            }

            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new InvalidOperationException($"Invalid UserId format: {userIdClaim.Value}");
            }

            return userId;
        }

        /// <summary>
        /// ClaimsPrincipalからユーザーIDを取得
        /// </summary>
        /// <param name="principal">ClaimsPrincipal（HttpContext.Userなど）</param>
        /// <returns>ユーザーID</returns>
        /// <exception cref="InvalidOperationException">認証されていない場合、またはユーザーIDクレームが見つからない場合</exception>
        public static int GetUserIdFromPrincipal(ClaimsPrincipal principal)
        {
            if (principal == null)
            {
                throw new ArgumentNullException(nameof(principal));
            }

            // 認証チェック（認証フィルターで既にチェックされているはずなので、ここで失敗するのは実装ミス）
            if (principal.Identity?.IsAuthenticated != true)
            {
                throw new InvalidOperationException(
                    "ユーザーが認証されていません。認証が必要ないエンドポイントでGetUserIdFromPrincipalを呼び出した可能性があります。"
                );
            }

            // userIdクレームを取得
            var userIdClaim = principal.FindFirst("userId");
            if (userIdClaim == null)
            {
                // userIdがない場合、subクレームから取得を試みる
                userIdClaim =
                    principal.FindFirst(ClaimTypes.NameIdentifier)
                    ?? principal.FindFirst(JwtRegisteredClaimNames.Sub);
            }

            if (userIdClaim == null)
            {
                throw new InvalidOperationException("UserId claim not found in principal.");
            }

            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new InvalidOperationException($"Invalid UserId format: {userIdClaim.Value}");
            }

            return userId;
        }

        /// <summary>
        /// ClaimsPrincipalから組織IDを取得
        /// </summary>
        /// <param name="principal">ClaimsPrincipal（HttpContext.Userなど）</param>
        /// <returns>組織ID（null の場合は組織未所属）</returns>
        /// <exception cref="InvalidOperationException">認証されていない場合</exception>
        public static int? GetOrganizationIdFromPrincipal(ClaimsPrincipal principal)
        {
            if (principal == null)
            {
                throw new ArgumentNullException(nameof(principal));
            }

            if (principal.Identity?.IsAuthenticated != true)
            {
                throw new InvalidOperationException(
                    "ユーザーが認証されていません。"
                );
            }

            var orgIdClaim = principal.FindFirst("organizationId");
            if (orgIdClaim == null || string.IsNullOrEmpty(orgIdClaim.Value))
            {
                return null;
            }

            if (!int.TryParse(orgIdClaim.Value, out int orgId))
            {
                return null;
            }

            return orgId;
        }

        /// <summary>
        /// ClaimsPrincipalからJTI（JWT ID）を取得
        /// </summary>
        /// <param name="principal">ClaimsPrincipal（HttpContext.Userなど）</param>
        /// <returns>JTI（見つからない場合は空文字）</returns>
        public static string GetJtiFromPrincipal(ClaimsPrincipal principal)
        {
            if (principal == null)
            {
                return string.Empty;
            }

            var jtiClaim = principal.FindFirst(JwtRegisteredClaimNames.Jti);
            return jtiClaim?.Value ?? string.Empty;
        }

        /// <summary>
        /// ClaimsPrincipalからトークンの発行時刻を取得
        /// </summary>
        /// <param name="principal">ClaimsPrincipal（HttpContext.Userなど）</param>
        /// <returns>発行時刻（Unix秒、見つからない場合は0）</returns>
        public static long GetIssuedAtFromPrincipal(ClaimsPrincipal principal)
        {
            if (principal == null)
            {
                return 0;
            }

            var iatClaim = principal.FindFirst(JwtRegisteredClaimNames.Iat);
            if (iatClaim != null && long.TryParse(iatClaim.Value, out long iat))
            {
                return iat;
            }

            return 0;
        }

        /// <summary>
        /// ClaimsPrincipalからトークンの有効期限を取得
        /// </summary>
        /// <param name="principal">ClaimsPrincipal（HttpContext.Userなど）</param>
        /// <returns>有効期限（取得できない場合は現在時刻から設定値分後）</returns>
        public static DateTime GetTokenExpirationFromPrincipal(ClaimsPrincipal principal)
        {
            if (principal == null)
            {
                return DateTime.UtcNow.AddMinutes(_config?.Jwt.ExpiresMinutes ?? 60);
            }

            var expClaim = principal.FindFirst(JwtRegisteredClaimNames.Exp);
            if (expClaim != null && long.TryParse(expClaim.Value, out long exp))
            {
                return DateTimeOffset.FromUnixTimeSeconds(exp).DateTime;
            }

            // 発行時刻から計算
            var iatClaim = principal.FindFirst(JwtRegisteredClaimNames.Iat);
            if (iatClaim != null && long.TryParse(iatClaim.Value, out long iat))
            {
                var issuedAt = DateTimeOffset.FromUnixTimeSeconds(iat).DateTime;
                return issuedAt.AddMinutes(_config?.Jwt.ExpiresMinutes ?? 60);
            }

            return DateTime.UtcNow.AddMinutes(_config?.Jwt.ExpiresMinutes ?? 60);
        }

        /// <summary>
        /// トークン発行時にユーザーのトークンリストに追加（オプション機能）
        /// </summary>
        /// <param name="userId">ユーザーID</param>
        /// <param name="jti">JWT ID</param>
        /// <param name="cache">メモリキャッシュ</param>
        public static void RegisterUserToken(int userId, string jti, IMemoryCache cache)
        {
            var userKey = $"user_tokens:{userId}";
            var tokenList = cache.Get<List<string>>(userKey) ?? new List<string>();

            tokenList.Add(jti);

            // 最大10個のトークンまで保持（古いものは自動削除）
            if (tokenList.Count > 10)
            {
                tokenList.RemoveAt(0);
            }

            cache.Set(userKey, tokenList, new MemoryCacheEntryOptions
            {
                Size = 1,
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1),
                Priority = CacheItemPriority.Low
            });
        }

        /// <summary>
        /// トークン文字列からJTIを取得
        /// </summary>
        public static string GetJtiFromToken(string token)
        {
            if (string.IsNullOrWhiteSpace(token)) return string.Empty;
            if (token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) token = token.Substring(7);
            var handler = new JwtSecurityTokenHandler();
            if (!handler.CanReadToken(token)) return string.Empty;
            var jwt = handler.ReadJwtToken(token);
            var jti = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
            return jti ?? string.Empty;
        }
    }
}