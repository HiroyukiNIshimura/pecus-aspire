# ============================================
# pecus.WebApi Dockerfile
# ============================================

# Use Debian-based images for gRPC Tools compatibility (Alpine ARM64 has issues)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS base
WORKDIR /app
EXPOSE 8080

# Install curl for healthcheck and Kerberos library for Npgsql
RUN apt-get update && apt-get install -y --no-install-recommends curl libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

# ============================================
# Build stage
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build
WORKDIR /src

# Copy project files
COPY ["pecus.WebApi/pecus.WebApi.csproj", "pecus.WebApi/"]
COPY ["pecus.Libs/pecus.Libs.csproj", "pecus.Libs/"]
COPY ["pecus.ServiceDefaults/pecus.ServiceDefaults.csproj", "pecus.ServiceDefaults/"]

# Restore dependencies
RUN dotnet restore "pecus.WebApi/pecus.WebApi.csproj"

# Copy source code
COPY pecus.WebApi/ pecus.WebApi/
COPY pecus.Libs/ pecus.Libs/
COPY pecus.ServiceDefaults/ pecus.ServiceDefaults/
COPY pecus.Protos/ pecus.Protos/

WORKDIR /src/pecus.WebApi
RUN dotnet build "pecus.WebApi.csproj" -c Release -o /app/build /p:SKIP_GRPC_CODEGEN=true

# ============================================
# Publish stage - use build output directly
# ============================================
FROM build AS publish
# dotnet publish has issues with Web SDK in certain configurations
# Use the build output directly
RUN mkdir -p /app/publish && \
    cp -r /app/build/* /app/publish/ && \
    test -f /app/publish/pecus.WebApi.dll

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create directories for uploads and logs
RUN mkdir -p /app/data/uploads /app/logs

ENTRYPOINT ["dotnet", "pecus.WebApi.dll"]
