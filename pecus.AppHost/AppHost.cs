var builder = DistributedApplication.CreateBuilder(args);

var username = builder.AddParameter("username", secret: true);
var password = builder.AddParameter("password", secret: true);

var redis = builder.AddRedis("redis");

var postgres = builder
    .AddPostgres("postgres", userName: username, password: password)
    .WithDataVolume(isReadOnly: false);
var pecusDb = postgres.AddDatabase("pecusdb");

var backfire = builder
    .AddProject<Projects.pecus_BackFire>("backfire")
    .WithReference(redis)
    .WaitFor(redis);

var pecusApi = builder
    .AddProject<Projects.pecus_WebApi>("pecusapi")
    .WithReference(pecusDb)
    .WithReference(redis)
    .WaitFor(pecusDb)
    .WaitFor(redis)
    .WithHttpHealthCheck("/");

builder.Build().Run();
