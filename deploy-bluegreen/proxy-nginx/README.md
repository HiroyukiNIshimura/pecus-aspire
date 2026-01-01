# deploy-bluegreen/proxy-nginx

このディレクトリは「別サーバーのプロキシNginx」用の設定テンプレートです。

- `deploy-bluegreen/nginx/` は **内部（blue/green 切替専用）Nginx** の設定
- `deploy-bluegreen/proxy-nginx/` は **外部公開するプロキシNginx** の設定（TLS終端）

## 使い方

1. `coati-bluegreen-proxy.conf` の以下を環境に合わせて変更
   - `server_name`
   - `ssl_certificate` / `ssl_certificate_key`
   - upstream `server <host>:<port>`（deploy-bluegreen nginx へ到達できるアドレス）

2. OS の Nginx に配置して reload

例:

```bash
sudo cp deploy-bluegreen/proxy-nginx/coati-bluegreen-proxy.conf /etc/nginx/sites-available/coati
sudo ln -sf /etc/nginx/sites-available/coati /etc/nginx/sites-enabled/coati
sudo nginx -t && sudo systemctl reload nginx
```

## トラブルシュート

### ERR_TOO_MANY_REDIRECTS になる

以下のような設定が入っていると、HTTPS で受けたリクエストが「同じ HTTPS へ 301」され続けてループします。

- `listen 443 ssl;` の server ブロック内に `return 301 https://$server_name$request_uri;` がある

HTTPS server ブロック内の `return 301 ...` は削除し、HTTP(80) 側だけで HTTPS へリダイレクトしてください。

### アプリ停止中に 502 にならない

基本的に、

- 外部プロキシ → 内部（deploy-bluegreen）Nginx が落ちている: 外部プロキシが 502
- 内部 Nginx は生きているが、blue/green のアプリが落ちている: 内部 Nginx が 502（外部プロキシがそのまま返す or `proxy_intercept_errors on;` で error_page を適用）

のどちらかになります。

もし 502 ではなくリダイレクトが発生している場合は、まず上の「ERR_TOO_MANY_REDIRECTS」の原因を確認してください。
