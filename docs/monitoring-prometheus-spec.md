# Prometheus監視導入仕様（pecus-aspire）

## 目的
- バックエンド（.NET）・フロントエンド（Next.js）・マイクロサービス（Nestjs/gRPC, 例：pecus-lexicalconverter）・インフラ（OS/外形監視）をPrometheusで統合監視する。
- 監視・可観測性の強化、障害検知・パフォーマンス分析・運用性向上を実現する。
- **Blue/Greenデプロイ環境**においても継続的な監視を実現する。

## 構成方針
- Prometheusは**外部公開せず、docker-compose内の専用ネットワークでのみ稼働**。
- 監視対象サービス（バックエンド/フロント/マイクロサービス/Exporter）は同一ネットワーク（例: `pecus-network` または `monitoring`）に参加。
- PrometheusのAPIはバックエンドから直接参照可能（同一ネットワーク内）。
- 必要に応じてExporter（Node Exporter, Blackbox Exporter等）を組み合わせ、三層監視を実現。
- gRPC通信を行うマイクロサービスも、HTTPで/metricsエンドポイントを公開すれば監視可能。
- **Blue/Green対応**: アプリケーションコンテナはBlue/Greenの両系が稼働する可能性があるため、Prometheusのターゲットには両系（例: `pecus-webapi-blue`, `pecus-webapi-green`）を登録する。停止中の系へのスクレイピングエラーは許容する。

## 監視対象・Exporter構成
- **アプリ監視**：
  - バックエンド（.NET）：`OpenTelemetry.Exporter.Prometheus.AspNetCore` を `pecus.ServiceDefaults` に導入し、`/metrics` エンドポイントを提供。
  - フロントエンド（Next.js）：`prom-client` を導入し、API Route (`src/app/api/metrics/route.ts`) で `/metrics` エンドポイントを提供。
  - マイクロサービス（Nestjs/gRPC, 例：pecus-lexicalconverter）：`@willsoto/nestjs-prometheus` (または `prom-client`) で `/metrics` エンドポイントを提供。
- **インフラ監視**：
  - Node ExporterでOSリソース監視
- **外形監視**：
  - Blackbox ExporterでAPI/フロント/マイクロサービスの死活監視

## docker-compose例（deploy-bluegreen構成）
`deploy-bluegreen/docker-compose.infra.yml` に監視基盤を追加し、アプリ側はネットワークに参加させる。

```yaml
# docker-compose.infra.yml (抜粋)
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./ops/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - pecus-network # 既存ネットワークに参加

  node-exporter:
    image: prom/node-exporter
    networks:
      - pecus-network

  blackbox-exporter:
    image: prom/blackbox-exporter
    networks:
      - pecus-network

networks:
  pecus-network:
    external: true
```

## prometheus.yml例（Blue/Green対応）
```yaml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets:
        - 'pecus-webapi-blue:8080'
        - 'pecus-webapi-green:8080'
  - job_name: 'frontend'
    static_configs:
      - targets:
        - 'pecus-frontend-blue:3000'
        - 'pecus-frontend-green:3000'
  - job_name: 'lexicalconverter'
    static_configs:
      - targets:
        - 'pecus-lexicalconverter-blue:8080'
        - 'pecus-lexicalconverter-green:8080'
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
        - http://pecus-webapi-blue:8080/health
        - http://pecus-webapi-green:8080/health
        - http://pecus-frontend-blue:3000/health
        - http://pecus-frontend-green:3000/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

## バックエンド・マイクロサービスからPrometheus集計値取得
- .NETやNestJSから`HttpClient`等で`http://prometheus:9090/api/v1/query?...`にアクセスし、PromQLで集計値を取得。
- 例：リクエスト数合計
```csharp
var response = await httpClient.GetAsync("http://prometheus:9090/api/v1/query?query=http_requests_total");
```

## 導入手順
1. **アプリ実装**:
   - **Backend**: `pecus.ServiceDefaults` に `OpenTelemetry.Exporter.Prometheus.AspNetCore` を追加し、`MapPrometheusScrapingEndpoint()` を設定。
   - **Frontend**: `prom-client` を追加し、`src/app/api/metrics/route.ts` を実装。
   - **Microservice**: `prom-client` 等でメトリクス公開実装。
2. **インフラ定義**: `deploy-bluegreen/docker-compose.infra.yml` に Prometheus 関連コンテナを追加。
3. **設定ファイル**: `deploy-bluegreen/ops/prometheus/prometheus.yml` を作成し、Blue/Green 両系をターゲットに設定。

## セキュリティ・運用
- Prometheusの`ports`は外部公開しない。
- docker-composeのネットワーク内で分離。
- 管理者のみ一時的に内部アクセス可能（ポートフォワード等）。

