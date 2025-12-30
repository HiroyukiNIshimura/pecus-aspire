# ============================================
# pecus.BackFire Dockerfile (Hangfire)
# ============================================

# Use Debian-based images for gRPC Tools compatibility (Alpine ARM64 has issues)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS base
WORKDIR /app
EXPOSE 8080

# Install Kerberos library required by Npgsql
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

# ============================================
# Build stage
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src

# Copy project files
COPY ["pecus.BackFire/pecus.BackFire.csproj", "pecus.BackFire/"]
COPY ["pecus.Libs/pecus.Libs.csproj", "pecus.Libs/"]
COPY ["pecus.ServiceDefaults/pecus.ServiceDefaults.csproj", "pecus.ServiceDefaults/"]
COPY ["pecus.DbManager/pecus.DbManager.csproj", "pecus.DbManager/"]

# Restore dependencies
RUN dotnet restore "pecus.BackFire/pecus.BackFire.csproj"

# Copy source code
COPY pecus.BackFire/ pecus.BackFire/
COPY pecus.Libs/ pecus.Libs/
COPY pecus.ServiceDefaults/ pecus.ServiceDefaults/
COPY pecus.DbManager/ pecus.DbManager/
COPY pecus.Protos/ pecus.Protos/

WORKDIR /src/pecus.BackFire
RUN dotnet build "pecus.BackFire.csproj" -c Release -o /app/build /p:SKIP_GRPC_CODEGEN=true

# ============================================
# Publish stage - use build output directly
# ============================================
FROM build AS publish
RUN mkdir -p /app/publish && \
    cp -r /app/build/* /app/publish/ && \
    ls -la /app/publish/ && \
    test -f /app/publish/pecus.BackFire.dll

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Set timezone to JST
ENV TZ=Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create directories for data and logs
RUN mkdir -p /app/data/uploads /app/data/notifications /app/logs

ENTRYPOINT ["dotnet", "pecus.BackFire.dll"]
