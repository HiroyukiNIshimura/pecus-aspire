namespace Pecus.Services;

public record ItemEditor(
    int UserId,
    string UserName,
    string? IdentityIconUrl,
    string ConnectionId);