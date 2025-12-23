# ============================================
# pecus.WebApi Dockerfile
# ============================================

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 8080

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# ============================================
# Build stage
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
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

WORKDIR /src/pecus.WebApi
RUN dotnet build "pecus.WebApi.csproj" -c Release -o /app/build

# ============================================
# Publish stage
# ============================================
FROM build AS publish
RUN dotnet publish "pecus.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create directories for uploads and logs
RUN mkdir -p /app/data/uploads /app/logs

ENTRYPOINT ["dotnet", "pecus.WebApi.dll"]
