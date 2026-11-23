# Operations CLI

直接使う入口は `coati` です。

```bash
./coati status
./coati inspect active
./coati logs active --tail=200
./coati smoke active
./coati start infra
./coati start monitoring
./coati stop app
./coati stop all
./coati backup
./coati restore <backup-file.dump>
```

- `stop app` はBlue/Green両方のアプリ層だけを停止します。
- `stop all` はアプリ、監視、DB・Redis等のインフラを停止します。
- どちらの停止も永続データを削除しません。
- `restore` と `stop all` は明示確認を要求します。

`release` と `rollback` は `deploy-pc/deploy.sh`、`deploy-pc/rollback.sh` から呼ばれる内部用途です。
