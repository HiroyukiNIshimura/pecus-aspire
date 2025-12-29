# ============================================
# pecus.DbManager Dockerfile (Migration & Seed)
# ============================================

# Use Debian-based images for gRPC Tools compatibility (Alpine ARM64 has issues)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview-noble AS base
WORKDIR /app

# Install Kerberos library required by Npgsql
RUN apt-get update && apt-get install -y --no-install-recommends libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

# ============================================
# Build stage
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview-noble AS build
WORKDIR /src

# Copy project files
COPY ["pecus.DbManager/pecus.DbManager.csproj", "pecus.DbManager/"]
COPY ["pecus.Libs/pecus.Libs.csproj", "pecus.Libs/"]
COPY ["pecus.ServiceDefaults/pecus.ServiceDefaults.csproj", "pecus.ServiceDefaults/"]

# Restore dependencies
RUN dotnet restore "pecus.DbManager/pecus.DbManager.csproj"

# Copy source code
COPY pecus.DbManager/ pecus.DbManager/
COPY pecus.Libs/ pecus.Libs/
COPY pecus.ServiceDefaults/ pecus.ServiceDefaults/
COPY pecus.Protos/ pecus.Protos/

WORKDIR /src/pecus.DbManager
RUN dotnet build "pecus.DbManager.csproj" -c Release -o /app/build /p:SKIP_GRPC_CODEGEN=true

# ============================================
# Publish stage
# ============================================
# ============================================
# Publish stage - use build output directly
# ============================================
FROM build AS publish
# dotnet publish has issues with Web SDK in certain configurations
# Use the build output directly
RUN mkdir -p /app/publish && \
    cp -r /app/build/* /app/publish/ && \
    test -f /app/publish/pecus.DbManager.dll

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create directory for logs
RUN mkdir -p /app/logs

ENTRYPOINT ["dotnet", "pecus.DbManager.dll"]
