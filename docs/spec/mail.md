# メール配信（pecus.Libs/Mail）

このドキュメントは、プロジェクトで利用しているメール送信基盤（`pecus.Libs/Mail`）の実装、設定、テンプレート運用、利用方法、注意点をまとめます。

## 概要

- 送信実装: MailKit (SmtpClient) + MimeKit
- テンプレートレンダリング: RazorLight（Razorテンプレート、`.cshtml`）
- 設定: `EmailSettings`（DI で `IOptions<EmailSettings>` 経由で注入）
- DI 登録: `pecus.WebApi/AppHost.cs` で `ITemplateService`, `IEmailService` を登録

この実装は、シンプルに SMTP 経由でメールを送信し、Razor テンプレートで HTML / テキスト本文を生成することを目的としています。

## 主要コンポーネント

- `Pecus.Libs.Mail.Configuration.EmailSettings`
  - SMTP ホスト / ポート / 認証情報 / 送信元メールアドレス / テンプレートルートパス等を保持します。
  - 既定値: `SmtpPort = 587`, `UseSsl = true`, `TemplateRootPath = "Mail/Templates"`

- `Pecus.Libs.Mail.Services.EmailService` (`IEmailService` 実装)
  - MailKit を使って SMTP サーバーに接続しメールを送信します。
  - テンプレートを使った送信（`SendTemplatedEmailAsync`）と直接送信（`SendAsync`）を提供します。
  - 重要な挙動:
    - テンプレートは HTML と text を個別にレンダリングし、両方がなければ例外を投げます。
    - SMTP 認証は `EmailSettings.Username` が空でない場合にのみ行います。
    - 送信失敗時は例外を再スローします（上位でのリトライ/再送制御は呼び出し側で行う）。

- `Pecus.Libs.Mail.Services.RazorTemplateService` (`ITemplateService` 実装)
  - RazorLight を初期化してファイルシステムからテンプレートを読み込み、モデルをバインドして文字列を返します。
  - テンプレートルートは `AppContext.BaseDirectory` と `EmailSettings.TemplateRootPath` を結合したパスを使用します。

- `Pecus.Libs.Mail.Models.EmailMessage` / `EmailAttachment`
  - 宛先、Cc/Bcc、From、ReplyTo、件名、HtmlBody/TextBody、添付ファイル、カスタムヘッダ、優先度などを表現します。

## 設定（appsettings.json）

アプリケーション側の設定例（`pecus.WebApi` の appsettings.*.json に設定します）。機密情報はシークレットマネージャ / 環境変数を利用してください。

```json
"Email": {
  "SmtpHost": "smtp.example.com",
  "SmtpPort": 587,
  "UseSsl": true,
  "Username": "smtp-user",
  "Password": "*****",
  "FromEmail": "noreply@example.com",
  "FromName": "Coati",
  "TemplateRootPath": "Mail/Templates"
}
```

- 注意: `Password` をコード/リポジトリに平文で置かないこと。CI・環境変数・シークレットストアを使用してください。

## DI 登録（既存実装）

`pecus.WebApi/AppHost.cs` では次のように登録されています（参照用）:

```csharp
// EmailSettings 設定をバインド
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));

// テンプレート + メールサービス登録
builder.Services.AddScoped<ITemplateService, RazorTemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();
```

これにより、アプリケーション内で `IEmailService` を注入して利用できます。

## テンプレート配置と命名規約

- 既定のテンプレートルート: <AppContext.BaseDirectory> + `EmailSettings.TemplateRootPath`（デフォルトは `Mail/Templates`）
- テンプレートファイルは Razor (`.cshtml`) を使います。
- 各テンプレートは HTML 版とテキスト（プレーン）版を分けて用意できます。
  - HTML: `{templateName}.html.cshtml`
  - Text: `{templateName}.text.cshtml`
- レイアウト: `_Layout.html.cshtml` などで共通レイアウトを利用できます（RazorLight の FileSystemProject を使うため通常の Razor ルールに従います）。

既存テンプレートの例（`pecus.Libs/Mail/Templates/`）:
- `welcome.html.cshtml`, `welcome.text.cshtml`
- `password-reset.html.cshtml`, `password-reset.text.cshtml`
- `security-notification.html.cshtml`, `security-notification.text.cshtml`
- `organization-created.*.cshtml`, `email-change-confirmation.*.cshtml`, `password-setup.*.cshtml` など

テンプレートで使われるモデルは `Templates/Models` に定義されています（例: `WelcomeEmailModel`, `PasswordResetEmailModel` など）。

## 優先度・ヘッダ・添付の扱い

- 優先度: `EmailMessage.Priority` は 1=高, 3=通常, 5=低（`MimeMessage.Priority` にマッピングされます）
- カスタムヘッダ: `EmailMessage.CustomHeaders` にキー/バリューで追加可能（そのまま MIME ヘッダに追加されます）
- 添付: `EmailAttachment` でファイル名・内容(bytes)・MIME タイプを指定して添付します

## 例: サービスからの利用例

シンプルなテンプレートメール送信例（依存性注入された `IEmailService` を使う）:

```csharp
public class AccountService
{
    private readonly IEmailService _emailService;

    public AccountService(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task SendWelcomeEmailAsync(string to, string userName)
    {
        var model = new WelcomeEmailModel { UserName = userName };
        await _emailService.SendTemplatedEmailAsync(to, "Welcome to Coati", "welcome", model);
    }
}
```

複数宛先や添付を使う詳細例:

```csharp
var message = new EmailMessage
{
    To = new List<string> { "alice@example.com", "bob@example.com" },
    Subject = "Monthly report",
    Attachments = new List<EmailAttachment>
    {
        new EmailAttachment("report.pdf", fileBytes, "application/pdf")
    }
};

await emailService.SendTemplatedEmailAsync(message, "monthly-report", new { Month = "2025-12" });
```

または直接 MIME 作成済みテキスト/HTML を渡して送信:

```csharp
var raw = new EmailMessage
{
    To = new List<string> { "user@example.com" },
    Subject = "Plain message",
    TextBody = "こんにちは\n..."
};
await emailService.SendAsync(raw);
```

## エラーハンドリングとログ

- `EmailService.SendAsync` は送信失敗時に例外を再スローします。呼び出し側でのリトライ、入出力保留、あるいは Hangfire による再試行を利用してください（プロジェクトでは `pecus.Libs.Hangfire.Tasks.EmailTasks` が存在します）。

- テンプレートレンダリング時:
  - HTML / Text の各テンプレートごとに個別にレンダリングを試み、失敗した場合は警告ログを出します（片方だけが存在するケースを許容）。
  - 両方ともレンダリングできない場合は `InvalidOperationException` を投げます。

- ログ: `EmailService` / `RazorTemplateService` は ILogger を利用して接続・レンダリング・送信エラー等を記録します。

## セキュリティと運用上の注意

- SMTP パスワードや認証情報は秘密管理を行うこと（環境変数、Vault、Azure Key Vault 等）。
- 大量配信を行う場合は SMTP サーバーの送信制限（スロットリング、バウンス、SPF/DKIM/DMARC）を確認し、必要なら専用の配信サービス（SendGrid, SES, Mailgun 等）を利用してください。
- テンプレートにユーザー入力を埋め込む際は XSS を考慮して必要に応じてエスケープ処理を行ってください（Razor の HTML エンコーディングに依存するため、Raw HTML を埋めるときは慎重に）。

## 開発時のチェックリスト

- [ ] `pecus.WebApi` の appsettings.*.json に `Email` セクションが正しく設定されているか
- [ ] テンプレートファイルは実行環境の <AppContext.BaseDirectory>/<TemplateRootPath> に配置されているか
- [ ] メールの送信テストは本番宛先ではなくステージング/テストアドレスで行うこと
- [ ] 機密情報（SMTP のパスワード等）がコミットされていないこと

## 参考: 関連ファイル一覧

- `pecus.Libs/Mail/Configuration/EmailSettings.cs`
- `pecus.Libs/Mail/Services/EmailService.cs`
- `pecus.Libs/Mail/Services/RazorTemplateService.cs`
- `pecus.Libs/Mail/Services/ITemplateService.cs`
- `pecus.Libs/Mail/Services/IEmailService.cs`
- `pecus.Libs/Mail/Models/EmailMessage.cs`
- `pecus.Libs/Mail/Templates/` （テンプレート群）

---

このドキュメントで不足・改善してほしい点があれば指定してください。テンプレートの追加ルールや実運用（バルク配信戦略、リトライ方針、Bounce 処理など）を追記できます。

## 通知一覧（参照）

各種通知の一覧とテンプレートの対応状況は別ファイルにまとめています: `docs/mail-notifications.md`
（テンプレートの追加や運用方針の議論は上ファイルを編集してください。）