using Pecus.Libs;
using Serilog;
using System.Text.Json;
using System.Text.Json.Serialization;

// Serilogの初期化（pecus.Libsの共通設定を使用）

if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production")
    SerilogHelper.CreateLogger("pecus-apphost", SerilogHelper.LogEnvironment.Production);
else
{
    SerilogHelper.CreateLogger("pecus-apphost", SerilogHelper.LogEnvironment.Development);
}

try
{
    var builder = DistributedApplication.CreateBuilder(args);

    // Serilogを使用
    builder.Services.AddSerilog(dispose: true);

    // Infrastructure 設定を読み込み
    var infraConfig = builder.Configuration.GetSection("Infrastructure");
    var postgresUser = infraConfig["postgres:user"] ?? "pecus";
    var postgresPassword = infraConfig["postgres:password"] ?? "";
    var postgresPort = int.TryParse(infraConfig["postgres:port"], out var pgPort) ? (int?)pgPort : null;
    var postgresImage = infraConfig["postgres:image"] ?? "groonga/pgroonga:latest-debian-18";
    var redisPort = int.TryParse(infraConfig["redis:port"], out var rdPort) ? (int?)rdPort : null;
    var lexicalConverterPort = int.TryParse(infraConfig["ports:lexicalConverter"], out var lcPort) ? lcPort : 5100;
    var grpcHost = infraConfig["grpc:host"] ?? "0.0.0.0";

    //パラメータをログに表示（パスワードは除く）
    Log.Information("PostgreSQL User: {PostgresUser}", postgresUser);
    Log.Information("PostgreSQL Port: {PostgresPort}", postgresPort?.ToString() ?? "default");
    Log.Information("PostgreSQL Image: {PostgresImage}", postgresImage);
    Log.Information("Redis Port: {RedisPort}", redisPort?.ToString() ?? "default");
    Log.Information("Lexical Converter Port: {LexicalConverterPort}", lexicalConverterPort);
    Log.Information("gRPC Host: {GrpcHost}", grpcHost);

    var username = builder.AddParameter("username", postgresUser);
    var password = builder.AddParameter("password", postgresPassword);

    // Redis: ポート指定があれば使用、なければ Aspire のデフォルト（ランダム）
    var redis = redisPort.HasValue
        ? builder.AddRedis("redis", port: redisPort.Value)
        : builder.AddRedis("redis");

    // フロントエンド用 Redis: ポート指定があれば使用、なければ Aspire のデフォルト（ランダム）
    var redisFrontend = (redisPort.HasValue
        ? builder.AddRedis("redisFrontend", port: redisPort.Value + 1)
        : builder.AddRedis("redisFrontend"));

    var postgresImageParts = postgresImage.Split(':');
    var postgresImageName = postgresImageParts[0];
    var postgresImageTag = postgresImageParts.Length > 1 ? postgresImageParts[1] : "latest";

    // PostgreSQL: ポート指定があれば使用、なければ Aspire のデフォルト（ランダム）
    var postgres = postgresPort.HasValue
        ? builder.AddPostgres("postgres", userName: username, password: password, port: postgresPort.Value)
            .WithImage(postgresImageName, postgresImageTag)
            .WithVolume("postgres-data", "/var/lib/postgresql")
        : builder.AddPostgres("postgres", userName: username, password: password)
            .WithImage(postgresImageName, postgresImageTag)
            .WithVolume("postgres-data", "/var/lib/postgresql");
    var pecusDb = postgres.AddDatabase("pecusdb");

    // 永続データのベースパス（開発時: ../data、本番時: /mnt/pecus-data など）
    var dataPathValue = infraConfig["dataPath"] ?? "../data";
    var dataPathResolved = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.AppHost", dataPathValue));
    var uploadsPath = Path.Combine(dataPathResolved, "uploads");
    Log.Information("Data path: {DataPath}", dataPathResolved);
    Log.Information("Uploads path: {UploadsPath}", uploadsPath);

    // Protos フォルダの絶対パスを取得
    var protosPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.Protos"));
    var lexicalProtoPath = Path.Combine(protosPath, "lexical", "lexical.proto");
    Log.Information("Lexical proto path: {LexicalProtoPath}", lexicalProtoPath);

    // Lexical Converter (Node.js gRPC Service)
    var lexicalConverter = builder.AddNpmApp("lexicalconverter", "../pecus.LexicalConverter", "start:dev")
        .WithNpmPackageInstallation()
        .WithHttpEndpoint(targetPort: lexicalConverterPort, name: "grpc", isProxied: false)
        .WithEnvironment("GRPC_PORT", lexicalConverterPort.ToString())
        .WithEnvironment("GRPC_HOST", grpcHost)
        .WithEnvironment("LEXICAL_PROTO_PATH", lexicalProtoPath);

    //マイグレーションとシードデータの投入サービス
    var dbManager = builder
        .AddProject<Projects.pecus_DbManager>("dbmanager")
        .WithReference(pecusDb)
        .WithReference(lexicalConverter)
        .WaitFor(lexicalConverter)
        .WaitFor(pecusDb);

    var backfire = builder
    .AddProject<Projects.pecus_BackFire>("backfire")
    .WithReference(redis)
    .WithReference(pecusDb)
    .WithReference(lexicalConverter)
    .WaitFor(redis)
    .WaitFor(pecusDb)
    .WaitFor(lexicalConverter)
    .WithEnvironment("UploadsCleanup__UploadsBasePath", uploadsPath);

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
        .WithEnvironment("Pecus__FileUpload__StoragePath", uploadsPath);

    // Frontendの設定(開発環境モード)
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