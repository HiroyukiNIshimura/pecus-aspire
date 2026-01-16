using Pecus.Libs;
using Serilog;

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
    var redisFrontendPort = int.TryParse(infraConfig["redisFrontend:port"], out var rdFrontPort) ? (int?)rdFrontPort : null;
    var lexicalConverterPort = int.TryParse(infraConfig["ports:lexicalConverter"], out var lcPort) ? lcPort : 5100;
    var lexicalConverterMetricsPort = int.TryParse(infraConfig["ports:lexicalConverterMetrics"], out var lcMetricsPort) ? lcMetricsPort : 9101;
    var grpcHost = infraConfig["grpc:host"] ?? "0.0.0.0";
    var monitoringEnabled = bool.TryParse(infraConfig["monitoring:enabled"], out var monEnabled) && monEnabled;
    var prometheusPort = int.TryParse(infraConfig["monitoring:prometheus:port"], out var promPort) ? promPort : 9090;

    //パラメータをログに表示（パスワードは除く）
    Log.Information("PostgreSQL User: {PostgresUser}", postgresUser);
    Log.Information("PostgreSQL Port: {PostgresPort}", postgresPort?.ToString() ?? "default");
    Log.Information("PostgreSQL Image: {PostgresImage}", postgresImage);
    Log.Information("Redis Port: {RedisPort}", redisPort?.ToString() ?? "default");
    Log.Information("Redis Frontend Port: {RedisFrontendPort}", redisFrontendPort?.ToString() ?? "default");
    Log.Information("Lexical Converter Port: {LexicalConverterPort}", lexicalConverterPort);
    Log.Information("gRPC Host: {GrpcHost}", grpcHost);
    Log.Information("Monitoring Enabled: {MonitoringEnabled}", monitoringEnabled);
    Log.Information("Prometheus Port: {PrometheusPort}", prometheusPort);

    var username = builder.AddParameter("username", postgresUser);
    var password = builder.AddParameter("password", postgresPassword);

    // Redis: ポート指定があれば使用、なければ Aspire のデフォルト（ランダム）
    var redis = redisPort.HasValue
        ? builder.AddRedis("redis", port: redisPort.Value)
        : builder.AddRedis("redis");

    // フロントエンド用 Redis: ポート指定があれば使用、なければ Aspire のデフォルト（ランダム）
    var redisFrontend = redisFrontendPort.HasValue
        ? builder.AddRedis("redisFrontend", port: redisFrontendPort.Value)
        : builder.AddRedis("redisFrontend");

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

    // Prometheus 設定ファイルの絶対パスを取得
    var prometheusBasePath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "deploy", "ops", "prometheus"));
    var prometheusConfigPath = Path.Combine(prometheusBasePath, "prometheus.dev.yml");
    var prometheusTargetsPath = Path.Combine(prometheusBasePath, "targets-dev");
    Log.Information("Prometheus config path: {PrometheusConfigPath}", prometheusConfigPath);
    Log.Information("Prometheus targets path: {PrometheusTargetsPath}", prometheusTargetsPath);

    // Prometheus (Monitoring) - 監視が有効な場合のみ起動
    IResourceBuilder<ContainerResource>? prometheus = null;
    if (monitoringEnabled)
    {
        prometheus = builder.AddContainer("prometheus", "prom/prometheus", "v3.4.1")
            .WithBindMount(prometheusConfigPath, "/etc/prometheus/prometheus.yml", isReadOnly: true)
            .WithBindMount(prometheusTargetsPath, "/etc/prometheus/targets", isReadOnly: true)
            .WithHttpEndpoint(port: prometheusPort, targetPort: 9090, name: "prometheus-http")
            .WithArgs("--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.retention.time=7d", "--web.enable-lifecycle");
    }

    // Lexical Converter (Node.js gRPC Service)
    var lexicalConverter = builder.AddNpmApp("lexicalconverter", "../pecus.LexicalConverter", "start:dev")
        .WithNpmPackageInstallation()
        .WithHttpEndpoint(targetPort: lexicalConverterPort, name: "grpc", isProxied: false)
        .WithHttpEndpoint(targetPort: lexicalConverterMetricsPort, name: "metrics", isProxied: false)
        .WithEnvironment("GRPC_PORT", lexicalConverterPort.ToString())
        .WithEnvironment("GRPC_HOST", grpcHost)
        .WithEnvironment("METRICS_PORT", lexicalConverterMetricsPort.ToString())
        .WithEnvironment("LEXICAL_PROTO_PATH", lexicalProtoPath);

    //マイグレーションとシードデータの投入サービス
    var dbManager = builder
        .AddProject<Projects.pecus_DbManager>("dbmanager")
        .WithReference(pecusDb)
        .WithReference(lexicalConverter)
        .WaitFor(lexicalConverter)
        .WaitFor(pecusDb)
        .WithEnvironment("FileUpload__StoragePath", uploadsPath);

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
    var frontendBuilder = builder.AddNpmApp("frontend", "../pecus.Frontend", "dev")
        .WithReference(pecusApi)
        .WithReference(redisFrontend)
        .WaitFor(redisFrontend)
        .WaitFor(pecusApi)
        .WithNpmPackageInstallation()
        .WithExternalHttpEndpoints()
        // 開発環境: Aspire の自己署名証明書を許可
        .WithEnvironment("NODE_TLS_REJECT_UNAUTHORIZED", "0");

    // Prometheus が有効な場合、フロントエンドに参照を追加
    if (prometheus != null)
    {
        var prometheusUrl = $"http://localhost:{prometheusPort}";
        frontendBuilder
            .WaitFor(prometheus)
            .WithEnvironment("PROMETHEUS_URL", prometheusUrl)
            .WithEnvironment("DISK_MOUNT_POINTS", "/");  // 開発環境は / のみ
    }

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