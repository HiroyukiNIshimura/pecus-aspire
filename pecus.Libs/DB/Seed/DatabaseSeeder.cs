using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Pecus.Libs.DB.Seed.Atoms;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// データベースのシードデータを管理するクラス
/// 重要！
/// このファイルを編集する前に、必ず docs/DatabaseSeedData.md を確認してください。
/// 作業が済んだら、同ドキュメントも更新し、作業履歴を作成してください。
///
/// </summary>
public class DatabaseSeeder
{
    private readonly ILogger<DatabaseSeeder> _logger;
    private readonly ProductAtoms _productAtoms;
    private readonly DeveloperAtoms _developerAtoms;
    private readonly LoadTestAtoms _loadTestAtoms;
    private readonly DemoAtoms _demoAtoms;
    private readonly DemoModeOptions _demoModeOptions;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="productAtoms"></param>
    /// <param name="developerAtoms"></param>
    /// <param name="loadTestAtoms"></param>
    /// <param name="demoAtoms"></param>
    /// <param name="demoModeOptions"></param>
    public DatabaseSeeder(
        ILogger<DatabaseSeeder> logger,
        ProductAtoms productAtoms,
        DeveloperAtoms developerAtoms,
        LoadTestAtoms loadTestAtoms,
        DemoAtoms demoAtoms,
        IOptions<DemoModeOptions> demoModeOptions)
    {
        _logger = logger;
        _productAtoms = productAtoms;
        _developerAtoms = developerAtoms;
        _loadTestAtoms = loadTestAtoms;
        _demoAtoms = demoAtoms;
        _demoModeOptions = demoModeOptions.Value;
    }

    /// <summary>
    /// すべてのシードデータを投入（環境に応じて本番用または開発用）
    /// </summary>
    public async Task SeedAsync()
    {
        _logger.LogInformation("Seeding production data (Base)...");
        var backOfficeOrgId = await _productAtoms.SeedProductAsync();

        if (_demoModeOptions.Enabled)
        {
            _logger.LogInformation("Demo mode is enabled. Seeding demo data...");
            await _demoAtoms.SeedDemoAsync();
        }

        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        if (environment == "Production")
        {
            _logger.LogInformation("Production environment detected. Skipping development data seeding.");
            // 本番環境ではここで終了
            return;
        }

        // 開発環境用データ投入
        if (environment == "LoadTest")
        {
            _logger.LogInformation("Seeding load test data...");
            await _loadTestAtoms.SeedDevelopmentDataAsync(backOfficeOrgId);
        }
        else
        {
            _logger.LogInformation("Seeding development data...");
            await _developerAtoms.SeedDevelopmentDataAsync(backOfficeOrgId);
        }
    }
}