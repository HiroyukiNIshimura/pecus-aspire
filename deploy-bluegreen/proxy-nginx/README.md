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
