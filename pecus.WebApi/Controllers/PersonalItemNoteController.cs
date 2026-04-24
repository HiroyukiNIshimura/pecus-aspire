using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Services;

namespace Pecus.Controllers;

/// <summary>
/// 個人メモコントローラー
/// アイテムに対するユーザー個人のプライベートメモを管理します。
/// メモは本人のみがアクセス可能であり、他のメンバーや管理者には公開されません。
/// </summary>
[Produces("application/json")]
[Tags("PersonalItemNote")]
public class PersonalItemNoteController : BaseSecureController
{
    private readonly PersonalItemNoteService _noteService;
    private readonly OrganizationAccessHelper _accessHelper;

    public PersonalItemNoteController(
        PersonalItemNoteService noteService,
        OrganizationAccessHelper accessHelper,
        ProfileService profileService,
        ILogger<PersonalItemNoteController> logger
    ) : base(profileService, logger)
    {
        _noteService = noteService;
        _accessHelper = accessHelper;
    }

    /// <summary>
    /// 個人メモを取得します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>個人メモ（存在しない場合は 404）</returns>
    [HttpGet("api/workspaces/{workspaceId}/items/{itemId}/personal-note")]
    [ProducesResponseType(typeof(PersonalItemNoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<Results<Ok<PersonalItemNoteResponse>, NotFound>> GetNote(int workspaceId, int itemId, CancellationToken ct)
    {
        await _accessHelper.EnsureActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);

        var note = await _noteService.GetNoteAsync(itemId, CurrentUserId, ct);
        if (note == null)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(PersonalItemNoteService.ToResponse(note));
    }

    /// <summary>
    /// 個人メモを作成します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">作成リクエスト</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>作成された個人メモ</returns>
    [HttpPost("api/workspaces/{workspaceId}/items/{itemId}/personal-note")]
    [ProducesResponseType(typeof(PersonalItemNoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<Ok<PersonalItemNoteResponse>> CreateNote(
        int workspaceId,
        int itemId,
        [FromBody] CreatePersonalItemNoteRequest request,
        CancellationToken ct
    )
    {
        await _accessHelper.EnsureActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);

        var note = await _noteService.CreateNoteAsync(itemId, CurrentUserId, request.Content, ct);
        return TypedResults.Ok(PersonalItemNoteService.ToResponse(note));
    }

    /// <summary>
    /// 個人メモを更新します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="request">更新リクエスト</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>更新された個人メモ</returns>
    [HttpPut("api/workspaces/{workspaceId}/items/{itemId}/personal-note")]
    [ProducesResponseType(typeof(PersonalItemNoteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<Ok<PersonalItemNoteResponse>> UpdateNote(
        int workspaceId,
        int itemId,
        [FromBody] UpdatePersonalItemNoteRequest request,
        CancellationToken ct
    )
    {
        await _accessHelper.EnsureActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);

        var note = await _noteService.UpdateNoteAsync(itemId, CurrentUserId, request.Content, ct);
        return TypedResults.Ok(PersonalItemNoteService.ToResponse(note));
    }

    /// <summary>
    /// 個人メモを削除します
    /// </summary>
    /// <param name="workspaceId">ワークスペースID</param>
    /// <param name="itemId">ワークスペースアイテムID</param>
    /// <param name="ct">キャンセルトークン</param>
    /// <returns>204 No Content</returns>
    [HttpDelete("api/workspaces/{workspaceId}/items/{itemId}/personal-note")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<NoContent> DeleteNote(int workspaceId, int itemId, CancellationToken ct)
    {
        await _accessHelper.EnsureActiveWorkspaceMemberAsync(CurrentUserId, workspaceId);

        await _noteService.DeleteNoteAsync(itemId, CurrentUserId, ct);
        return TypedResults.NoContent();
    }
}
