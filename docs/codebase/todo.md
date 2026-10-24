# コードベース要確認事項

> 2026-10-04時点のコードを静的に確認した結果。実行環境での再現・統合検証は未実施。確定した不具合と、要件や運用条件が分からないと判断できない項目を分けて記録する。

## 要件・実行環境の確認が必要な項目

- [ ] **Hangfireジョブの部分失敗と再実行方針**
  - **要注意：今回の2タスクでは、復旧しそうな一時障害（SMTP・DB・Redisなど）ほど宛先／組織単位のcatch経路に入りやすい。catch後に処理を続けてジョブが正常終了するとHangfireの自動retryは発動しない。** 週間レポートのメール送信失敗は再送されず、システム通知の組織別失敗も通知全体が処理済みになると回収されない場合がある。自動retryの対象になるのは、例外がジョブ実行境界まで伝播したケースに限られる。
  - [WeeklyReportTasks.cs](../../pecus.Libs/Hangfire/Tasks/WeeklyReportTasks.cs) は組織ごとにジョブを作成し、ユーザーごとのメール送信例外をcatchして記録後、次のユーザーへ進む。失敗数はログにのみ残り、個別失敗があってもジョブは正常終了するためHangfireの自動retry対象にならず、失敗宛先の送信状態も永続化されない。組織ジョブを再実行すると成功済みユーザーにも再送され得る。また、日次の組織ジョブ投入が途中で失敗してretryされた場合、既に投入した組織ジョブが重複する可能性がある。
  - [SystemNotificationDeliveryTask.cs](../../pecus.Libs/Hangfire/Tasks/SystemNotificationDeliveryTask.cs) は組織単位の配信例外をcatchして継続し、通知全体を処理済みにして成功したメッセージIDだけを保存する。組織別の失敗状態は保存されず、全組織への配信に失敗した場合やシステムルーム／SystemBotがない場合も処理済みとなり得る。通知単位の例外もcatchされHangfireへ再throwされないが、未処理のまま残れば毎分の定期ジョブが再び対象にする（Hangfire retryとは別）。処理途中の再実行では、既に保存されたチャットメッセージが重複する可能性がある。メッセージ保存後のRedis Pub/Sub publish失敗も組織単位でcatchされるため、保存済みメッセージIDが通知の`MessageIds`に含まれない場合がある。
  - BackFireはHangfire 1.8.25を使用し、コード上に`AutomaticRetry`属性やretry回数のグローバル上書きは見当たらない。Hangfire公式資料上の既定値は最大10回だが、例外がジョブ外へ伝播した場合に限られ、上記のcatchされた部分失敗には適用されない。実際の稼働環境での有効設定は未確認。
  - 管理画面のHangfire表示は集計統計（Failed等）であり、catchされた宛先別失敗はFailed件数から把握できない。BackFireのHangfire DashboardはDevelopment環境のみ有効。リポジトリ内では対象ログのアラート設定を確認できず、外部ログ基盤での監視有無は未確認。
  - 失敗宛先だけの再送、運用通知、失敗状態の保持が必要かを決める。全ジョブ再実行は成功済み宛先への重複送信につながり得るため、宛先単位の結果管理と重複防止も合わせて方針化する。実行環境での再現・統合確認は未実施。

- [ ] **BackFireのメトリクス収集要否**
  - BackFireは `AddServiceDefaults` を呼ぶが、起動コードで `MapDefaultEndpoints` を呼んでいない。Prometheus設定にもBackFireのscrape jobは見当たらず、target生成スクリプトがBackFire用targetを生成するだけでは収集されない。
  - BackFireのメトリクス収集が要件か確認し、必要ならendpoint公開とPrometheus scrape設定の両方を対象にする。
  - 関連: [BackFire Program.cs](../../pecus.BackFire/Program.cs)、[prometheus.yml](../../deploy/ops/prometheus/prometheus.yml)、[update-prometheus-targets.sh](../../deploy/ops/update-prometheus-targets.sh)

## 記述の再確認

- [ ] **DB restore helperの「不整合」記述を訂正する**
  - [deployment-operations.md](./deployment-operations.md) にはrestore helperと呼び出しスクリプトに不整合があり、復元可能と確認できない旨が記載されている。
  - 現行の [pg-restore.sh](../../deploy/ops/pg-restore.sh) と [docker-compose.restore-helper.yml](../../deploy/docker-compose.restore-helper.yml) を静的に照合した範囲では、呼び出し先や `BACKUP_FILE` の受け渡しに明確な不整合は見つからなかった。記述が古い可能性があるため、履歴・実環境での動作を確認してから該当ページを更新する。実DBへの復元は破壊的操作なので、許可された検証環境でのみ動作確認する。