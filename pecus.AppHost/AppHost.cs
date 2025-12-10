using Pecus.Libs;
using Serilog;

// Serilogの初期化（pecus.Libsの共通設定を使用）
SerilogHelper.CreateLogger("pecus-apphost");

try
{
    var builder = DistributedApplication.CreateBuilder(args);

    // Serilogを使用
    builder.Services.AddSerilog(dispose: true);

    var username = builder.AddParameter("username", secret: true);
    var password = builder.AddParameter("password", secret: true);

    var redis = builder.AddRedis("redis");

    var postgres = builder
        .AddPostgres("postgres", userName: username, password: password, port: 5432)
        .WithImage("groonga/pgroonga", "latest-debian-18")
        .WithVolume("postgres-data", "/var/lib/postgresql");
    var pecusDb = postgres.AddDatabase("pecusdb");

    var dbManager = builder
        .AddProject<Projects.pecus_DbManager>("dbmanager")
        .WithReference(pecusDb)
        .WaitFor(pecusDb);

    // Lexical Converter (Node.js gRPC Service)
    var lexicalConverter = builder.AddNpmApp("lexicalconverter", "../pecus.LexicalConverter", "start:dev")
        .WithNpmPackageInstallation()
        .WithHttpEndpoint(targetPort: 5100, name: "grpc", isProxied: false)
        .WithEnvironment("GRPC_PORT", "5100")
        .WithEnvironment("GRPC_HOST", "0.0.0.0");

    // WebApi の uploads フォルダの絶対パスを取得
    var webApiProjectPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.WebApi"));
    var uploadsPath = Path.Combine(webApiProjectPath, "uploads");
    Log.Information("Uploads path: {UploadsPath}", uploadsPath);

    var backfire = builder
    .AddProject<Projects.pecus_BackFire>("backfire")
    .WithReference(redis)
    .WithReference(pecusDb)
    .WithReference(lexicalConverter)
    .WaitFor(redis)
    .WaitFor(pecusDb)
    .WaitFor(lexicalConverter)
    .WithEnvironment("UploadsCleanup__UploadsBasePath", uploadsPath)
    .WithEnvironment("LexicalConverter__Endpoint", "http://localhost:5100");

    var pecusApi = builder
        .AddProject<Projects.pecus_WebApi>("pecusapi")
        .WithReference(pecusDb)
        .WithReference(redis)
        .WithReference(lexicalConverter)
        .WaitFor(pecusDb)
        .WaitFor(redis)
        .WaitFor(dbManager)
        .WaitFor(backfire)
        .WaitFor(lexicalConverter)
        .WithExternalHttpEndpoints()
        .WithHttpHealthCheck("/")
        .WithEnvironment("LexicalConverter__Endpoint", "http://localhost:5100");

    // Frontendの設定(開発環境モード)
    var redisFrontend = builder.AddRedis("redisFrontend").WithDbGate();

    var frontend = builder.AddNpmApp("frontend", "../pecus.Frontend", "dev")
        .WithReference(pecusApi)
        .WithReference(redisFrontend)
        .WaitFor(redisFrontend)
        .WaitFor(pecusApi)
        .WithNpmPackageInstallation()
        .WithExternalHttpEndpoints();

    builder.Build().Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}