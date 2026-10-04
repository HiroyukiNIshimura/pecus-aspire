# ヘルス・メトリクス・可観測性

> 本ページは、2026-10-04時点の現行コードと運用定義を確認して記述しています。最終確認日: **2026-10-04**。

## 概要

Coati の可観測性は、アプリが公開するヘルス・メトリクス、.NET 共通のログ／テレメトリ設定、Prometheus と exporter による収集に分かれています。Aspire の開発構成と本番 Compose では probe の対象が同じとは限らず、Prometheus の scrape 対象もそれぞれの設定ファイルで確認する必要があります。[ServiceDefaults](../../pecus.ServiceDefaults/Extensions.cs) [AppHost](../../pecus.AppHost/AppHost.cs) [本番 Prometheus 設定](../../deploy/ops/prometheus/prometheus.yml)

## 構造とフロー

### .NET 共通のログ・ヘルス・テレメトリ

Web API、BackFire、DbManager は起動時に `AddServiceDefaults` を呼び出します。共通設定は Serilog、OpenTelemetry、標準 health check、service discovery、HTTP client の resilience／service discovery を登録します。[Web API の起動](../../pecus.WebApi/Program.cs) [BackFire の起動](../../pecus.BackFire/Program.cs) [DbManager の起動](../../pecus.DbManager/Program.cs) [ServiceDefaults](../../pecus.ServiceDefaults/Extensions.cs)

Serilog は共通 helper でコンソールと日次ファイル出力を設定し、ログコンテキスト、マシン名、環境名、アプリケーション名を enrich します。具体的な保存値・環境値はここでは扱いません。[SerilogHelper](../../pecus.Libs/SerilogHelper.cs)

OpenTelemetry のメトリクスは ASP.NET Core、HTTP client、runtime instrumentation と Prometheus exporter を登録します。トレースはアプリケーション名の Activity source、ASP.NET Core、HTTP client を対象とし、health／liveness のリクエストは ASP.NET Core tracing から除外します。OTLP exporter は endpoint 設定がある場合に有効になります。[ServiceDefaults](../../pecus.ServiceDefaults/Extensions.cs)

`MapDefaultEndpoints` を呼んだアプリでは、Prometheus 用 `/metrics`、全 health check を評価する `/health`、`live` タグの check のみを評価する `/alive` が map されます。既定の `self` check は `live` タグ付きです。Web API と DbManager はこの endpoint 群を map し、DbManager はさらに initializer の health check を登録します。一方、BackFire は `AddServiceDefaults` を呼びますが、現在の起動コードでは `MapDefaultEndpoints` を呼んでいません。[ServiceDefaults](../../pecus.ServiceDefaults/Extensions.cs) [Web API の起動](../../pecus.WebApi/Program.cs) [DbManager の起動](../../pecus.DbManager/Program.cs) [BackFire の起動](../../pecus.BackFire/Program.cs)

### サービス固有の観測面

- **Web API:** 共通 endpoint を map し、Prometheus exporter の `/metrics` と health endpoint を公開します。[Web API の起動](../../pecus.WebApi/Program.cs)
- **Frontend:** Next.js の `/api/metrics` Route Handler が `prom-client` の registry を返します。process の既定メトリクスに加えて、HTTP request counter／duration histogram／active connections gauge が定義されています。確認した Frontend ソースではこれらの独自 metric を更新する呼び出し元までは確認できず、定義と計測処理を同一視できません。[metrics Route Handler](../../pecus.Frontend/src/app/api/metrics/route.ts)
- **LexicalConverter:** NestJS の metrics HTTP server に `/metrics` と `/health` を用意し、`/health` は状態 JSON を返します。process の既定メトリクスに加えて gRPC request／conversion 用の counter と histogram が定義されていますが、確認したソース内では独自 metric の更新呼び出し元までは確認できません。[metrics controller](../../pecus.LexicalConverter/src/metrics/metrics.controller.ts) [起動処理](../../pecus.LexicalConverter/src/main.ts)

LexicalConverter はまず gRPC server の listen を開始し、その後に health／metrics 用 HTTP server を起動します。Aspire はこの HTTP endpoint の `/health` を readiness probe に使うため、health listener が gRPC より先に成功応答して依存サービスが早く起動する状態を避ける順序です。[AppHost](../../pecus.AppHost/AppHost.cs) [LexicalConverter 起動処理](../../pecus.LexicalConverter/src/main.ts)

### Prometheus の scrape 構成

本番の scrape job と参照先は次のとおりです。動的な file service discovery を使う項目の具体的な宛先値は転載せず、参照される target ファイルと収集経路を示します。[本番 Prometheus 設定](../../deploy/ops/prometheus/prometheus.yml)

| Job | 実際の設定で確認できる対象・経路 |
|---|---|
| Prometheus 自身 | 静的 target から自身の `/metrics` を scrape。 |
| Backend | `backend.json` の target を `/metrics` で scrape。target は slot 同期スクリプトが生成します。[target updater](../../deploy/ops/update-prometheus-targets.sh) |
| Frontend | `frontend.json` の target を `/api/metrics` で scrape。[metrics Route Handler](../../pecus.Frontend/src/app/api/metrics/route.ts) |
| LexicalConverter | `infra.json` の target を `/metrics` で scrape。[infra target](../../deploy/ops/prometheus/targets/infra.json) |
| Node Exporter | `node.json` の target を scrape。[node target](../../deploy/ops/prometheus/targets/node.json) |
| Blackbox Exporter | `blackbox.json` に定義された HTTP probe 対象を `/probe` に渡し、Blackbox Exporter が probe 結果を返す構成です。対象は Web API／Frontend の health URL です。[Blackbox 設定](../../deploy/ops/prometheus/blackbox.yml) [blackbox target](../../deploy/ops/prometheus/targets/blackbox.json) |

本番 monitoring Compose には Prometheus、Node Exporter、Blackbox Exporter が定義されています。Node Exporter はホスト OS 指標を提供し、Blackbox Exporter は外部 HTTP probe を実行します。[monitoring Compose](../../deploy/docker-compose.monitoring.yml)

Aspire では monitoring が有効な場合に限って Prometheus を追加し、開発用設定と `targets-dev` を読み取り専用でマウントします。開発用 scrape 設定にある job は Prometheus 自身、Backend、Frontend、LexicalConverter です。Backend は HTTPS と証明書検証設定を伴います。この開発構成には、本番の Node／Blackbox job はありません。[AppHost](../../pecus.AppHost/AppHost.cs) [開発用 Prometheus 設定](../../deploy/ops/prometheus/prometheus.dev.yml) [開発用 backend target](../../deploy/ops/prometheus/targets-dev/backend.json) [開発用 frontend target](../../deploy/ops/prometheus/targets-dev/frontend.json) [開発用 infra target](../../deploy/ops/prometheus/targets-dev/infra.json)

### Blue/Green target 同期と probe の差

`update-prometheus-targets.sh` は引数で slot を受け取るか、引数がなければ `active_slot` を使って、Backend／BackFire／Frontend の target JSON を生成します。スクリプトが BackFire 用ファイルも生成する一方、現在の本番 Prometheus 設定にはそのファイルを参照する scrape job がありません。また BackFire の起動コードは共通 endpoint を map していません。このため、target ファイルの生成だけでは BackFire のメトリクス収集が成立するとは言えません。[target updater](../../deploy/ops/update-prometheus-targets.sh) [本番 Prometheus 設定](../../deploy/ops/prometheus/prometheus.yml) [BackFire の起動](../../pecus.BackFire/Program.cs)

Web API の probe path は構成間で異なります。AppHost は `/` を指定し、Compose の Blue／Green Web API healthcheck は `/health` を指定します。Web API の起動コードは Development 環境で Swagger UI も root path に map するため、AppHost の root probe は共通 `/health` endpoint と同じ判定経路ではありません。[AppHost](../../pecus.AppHost/AppHost.cs) [Web API の起動](../../pecus.WebApi/Program.cs) [Blue Compose](../../deploy/docker-compose.app-blue.yml) [Green Compose](../../deploy/docker-compose.app-green.yml)

LexicalConverter も probe 方法が異なります。AppHost は metrics HTTP endpoint 上の `/health` を使いますが、本番 infra Compose の healthcheck は gRPC listener への TCP 接続を確認し、HTTP health endpoint は使いません。Prometheus の metrics scrape は別途 metrics HTTP server に向かいます。[AppHost](../../pecus.AppHost/AppHost.cs) [LexicalConverter 起動処理](../../pecus.LexicalConverter/src/main.ts) [infra Compose](../../deploy/docker-compose.infra.yml)

slot の切替手順や運用上の順序はこのページでは扱わず、[配布・デプロイ・復旧運用](deployment-operations.md)を参照してください。

## 主なコード実体

| 実体 | 役割 |
|---|---|
| [`pecus.ServiceDefaults/Extensions.cs`](../../pecus.ServiceDefaults/Extensions.cs) | .NET 共通の Serilog／OpenTelemetry／health 登録と endpoint mapping。 |
| [`pecus.Libs/SerilogHelper.cs`](../../pecus.Libs/SerilogHelper.cs) | Serilog の共通 sink と enrich 設定。 |
| [`pecus.AppHost/AppHost.cs`](../../pecus.AppHost/AppHost.cs) | 開発時 Prometheus 登録と、Web API／LexicalConverter の Aspire health probe。 |
| [`pecus.LexicalConverter/src/main.ts`](../../pecus.LexicalConverter/src/main.ts)、[`metrics.controller.ts`](../../pecus.LexicalConverter/src/metrics/metrics.controller.ts) | gRPC／HTTP listener の起動順と health／metrics endpoint。 |
| [`pecus.Frontend/src/app/api/metrics/route.ts`](../../pecus.Frontend/src/app/api/metrics/route.ts) | Frontend の Prometheus registry と HTTP Route Handler。 |
| [`deploy/ops/prometheus/prometheus.yml`](../../deploy/ops/prometheus/prometheus.yml)、[`prometheus.dev.yml`](../../deploy/ops/prometheus/prometheus.dev.yml) | 本番／開発の scrape job と target discovery。 |
| [`deploy/ops/update-prometheus-targets.sh`](../../deploy/ops/update-prometheus-targets.sh) | 選択 slot に応じた app target JSON の生成。 |
| [`deploy/docker-compose.monitoring.yml`](../../deploy/docker-compose.monitoring.yml)、[`docker-compose.app-blue.yml`](../../deploy/docker-compose.app-blue.yml) | 本番 monitoring/exporter と Web API container healthcheck。 |

## 関連ページ

- [実行時システムの境界と起動トポロジー](system-topology.md)
- [Frontend のリクエストとセッション](frontend-request-flow.md)
- [チャット・アジェンダ・リアルタイム通知](collaboration-realtime.md)
- [配布・デプロイ・復旧運用](deployment-operations.md)

## 未確認事項

今回確認した monitoring Compose と Prometheus 設定では、Dashboard や alert rule の定義は確認できていません。存在を断定しません。Prometheus の retention 設定自体は AppHost と monitoring Compose の双方で定義されていますが、設定値は転載しません。[AppHost](../../pecus.AppHost/AppHost.cs) [monitoring Compose](../../deploy/docker-compose.monitoring.yml)
