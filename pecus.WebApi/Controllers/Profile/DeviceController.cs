using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Profile;

/// <summary>
/// デバイス管理コントローラー
/// </summary>
[ApiController]
[Route("api/profile/devices")]
[Authorize]
public class DeviceController : ControllerBase
{
    private readonly ProfileService _profileService;
    private readonly ILogger<DeviceController> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public DeviceController(
        ProfileService profileService,
        ILogger<DeviceController> logger
    )
    {
        _profileService = profileService;
        _logger = logger;
    }

    /// <summary>
    /// 自分の有効なデバイス情報の一覧を取得
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<DeviceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<List<DeviceResponse>>> GetDevices()
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        var user = await _profileService.GetUserAsync(me);
        if (user == null || !user.IsActive)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var response = await _profileService.GetUserDevicesAsync(me);

        if (response == null || response.Count == 0)
        {
            throw new NotFoundException("デバイスが見つかりません。");
        }

        return TypedResults.Ok(response);
    }

    /// <summary>
    /// 自分のデバイスを削除
    /// </summary>
    /// <param name="deviceId">デバイスID</param>
    /// <returns>削除結果</returns>
    [HttpDelete("{deviceId}")]
    [ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<MessageResponse>> DeleteDevice(int deviceId)
    {
        var me = JwtBearerUtil.GetUserIdFromPrincipal(User);

        var user = await _profileService.GetUserAsync(me);
        if (user == null || !user.IsActive)
        {
            throw new NotFoundException("ユーザーが見つかりません。");
        }

        var result = await _profileService.DeleteUserDeviceAsync(me, deviceId);
        if (!result)
        {
            throw new NotFoundException("デバイスが見つかりません。");
        }

        return TypedResults.Ok(new MessageResponse { Message = "デバイスを削除しました。" });
    }
}