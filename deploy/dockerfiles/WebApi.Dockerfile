# ============================================
# pecus.WebApi Dockerfile
# ============================================

# Use Debian-based images for gRPC Tools compatibility (Alpine ARM64 has issues)
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS base
WORKDIR /app
# EXPOSE is documentation only; actual port is set via ASPNETCORE_URLS env var
EXPOSE 7265

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

# ============================================
# Publish stage - use dotnet publish
# ============================================
FROM build AS publish
WORKDIR /src/pecus.WebApi
RUN dotnet publish "pecus.WebApi.csproj" -c Release -o /app/publish \
    --self-contained false \
    /p:SKIP_GRPC_CODEGEN=true \
    /p:PublishReadyToRun=false && \
    ls -la /app/publish/ && \
    test -f /app/publish/pecus.WebApi.dll

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Copy mail templates from source
COPY --from=build /src/pecus.Libs/Mail/Templates ./Mail/Templates

# Set timezone to JST
ENV TZ=Asia/Tokyo
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create directories for uploads and logs
RUN mkdir -p /app/data/uploads /app/logs

ENTRYPOINT ["dotnet", "pecus.WebApi.dll"]
