# Prometheus 監視導入仕様（pecus-aspire）

## AI エージェント向け要約（必読）

- **監視基盤は独立**: `docker-compose.monitoring.yml` で管理（`docker-compose.infra.yml` とは分離）
- **ターゲットは動的管理**: `file_sd_config` を使用し、`targets/*.json` ファイルで監視対象を制御
- **Blue/Green対応**: `ops/update-prometheus-targets.sh` でアクティブスロットのみを監視対象に設定
- **セキュリティ**: `/api/metrics` は Nginx で Docker 内部ネットワークからのみアクセス許可
- **設定ファイルは手動管理**: `generate-appsettings.js` からは生成しない（Git 管理）

## 目的

- バックエンド（.NET）・フロントエンド（Next.js）・マイクロサービス（NestJS/gRPC）・インフラ（OS/外形監視）を Prometheus で統合監視
- Blue/Green デプロイ環境で、アクティブスロットのみを動的に監視
- 監視基盤と監視対象を分離し、独立した運用を実現

## アーキテクチャ

### ディレクトリ構成

```
deploy-bluegreen/
├── docker-compose.infra.yml       # PostgreSQL, Redis, Nginx（監視対象）
├── docker-compose.monitoring.yml  # Prometheus, Exporters（監視基盤）← 分離
├── docker-compose.app-blue.yml
├── docker-compose.app-green.yml
├── nginx/
│   └── conf.d/
│       └── 10-coati.conf          # /api/metrics をブロック
└── ops/
    ├── prometheus/
    │   ├── prometheus.yml         # 本番用（file_sd_config）
    │   ├── prometheus.dev.yml     # 開発用（Aspire）
    │   ├── blackbox.yml
    │   ├── targets/               # 本番用ターゲット（動的生成）
    │   │   ├── backend.json
    │   │   ├── frontend.json
    │   │   ├── infra.json
    │   │   ├── node.json
    │   │   └── blackbox.json
    │   └── targets-dev/           # 開発用ターゲット（静的）
    │       ├── backend.json
    │       ├── frontend.json
    │       └── infra.json
    ├── update-prometheus-targets.sh  # ターゲット更新スクリプト
    ├── infra-up.sh                   # インフラ + 監視基盤起動
    ├── switch-node.sh                # Blue/Green切替（ターゲット更新含む）
    └── status.sh                     # 状態確認
```

### 責務分離

| compose ファイル | 責務 | サービス |
|-----------------|------|---------|
| `docker-compose.infra.yml` | アプリ基盤 | PostgreSQL, Redis, Nginx, LexicalConverter |
| `docker-compose.monitoring.yml` | 監視基盤 | Prometheus, Node Exporter, Blackbox Exporter |
| `docker-compose.app-*.yml` | アプリケーション | WebAPI, Frontend, BackFire |

## File Service Discovery

### 概要

Prometheus の `file_sd_config` を使用し、ターゲットファイル（JSON）で監視対象を動的に管理します。
これにより Blue/Green 切り替え時に Prometheus の再起動なしでターゲットを更新できます。

### prometheus.yml（本番）

```yaml
scrape_configs:
  - job_name: "backend"
    metrics_path: /metrics
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/backend.json'
        refresh_interval: 30s

  - job_name: "frontend"
    metrics_path: /api/metrics
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/frontend.json'
        refresh_interval: 30s
```

### ターゲットファイル例（targets/backend.json）

```json
[
  {
    "targets": ["pecusapi-blue:7265"],
    "labels": {
      "slot": "blue",
      "env": "production",
      "service": "backend"
    }
  }
]
```

### ターゲット更新スクリプト

```bash
# アクティブスロットを指定してターゲット更新
./ops/update-prometheus-targets.sh blue

# または active_slot ファイルから自動取得
./ops/update-prometheus-targets.sh
```

## Blue/Green 切り替えフロー

1. `switch-node.sh blue` 実行
2. 新スロットのアプリをデプロイ
3. 旧スロットを停止
4. Nginx を新スロットに切り替え
5. **`update-prometheus-targets.sh` でターゲット更新**（自動実行）
6. Prometheus が 30 秒以内に新ターゲットを検出

## セキュリティ

### /api/metrics のアクセス制限

フロントエンドの `/api/metrics` は内部監視専用のため、Nginx で外部アクセスをブロックします。

```nginx
# 10-coati.conf
location = /api/metrics {
  # Docker 内部ネットワークからのみ許可
  allow 172.16.0.0/12;
  allow 10.0.0.0/8;
  allow 192.168.0.0/16;
  deny all;
  proxy_pass http://$coati_frontend_upstream;
}
```

### Prometheus のアクセス

- Prometheus は外部公開しない（`ports` 設定なし）
- Docker ネットワーク内からのみアクセス可能
- フロントエンドからは `PROMETHEUS_URL` 環境変数経由でアクセス

## 開発環境（Aspire）

### AppHost 設定

```csharp
// pecus.AppHost/AppHost.cs
var prometheusBasePath = Path.GetFullPath(Path.Combine(
    AppContext.BaseDirectory, "..", "..", "..", "..",
    "deploy-bluegreen", "ops", "prometheus"));
var prometheusConfigPath = Path.Combine(prometheusBasePath, "prometheus.dev.yml");
var prometheusTargetsPath = Path.Combine(prometheusBasePath, "targets-dev");

if (monitoringEnabled)
{
    prometheus = builder.AddContainer("prometheus", "prom/prometheus", "v3.4.1")
        .WithBindMount(prometheusConfigPath, "/etc/prometheus/prometheus.yml", isReadOnly: true)
        .WithBindMount(prometheusTargetsPath, "/etc/prometheus/targets", isReadOnly: true)
        .WithHttpEndpoint(port: prometheusPort, targetPort: 9090, name: "prometheus-http")
        .WithArgs("--config.file=/etc/prometheus/prometheus.yml",
                  "--storage.tsdb.retention.time=7d",
                  "--web.enable-lifecycle");
}
```

### 開発用ターゲット（targets-dev/）

開発環境では静的なターゲットファイルを使用（Git 管理）:

```json
// targets-dev/backend.json
[
  {
    "targets": ["host.docker.internal:7265"],
    "labels": {
      "env": "development",
      "service": "backend"
    }
  }
]
```

## 運用コマンド

### インフラ + 監視基盤起動

```bash
cd deploy-bluegreen/ops
./infra-up.sh
```

### 監視基盤のみ再起動

```bash
cd deploy-bluegreen/ops
source lib.sh
compose_monitoring restart
```

### ターゲット手動更新

```bash
cd deploy-bluegreen/ops
./update-prometheus-targets.sh blue
```

### 状態確認

```bash
cd deploy-bluegreen/ops
./status.sh
```

## 監視対象・メトリクスエンドポイント

| サービス | エンドポイント | ライブラリ |
|---------|--------------|-----------|
| Backend (.NET) | `/metrics` | OpenTelemetry.Exporter.Prometheus.AspNetCore |
| Frontend (Next.js) | `/api/metrics` | prom-client |
| LexicalConverter (NestJS) | `/metrics` (port 9101) | prom-client |
| Node Exporter | `:9100/metrics` | - |
| Blackbox Exporter | `:9115/probe` | - |

## 設定管理

### 重要: prometheus.yml は手動管理

`prometheus.yml` および `prometheus.dev.yml` は `generate-appsettings.js` からは生成しません。
理由:

1. ターゲットは `file_sd_config` で動的管理するため、YAML 構造は固定
2. 設定変更頻度が低く、手動管理で十分
3. `targets/*.json` のみがデプロイ状態に応じて変更される

### settings.base.json の monitoring セクション

AppHost での Prometheus 有効/無効化に使用:

```json
{
  "_infrastructure": {
    "monitoring": {
      "enabled": true,
      "prometheus": {
        "port": 9090
      }
    }
  }
}
```

