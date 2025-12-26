using Microsoft.Extensions.Logging;

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
    private readonly ProductAtoms? _productAtoms;
    private readonly DeveloperAtoms? _developerAtoms;
    private readonly LoadTestAtoms? _loadTestAtoms;

    /// <summary>
    /// コンストラクタ
    /// </summary>
    /// <param name="logger"></param>
    /// <param name="productAtoms"></param>
    /// <param name="developerAtoms"></param>
    /// <param name="loadTestAtoms"></param>
    public DatabaseSeeder(
        ILogger<DatabaseSeeder> logger,
        ProductAtoms productAtoms,
        DeveloperAtoms developerAtoms,
        LoadTestAtoms loadTestAtoms)
    {
        _logger = logger;
        _productAtoms = productAtoms;
        _developerAtoms = developerAtoms;
        _loadTestAtoms = loadTestAtoms;
    }

    /// <summary>
    /// すべてのシードデータを投入（環境に応じて本番用または開発用）
    /// </summary>
    public async Task SeedAsync()
    {
        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production")
        {
            if (_productAtoms == null)
            {
                throw new InvalidOperationException("ProductAtoms is not initialized.");
            }
            _logger.LogInformation("Seeding production data...");
            await _productAtoms.SeedProductAsync();
        }
        else if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "LoadTest")
        {
            if (_loadTestAtoms == null)
            {
                throw new InvalidOperationException("LoadTestAtoms is not initialized.");
            }
            _logger.LogInformation("Seeding load test data...");
            await _loadTestAtoms.SeedDevelopmentDataAsync();
        }
        else
        {
            if (_developerAtoms == null)
            {
                throw new InvalidOperationException("DeveloperAtoms is not initialized.");
            }
            _logger.LogInformation("Seeding development data...");
            await _developerAtoms.SeedDevelopmentDataAsync();
        }
    }
}