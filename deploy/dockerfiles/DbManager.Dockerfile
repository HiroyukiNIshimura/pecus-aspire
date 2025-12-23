# ============================================
# pecus.DbManager Dockerfile (Migration & Seed)
# ============================================

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app

# ============================================
# Build stage
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
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

WORKDIR /src/pecus.DbManager
RUN dotnet build "pecus.DbManager.csproj" -c Release -o /app/build

# ============================================
# Publish stage
# ============================================
FROM build AS publish
RUN dotnet publish "pecus.DbManager.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create directory for logs
RUN mkdir -p /app/logs

ENTRYPOINT ["dotnet", "pecus.DbManager.dll"]
