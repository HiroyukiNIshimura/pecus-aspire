using Bogus.Extensions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pecus.Libs.AI;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;
using Pecus.Libs.Lexical;
using Pecus.Libs.Security;
using Pecus.Libs.Utils;
using System.Reflection;

namespace Pecus.Libs.DB.Seed;

/// <summary>
/// 本番環境向けのシードデータ生成
/// </summary>
public class ProductAtoms
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductAtoms> _logger;
    private readonly ILexicalConverterService? _lexicalConverterService;
    private readonly Random _random = new Random();
    private readonly Bogus.Faker _faker;
    private readonly CommonAtoms _seedAtoms;

    /// <summary>
    ///  Constructor
    /// </summary>
    /// <param name="context"></param>
    /// <param name="logger"></param>
    /// <param name="seedAtoms"></param>
    /// <param name="lexicalConverterService"></param>
    public ProductAtoms(
        ApplicationDbContext context,
        ILogger<ProductAtoms> logger,
        CommonAtoms seedAtoms,
        ILexicalConverterService? lexicalConverterService = null)
    {
        _context = context;
        _logger = logger;
        _seedAtoms = seedAtoms;
        _lexicalConverterService = lexicalConverterService;
        _faker = new Bogus.Faker("ja");
    }

    /// <summary>
    /// 本番環境用のデータを投入
    /// </summary>
    public async Task SeedProductAsync()
    {
        _logger.LogInformation("Seeding production data...");

        await _seedAtoms.SeedPermissionsAsync();
        await _seedAtoms.SeedRolesAsync();
        await _seedAtoms.SeedGenresAsync();
        await _seedAtoms.SeedTaskTypesAsync();
    }
}