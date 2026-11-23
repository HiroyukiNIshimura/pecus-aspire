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
./registry.sh releases
```

ロールバック対象を選ぶ場合は `list` ではなく `releases` を使用してください。
release ID、Git commit、コミットメッセージ、作成日時、manifestの完全性を表示します。

古いタグを整理:

```bash
./registry.sh prune      # 最新5個の完全なリリースを保持
./registry.sh prune 3    # 最新3個を保持
```

全5サービスに同じrelease tagとmanifestが存在するものだけを完全なリリースとして扱います。
途中失敗で一部サービスだけpushされたタグも削除対象です。タグ削除後、レジストリを一時停止してガベージコレクションを実行します。
