# Build PC

## 初回設定

```bash
cp .env.example .env
./registry.sh setup
```

## リリース作成

```bash
./release.sh
```

任意のimmutable tagを付ける場合:

```bash
./release.sh 20261123-prod
```

- 必ず全5サービスを同時にビルド・pushする
- 各イメージへGit revision、release ID、作成日時をOCIラベルとして埋め込む
- `releases/<release-id>.json` に各registry digestを保存する
- 全サービス成功後だけ `latest` を更新する
- tracked working treeがdirty、Git pull失敗、ビルド失敗時は中止する

レジストリ一覧:

```bash
./registry.sh list
```
