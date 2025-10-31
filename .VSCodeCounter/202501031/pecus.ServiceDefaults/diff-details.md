# Diff Details

Date : 2025-10-31 18:20:01

Directory d:\\github\\pecus-aspire\\pecus.ServiceDefaults

Total : 45 files,  -1899 codes, -1113 comments, -561 blanks, all -3573 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [pecus.Libs/DB/ApplicationDbContext.cs](/pecus.Libs/DB/ApplicationDbContext.cs) | C# | -341 | -103 | -73 | -517 |
| [pecus.Libs/DB/Models/Genre.cs](/pecus.Libs/DB/Models/Genre.cs) | C# | -15 | -36 | -12 | -63 |
| [pecus.Libs/DB/Models/Organization.cs](/pecus.Libs/DB/Models/Organization.cs) | C# | -20 | -51 | -17 | -88 |
| [pecus.Libs/DB/Models/Permission.cs](/pecus.Libs/DB/Models/Permission.cs) | C# | -13 | -30 | -10 | -53 |
| [pecus.Libs/DB/Models/Role.cs](/pecus.Libs/DB/Models/Role.cs) | C# | -13 | -30 | -10 | -53 |
| [pecus.Libs/DB/Models/Skill.cs](/pecus.Libs/DB/Models/Skill.cs) | C# | -17 | -42 | -14 | -73 |
| [pecus.Libs/DB/Models/Tag.cs](/pecus.Libs/DB/Models/Tag.cs) | C# | -14 | -31 | -10 | -55 |
| [pecus.Libs/DB/Models/User.cs](/pecus.Libs/DB/Models/User.cs) | C# | -26 | -66 | -22 | -114 |
| [pecus.Libs/DB/Models/UserSkill.cs](/pecus.Libs/DB/Models/UserSkill.cs) | C# | -11 | -25 | -8 | -44 |
| [pecus.Libs/DB/Models/Workspace.cs](/pecus.Libs/DB/Models/Workspace.cs) | C# | -19 | -48 | -16 | -83 |
| [pecus.Libs/DB/Models/WorkspaceItem.cs](/pecus.Libs/DB/Models/WorkspaceItem.cs) | C# | -34 | -79 | -26 | -139 |
| [pecus.Libs/DB/Models/WorkspaceItemAttachment.cs](/pecus.Libs/DB/Models/WorkspaceItemAttachment.cs) | C# | -17 | -43 | -14 | -74 |
| [pecus.Libs/DB/Models/WorkspaceItemPin.cs](/pecus.Libs/DB/Models/WorkspaceItemPin.cs) | C# | -16 | -19 | -7 | -42 |
| [pecus.Libs/DB/Models/WorkspaceItemRelation.cs](/pecus.Libs/DB/Models/WorkspaceItemRelation.cs) | C# | -31 | -41 | -12 | -84 |
| [pecus.Libs/DB/Models/WorkspaceItemTag.cs](/pecus.Libs/DB/Models/WorkspaceItemTag.cs) | C# | -11 | -25 | -8 | -44 |
| [pecus.Libs/DB/Models/WorkspaceUser.cs](/pecus.Libs/DB/Models/WorkspaceUser.cs) | C# | -12 | -27 | -9 | -48 |
| [pecus.Libs/DB/Seed/DatabaseSeeder.cs](/pecus.Libs/DB/Seed/DatabaseSeeder.cs) | C# | -504 | -67 | -86 | -657 |
| [pecus.Libs/Hangfire/Tasks/EmailTasks.cs](/pecus.Libs/Hangfire/Tasks/EmailTasks.cs) | C# | -105 | -40 | -23 | -168 |
| [pecus.Libs/Hangfire/Tasks/HangfireTasks.cs](/pecus.Libs/Hangfire/Tasks/HangfireTasks.cs) | C# | -110 | -44 | -25 | -179 |
| [pecus.Libs/Hangfire/Tasks/ImageTasks.cs](/pecus.Libs/Hangfire/Tasks/ImageTasks.cs) | C# | -127 | -28 | -17 | -172 |
| [pecus.Libs/Image/ThumbnailHelper.cs](/pecus.Libs/Image/ThumbnailHelper.cs) | C# | -29 | -14 | -6 | -49 |
| [pecus.Libs/Mail/Configuration/EmailSettings.cs](/pecus.Libs/Mail/Configuration/EmailSettings.cs) | C# | -12 | -27 | -9 | -48 |
| [pecus.Libs/Mail/Models/EmailAttachment.cs](/pecus.Libs/Mail/Models/EmailAttachment.cs) | C# | -18 | -21 | -6 | -45 |
| [pecus.Libs/Mail/Models/EmailMessage.cs](/pecus.Libs/Mail/Models/EmailMessage.cs) | C# | -16 | -39 | -13 | -68 |
| [pecus.Libs/Mail/Services/EmailService.cs](/pecus.Libs/Mail/Services/EmailService.cs) | C# | -174 | -37 | -32 | -243 |
| [pecus.Libs/Mail/Services/IEmailService.cs](/pecus.Libs/Mail/Services/IEmailService.cs) | C# | -19 | -25 | -5 | -49 |
| [pecus.Libs/Mail/Services/ITemplateService.cs](/pecus.Libs/Mail/Services/ITemplateService.cs) | C# | -5 | -10 | -2 | -17 |
| [pecus.Libs/Mail/Services/RazorTemplateService.cs](/pecus.Libs/Mail/Services/RazorTemplateService.cs) | C# | -41 | -12 | -11 | -64 |
| [pecus.Libs/Mail/Templates/Models/PasswordResetEmailModel.cs](/pecus.Libs/Mail/Templates/Models/PasswordResetEmailModel.cs) | C# | -9 | -18 | -5 | -32 |
| [pecus.Libs/Mail/Templates/Models/PasswordSetupEmailModel.cs](/pecus.Libs/Mail/Templates/Models/PasswordSetupEmailModel.cs) | C# | -10 | -21 | -6 | -37 |
| [pecus.Libs/Mail/Templates/Models/WelcomeEmailModel.cs](/pecus.Libs/Mail/Templates/Models/WelcomeEmailModel.cs) | C# | -10 | -21 | -7 | -38 |
| [pecus.Libs/Mail/Templates/\_Layout.html.cshtml](/pecus.Libs/Mail/Templates/_Layout.html.cshtml) | ASP.NET Razor | -40 | -4 | -1 | -45 |
| [pecus.Libs/Mail/Templates/password-reset.html.cshtml](/pecus.Libs/Mail/Templates/password-reset.html.cshtml) | ASP.NET Razor | -12 | 0 | -7 | -19 |
| [pecus.Libs/Mail/Templates/password-reset.text.cshtml](/pecus.Libs/Mail/Templates/password-reset.text.cshtml) | ASP.NET Razor | -9 | 0 | -7 | -16 |
| [pecus.Libs/Mail/Templates/password-setup.html.cshtml](/pecus.Libs/Mail/Templates/password-setup.html.cshtml) | ASP.NET Razor | -21 | 0 | -8 | -29 |
| [pecus.Libs/Mail/Templates/password-setup.text.cshtml](/pecus.Libs/Mail/Templates/password-setup.text.cshtml) | ASP.NET Razor | -12 | 0 | -7 | -19 |
| [pecus.Libs/Mail/Templates/test-email.html.cshtml](/pecus.Libs/Mail/Templates/test-email.html.cshtml) | ASP.NET Razor | -10 | 0 | -7 | -17 |
| [pecus.Libs/Mail/Templates/test-email.text.cshtml](/pecus.Libs/Mail/Templates/test-email.text.cshtml) | ASP.NET Razor | -10 | 0 | -7 | -17 |
| [pecus.Libs/Mail/Templates/welcome.html.cshtml](/pecus.Libs/Mail/Templates/welcome.html.cshtml) | ASP.NET Razor | -23 | 0 | -10 | -33 |
| [pecus.Libs/Mail/Templates/welcome.text.cshtml](/pecus.Libs/Mail/Templates/welcome.text.cshtml) | ASP.NET Razor | -16 | 0 | -8 | -24 |
| [pecus.Libs/Security/PasswordHasher.cs](/pecus.Libs/Security/PasswordHasher.cs) | C# | -17 | -9 | -4 | -30 |
| [pecus.Libs/SerilogHelper.cs](/pecus.Libs/SerilogHelper.cs) | C# | -27 | -7 | -3 | -37 |
| [pecus.Libs/pecus.Libs.csproj](/pecus.Libs/pecus.Libs.csproj) | XML | -23 | 0 | -3 | -26 |
| [pecus.ServiceDefaults/Extensions.cs](/pecus.ServiceDefaults/Extensions.cs) | C# | 97 | 27 | 26 | 150 |
| [pecus.ServiceDefaults/pecus.ServiceDefaults.csproj](/pecus.ServiceDefaults/pecus.ServiceDefaults.csproj) | XML | 23 | 0 | 6 | 29 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details