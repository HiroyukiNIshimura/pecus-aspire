using Microsoft.Extensions.Logging;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// 本番環境向けのシードデータ生成
/// </summary>
public class ProductAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductAtoms> _logger;
    private readonly CommonAtoms _seedAtoms;

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="seedAtoms"></param>
    public ProductAtoms(
        ApplicationDbContext context,
        ILogger<ProductAtoms> logger,
        CommonAtoms seedAtoms)
    {
        _context = context;
        _logger = logger;
        _seedAtoms = seedAtoms;
    }

    /// <summary>
    /// 本番環境用のデータを投入
    /// </summary>
    public async Task SeedProductAsync()
    {
        _logger.LogInformation("Seeding production data...");

        await _seedAtoms.SeedPermissionsAsync(_context);
        await _seedAtoms.SeedRolesAsync(_context);
        await _seedAtoms.SeedGenresAsync(_context);
        await _seedAtoms.SeedTaskTypesAsync(_context);

        //もしデモモードならばデモ用データを投入
        if (Environment.GetEnvironmentVariable("PECUS_DEMO_MODE") == "true")
        {
            _logger.LogInformation("Demo mode is enabled. Seeding demo data...");
        }

        _logger.LogInformation("Production data seeding completed");
    }
}