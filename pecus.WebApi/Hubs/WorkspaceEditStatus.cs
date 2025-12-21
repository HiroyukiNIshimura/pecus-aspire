using Pecus.Services;

namespace Pecus.Hubs;

public record WorkspaceEditStatus(bool IsEditing, ItemEditor? Editor);