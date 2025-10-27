# Redis トークンストア — キーと操作

このドキュメントでは、本プロジェクトでリフレッシュトークンとトークンのブラックリスト管理に使用する Redis キー・データ構造を説明します。
Hangfireが利用する内容についてはこのドキュメントに記載はしません。


目的
- キー名・型・TTL・サンプル Redis コマンドを明確にして、運用者や統合担当者がトークン状態を調査・トラブルシュート・管理できるようにすること。

基本方針
- リフレッシュトークンやブラックリスト情報は Redis に保存して、複数の API インスタンス間でトークン状態を共有します。
- キーは接頭辞を明示して衝突を避けます：`refresh:`, `refresh_user:`, `blacklist:`, `user_jtis:`。
- TTL を設定して古いトークンが自動的に削除されるようにします。

キーと型

1) リフレッシュトークンのエントリ
- キー: `refresh:{token}`
- 型: string（JSON ペイロード）
- 値: JSON シリアライズされたオブジェクト例：{ "Token": "<token>", "UserId": <userId>, "ExpiresAt": "<UTC ISO datetime>" }
- TTL: トークンの有効期限（例: 30日）
- 用途: トークンの検証や所有者取得のためのルックアップ

サンプルコマンド：

```text
# 読み取り
GET refresh:012345abcdef
# 削除（取り消し）
DEL refresh:012345abcdef
# TTL の確認
TTL refresh:012345abcdef
```

2) ユーザー単位のリフレッシュトークン集合
- キー: `refresh_user:{userId}`
- 型: set
- メンバー: トークン文字列
- TTL: 長め（例: 31日） — 書き込み時に更新
- 用途: あるユーザーに発行された全リフレッシュトークンの一覧取得（まとめて取り消す用途）

サンプルコマンド：

```text
# 一覧
SMEMBERS refresh_user:42
# 集合からトークンを除去
SREM refresh_user:42 012345abcdef
# 全取り消し: SMEMBERS をループして各トークンの refresh:{token} を DEL、その後 refresh_user:42 を DEL
```

3) トークンブラックリスト（JTI）
- キー: `blacklist:{jti}`
- 型: string（値は定数マーカー、例: "1"）
- TTL: JWT の有効期限まで（または安全側のデフォルト）
- 用途: キーが存在する場合、その JTI は取り消されたものとしてトークン検証で拒否する

サンプルコマンド：

```text
# ブラックリストに追加（例: 1時間後にexpires）
SETEX blacklist:abcd-jti-0001 3600 1
# 存在確認
EXISTS blacklist:abcd-jti-0001
# 削除（通常は稀）
DEL blacklist:abcd-jti-0001
```

4) ユーザー単位の JTI リスト（発行された JTI を追跡）
- キー: `user_jtis:{userId}`
- 型: set
- メンバー: jti 文字列
- TTL: 長め（例: 31日）
- 用途: ユーザーのアクティブな JTI を管理し、まとめて無効化（例: 現在以外を取り消す）する際に利用

サンプルコマンド：

```text
# 新しい jti を追加
SADD user_jtis:42 abcd-jti-0001
# 一覧取得
SMEMBERS user_jtis:42
# 全てをブラックリスト化する例
for jti in $(redis-cli SMEMBERS user_jtis:42); do redis-cli SETEX blacklist:$jti 2592000 1; done
```

運用上の注意

- 有効期限の整合性: アクセストークンとリフレッシュトークンを同時に発行する場合、ブラックリストの TTL や refresh エントリの TTL をトークンの有効期限に合わせて設定してください。
- 原子性: 取り消しと集合からの除去を同時に行うような操作はマルチキー操作が必要です。まとめて（atomic）に取り消す必要がある場合は Lua スクリプトを検討してください。
- スケーラビリティ: set が大きくなる可能性があります。古いエントリを自動的に期限切れにしたい場合は、タイムスタンプ付きの sorted set を使うなどの対策を検討してください。
- セキュリティ: Redis は機密扱いとし、ACL やネットワーク制限を適用してください。キーや生トークンをログに出力しないでください。

トラブルシュート例

- "ユーザーが有効なトークンを使えないと報告" — `blacklist:{jti}` の有無や `user_jtis:{userId}` の操作を確認してください。
- "リフレッシュできない" — `refresh:{token}` が存在しているか、TTL が切れていないか、`refresh_user:{userId}` のメンバーシップを確認してください。

移行に関する注意

- ローカルメモリキャッシュから Redis に移行する場合は、すべての実行中インスタンスを再起動して共有ストアを使うようにしてください。
- バックアップ: 障害復旧計画として Redis の RDB/AOF スナップショットを保存してください。

問い合わせ先
- 実装の詳細は `pecus.WebApi/Services` にある `RefreshTokenService` と `TokenBlacklistService` を参照してください。
