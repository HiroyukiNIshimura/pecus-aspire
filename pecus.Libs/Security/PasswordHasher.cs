using System.Security.Cryptography;
using System.Text;

namespace Pecus.Libs.Security;

/// <summary>
/// �p�X���[�h�n�b�V�������[�e�B���e�B�iSHA256+Base64�j
/// </summary>
public static class PasswordHasher
{
 /// <summary>
 /// �p�X���[�h���n�b�V����
 /// </summary>
 public static string HashPassword(string password)
 {
 using var sha256 = SHA256.Create();
 var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
 return Convert.ToBase64String(hashedBytes);
 }

 /// <summary>
 /// �p�X���[�h������
 /// </summary>
 public static bool VerifyPassword(string password, string passwordHash)
 {
 var hash = HashPassword(password);
 return hash == passwordHash;
 }
}
