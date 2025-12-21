using Pecus.Services;

namespace Pecus.Hubs;

public record ItemEditStatus(bool IsEditing, ItemEditor? Editor);