using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Models.Responses.Common;
using Pecus.Models.Responses.User;
using Pecus.Services;

namespace Pecus.Controllers.Profile;

/// <summary>
/// デバイス管理コントローラー
/// </summary>
[Route("api/profile/devices")]
[Tags("Profile - Device")]
public class DeviceController : BaseSecureController
{
    private readonly ProfileService _profileService;
    private readonly ILogger<DeviceController> _logger;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    public DeviceController(
        ProfileService profileService,
        ILogger<DeviceController> logger
    ) : base(profileService, logger)
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
        var response = await _profileService.GetUserDevicesAsync(CurrentUserId);

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
        var result = await _profileService.DeleteUserDeviceAsync(CurrentUserId, deviceId);
        if (!result)
        {
            throw new NotFoundException("デバイスが見つかりません。");
        }

        return TypedResults.Ok(new MessageResponse { Message = "デバイスを削除しました。" });
    }
}