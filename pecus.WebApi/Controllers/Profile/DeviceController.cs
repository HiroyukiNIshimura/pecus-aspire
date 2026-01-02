using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Pecus.Exceptions;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Services;

namespace Pecus.Controllers.Profile;

/// <summary>
/// デバイス管理コントローラー
/// </summary>
[Route("api/profile/devices")]
[Tags("Profile")]
public class DeviceController : BaseSecureController
{
    private readonly ProfileService _profileService;
    private readonly ILogger<DeviceController> _logger;

    public DeviceController(
        ProfileService profileService,
        ILogger<DeviceController> logger
    ) : base(profileService, logger)
    {
        _profileService = profileService;
        _logger = logger;
    }

    /// <summary>
    /// 自分の接続しているデバイス情報の一覧を取得
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
    /// 自分の接続しているデバイス情報の一覧を取得（現在のデバイス判定付き）
    /// </summary>
    /// <param name="deviceType">デバイス種別</param>
    /// <param name="os">OS</param>
    /// <param name="userAgent">User-Agent</param>
    [HttpGet("with-current")]
    [ProducesResponseType(typeof(DeviceListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<Ok<DeviceListResponse>> GetDevicesWithCurrent(
        [FromQuery] DeviceType? deviceType,
        [FromQuery] OSPlatform? os,
        [FromQuery] string? userAgent)
    {
        var devices = await _profileService.GetUserDevicesAsync(CurrentUserId);

        if (devices == null || devices.Count == 0)
        {
            throw new NotFoundException("デバイスが見つかりません。");
        }

        string? currentDevicePublicId = null;

        if (deviceType.HasValue && os.HasValue)
        {
            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
            var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var realIp = forwardedFor?.Split(',').FirstOrDefault()?.Trim() ?? clientIp;

            currentDevicePublicId = await _profileService.FindMatchingDevicePublicIdAsync(
                CurrentUserId,
                deviceType.Value,
                os.Value,
                userAgent,
                realIp);
        }

        return TypedResults.Ok(new DeviceListResponse
        {
            Devices = devices,
            CurrentDevicePublicId = currentDevicePublicId
        });
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