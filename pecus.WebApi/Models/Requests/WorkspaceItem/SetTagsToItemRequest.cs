namespace Pecus.Models.Requests.WorkspaceItem;

/// <summary>
/// Request DTO for setting all tags on a workspace item
/// </summary>
public class SetTagsToItemRequest
{
    /// <summary>
    /// List of tag names to set on the item. Replaces all existing tags.
    /// Tags will be auto-created in the organization if they don't exist.
    /// Empty list or null will remove all tags.
    /// </summary>
    public List<string>? TagNames { get; set; }
}
