# メール通知一覧

このファイルは、本システムが配信するメールの種類、想定送信先、既に存在するテンプレート（ある場合）を一覧にまとめた参照表です。

注意: テンプレート名は `pecus.Libs/Mail/Templates` のファイル名（拡張子を除いたプレフィックス）を記載しています。テンプレートがない行は実装やテンプレート作成が必要です。

| No. | 通知（日本語） | 送信先（想定） | 既存テンプレート（拡張子なし） | 備考 |
|-----|----------------|----------------|----------------------------------|------|
| 1 | 組織作成 | 組織の代表者（組織作成者） | organization-created | `Templates/organization-created.html.cshtml`, `.text.cshtml` が存在します |
| 2 | Email 変更確認 | 当該ユーザー | email-change-confirmation | `Templates/email-change-confirmation.html.cshtml`, `.text.cshtml` が存在します |
| 3 | パスワードリセット | 当該ユーザー | password-reset | `Templates/password-reset.html.cshtml`, `.text.cshtml` が存在します |
| 4 | ユーザー登録時のパスワード設定（初回パスワード設定） | 当該ユーザー | password-setup | `Templates/password-setup.html.cshtml`, `.text.cshtml` が存在します |
| 5 | ユーザー登録（歓迎メール） | 当該ユーザー | welcome | `Templates/welcome.html.cshtml`, `.text.cshtml` が存在します（WelcomeEmailModel） |
| 6 | ワークスペースへの加入通知 | 当該ユーザー | workspace-joined | `Templates/workspace-joined.html.cshtml`, `.text.cshtml` を追加済み（WorkspaceJoinedEmailModel） |
| 7 | 疑わしい端末からのログイン通知 | 当該ユーザー | security-notification | `Templates/security-notification.html.cshtml`, `.text.cshtml` が存在します（SecurityNotificationEmailModel） |
| 8 | ヘルプコメント（ヘルプ要求） | 組織管理者 / ワークスペースユーザー（設定による） | help-comment | `Templates/help-comment.html.cshtml`, `.text.cshtml` を追加（HelpCommentEmailModel） |
| 9 | 督促コメント（リマインダー） | 担当者（タスク担当者等） | reminder-comment | `Templates/reminder-comment.html.cshtml`, `.text.cshtml` を追加（ReminderCommentEmailModel） |
| 10 | アイテム作成（公開時） | ワークスペースのユーザー（ウォッチャー等） | item-created | プレーンテキスト/HTML本文を埋め込み済み |
| 11 | アイテム更新（公開時） | ワークスペースのユーザー | （テンプレートなし） | 更新種別（件名変更/担当者変更等）を本文で分ける設計を推奨 |
| 12 | タスク作成通知 | タスク担当者・担当者・コミッタ・オーナー | task-created | `Templates/task-created.html.cshtml`, `.text.cshtml` を追加（TaskCreatedEmailModel） |
| 13 | タスク完了通知 | 担当者・コミッタ・オーナー | task-completed | `Templates/task-completed.html.cshtml`, `.text.cshtml` を追加（TaskCompletedEmailModel） |
| 14 | ワークスペース作成通知 | 組織ユーザー | workspace-created | `Templates/workspace-created.html.cshtml`, `.text.cshtml` を追加（WorkspaceCreatedEmailModel） |
| 15 | ワークスペース更新通知 | 組織ユーザー | workspace-updated | `Templates/workspace-updated.html.cshtml`, `.text.cshtml` を追加（WorkspaceUpdatedEmailModel） |
| 16 | ワークスペース削除通知 | 組織ユーザー | workspace-deleted | `Templates/workspace-deleted.html.cshtml`, `.text.cshtml` を追加（WorkspaceDeletedEmailModel） |

## テンプレート管理・追加時の注意

- 既存テンプレートは `pecus.Libs/Mail/Templates` に配置されています。新しいテンプレートを追加する場合は、HTML 版（`.html.cshtml`）とプレーンテキスト版（`.text.cshtml`）の両方を用意することを推奨します。
- テンプレートのモデルは `Pecus.Libs.Mail.Templates.Models` 配下に追加してください。テンプレート側で利用するプロパティは明確に定義しましょう。
- テンプレートファイルは実行環境の <AppContext.BaseDirectory>/<TemplateRootPath> に置かれる必要があります。`EmailSettings.TemplateRootPath` (デフォルト `Mail/Templates`) を確認してください。

## 次のアクション候補

- 上表の「（テンプレートなし）」にある通知について、優先度の高いもの（例: ワークスペース加入、アイテム作成、タスク関連）を選定してテンプレート設計を行う
- 既存テンプレートの内容確認と、ローカライズ（日本語/多言語）方針を決定する
- Hangfire を使った再試行フローや配信レート制御（バルク配信）をドキュメント化する

---

このファイルを `docs/mail.md` の補助ファイルとして参照するようにしてあります。追加・修正したい通知の行があれば教えてください。