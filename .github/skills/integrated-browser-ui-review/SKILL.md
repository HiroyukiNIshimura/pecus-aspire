---
name: integrated-browser-ui-review
description: '共有された VS Code 統合ブラウザで `http://localhost:3000` の開発ページを開く。Use when asked to open or share the integrated browser for localhost:3000. Do not use for other URLs or for Playwright CLI/E2E test creation or execution.'
---

# 統合ブラウザを開く

共有された VS Code 統合ブラウザで、`http://localhost:3000` の開発環境ページを開くためのスキルです。これは E2E テストの設計・作成・実行ではありません。

## 使用する場面

- 「統合ブラウザを開く」「ブラウザを共有して確認して」などの依頼
- `http://localhost:3000` を統合ブラウザで開く依頼

## 基本方針

- 共有済みページがある場合は必ず再利用し、不要なタブを増やさない。
- 許可する URL は `http://localhost:3000` とその配下だけとする。指定 URL がそれ以外の場合は、開く・遷移する・操作することを行わない。
- E2E テスト、Playwright CLI、テストファイル、テスト設定を作成・実行・変更しない。これらは利用者が明示的に依頼した場合だけ扱う。

## 秘密情報とログイン

- `http://localhost:3000` の開発環境に限り、利用者がエディターで選択して提示したデモユーザー情報、または `config/settings.base.dev.json` の `dbmanager.DemoMode.Users` にあるメールアドレスとパスワードを、共有ブラウザのログインフォームへ入力してよい。
- 認証情報の値を会話で再掲・報告しない。`localhost` 以外の URL、`dbmanager.DemoMode.Users` 以外の設定値、環境変数、トークンは使用しない。

## 実行手順

1. 共有されているブラウザページを確認する。`http://localhost:3000` とその配下の対象ページがあればそのページを使用する。
2. 対象ページがない場合は、`http://localhost:3000` を統合ブラウザで開く。
3. `http://localhost:3000` のログイン画面で、利用者が選択して提示したデモユーザー情報、または `config/settings.base.dev.json` の `dbmanager.DemoMode.Users` にあるデモユーザー情報を入力してログインする。
