```
// シンプルな送信
BackgroundJob.Enqueue<EmailTasks>(x =>
    x.SendTemplatedEmailAsync(
        "user@example.com",
        "ようこそ!",
        "welcome",
        new WelcomeEmailModel {
            UserName = "田中太郎",
            Email = "user@example.com",
            OrganizationName = "サンプル株式会社",
            LoginUrl = "https://app.example.com/login"
        }
    )
);
```