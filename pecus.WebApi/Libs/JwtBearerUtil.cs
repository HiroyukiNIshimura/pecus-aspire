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
                new Claim("username", user.Username),
                new Claim("userId", user.Id.ToString()),
            };

            // ロール情報をクレームに追加
            foreach (var role in user.Roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role.Name));
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
            var expires = DateTime.UtcNow.AddHours(_config.Jwt.ExpiresHours);

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

            return DateTime.UtcNow.AddHours(_config.Jwt.ExpiresHours);
        }

        /// <summary>
        /// トークンの有効期限（時間）を取得
        /// </summary>
        /// <returns>有効期限（時間）</returns>
        public static int GetExpiresHours()
        {
            if (_config == null)
            {
                throw new InvalidOperationException(
                    "JwtBearerUtil is not initialized. Call Initialize() first."
                );
            }

            return _config.Jwt.ExpiresHours;
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
        /// <exception cref="InvalidOperationException">ユーザーIDクレームが見つからない場合</exception>
        public static int GetUserIdFromPrincipal(ClaimsPrincipal principal)
        {
            if (principal == null)
            {
                throw new ArgumentNullException(nameof(principal));
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
    }
}
