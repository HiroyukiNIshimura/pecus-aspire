# Diff Details

Date : 2025-10-31 18:19:56

Directory d:\\github\\pecus-aspire\\pecus.Libs

Total : 74 files,  -6613 codes, 1067 comments, -2412 blanks, all -7958 lines

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [pecus.DbManager/AppHost.cs](/pecus.DbManager/AppHost.cs) | C# | -40 | -8 | -12 | -60 |
| [pecus.DbManager/DbInitializer.cs](/pecus.DbManager/DbInitializer.cs) | C# | -64 | -3 | -13 | -80 |
| [pecus.DbManager/DbInitializerHealthCheck.cs](/pecus.DbManager/DbInitializerHealthCheck.cs) | C# | -25 | -3 | -4 | -32 |
| [pecus.DbManager/Migrations/20250127000000\_AddPasswordResetTokenAndIsActiveToUser.cs](/pecus.DbManager/Migrations/20250127000000_AddPasswordResetTokenAndIsActiveToUser.cs) | C# | -39 | -3 | -7 | -49 |
| [pecus.DbManager/Migrations/20251025065952\_InitialCreate.Designer.cs](/pecus.DbManager/Migrations/20251025065952_InitialCreate.Designer.cs) | C# | -368 | -2 | -136 | -506 |
| [pecus.DbManager/Migrations/20251025065952\_InitialCreate.cs](/pecus.DbManager/Migrations/20251025065952_InitialCreate.cs) | C# | -319 | -3 | -36 | -358 |
| [pecus.DbManager/Migrations/20251025082729\_RemoveInvitedByUserIdFromWorkspaceUser.Designer.cs](/pecus.DbManager/Migrations/20251025082729_RemoveInvitedByUserIdFromWorkspaceUser.Designer.cs) | C# | -366 | -2 | -135 | -503 |
| [pecus.DbManager/Migrations/20251025082729\_RemoveInvitedByUserIdFromWorkspaceUser.cs](/pecus.DbManager/Migrations/20251025082729_RemoveInvitedByUserIdFromWorkspaceUser.cs) | C# | -22 | -3 | -4 | -29 |
| [pecus.DbManager/Migrations/20251025090329\_AddWorkspaceItem.Designer.cs](/pecus.DbManager/Migrations/20251025090329_AddWorkspaceItem.Designer.cs) | C# | -447 | -2 | -169 | -618 |
| [pecus.DbManager/Migrations/20251025090329\_AddWorkspaceItem.cs](/pecus.DbManager/Migrations/20251025090329_AddWorkspaceItem.cs) | C# | -98 | -3 | -12 | -113 |
| [pecus.DbManager/Migrations/20251025110454\_AddTagAndWorkspaceItemTag.Designer.cs](/pecus.DbManager/Migrations/20251025110454_AddTagAndWorkspaceItemTag.Designer.cs) | C# | -531 | -2 | -201 | -734 |
| [pecus.DbManager/Migrations/20251025110454\_AddTagAndWorkspaceItemTag.cs](/pecus.DbManager/Migrations/20251025110454_AddTagAndWorkspaceItemTag.cs) | C# | -95 | -3 | -10 | -108 |
| [pecus.DbManager/Migrations/20251025122949\_AddWorkspaceItemPin.Designer.cs](/pecus.DbManager/Migrations/20251025122949_AddWorkspaceItemPin.Designer.cs) | C# | -561 | -2 | -214 | -777 |
| [pecus.DbManager/Migrations/20251025122949\_AddWorkspaceItemPin.cs](/pecus.DbManager/Migrations/20251025122949_AddWorkspaceItemPin.cs) | C# | -48 | -3 | -6 | -57 |
| [pecus.DbManager/Migrations/20251025131548\_AddWorkspaceItemAttachment.Designer.cs](/pecus.DbManager/Migrations/20251025131548_AddWorkspaceItemAttachment.Designer.cs) | C# | -619 | -2 | -236 | -857 |
| [pecus.DbManager/Migrations/20251025131548\_AddWorkspaceItemAttachment.cs](/pecus.DbManager/Migrations/20251025131548_AddWorkspaceItemAttachment.cs) | C# | -62 | -3 | -7 | -72 |
| [pecus.DbManager/Migrations/20251026020112\_AddWorkspaceItemRelation.Designer.cs](/pecus.DbManager/Migrations/20251026020112_AddWorkspaceItemRelation.Designer.cs) | C# | -677 | -2 | -258 | -937 |
| [pecus.DbManager/Migrations/20251026020112\_AddWorkspaceItemRelation.cs](/pecus.DbManager/Migrations/20251026020112_AddWorkspaceItemRelation.cs) | C# | -73 | -3 | -9 | -85 |
| [pecus.DbManager/Migrations/20251026074049\_AddSkillAndUserSkill.Designer.cs](/pecus.DbManager/Migrations/20251026074049_AddSkillAndUserSkill.Designer.cs) | C# | -768 | -2 | -296 | -1,066 |
| [pecus.DbManager/Migrations/20251026074049\_AddSkillAndUserSkill.cs](/pecus.DbManager/Migrations/20251026074049_AddSkillAndUserSkill.cs) | C# | -111 | -3 | -12 | -126 |
| [pecus.DbManager/Migrations/20251028034212\_PendingModelChanges.Designer.cs](/pecus.DbManager/Migrations/20251028034212_PendingModelChanges.Designer.cs) | C# | -772 | -2 | -298 | -1,072 |
| [pecus.DbManager/Migrations/20251028034212\_PendingModelChanges.cs](/pecus.DbManager/Migrations/20251028034212_PendingModelChanges.cs) | C# | -68 | -3 | -10 | -81 |
| [pecus.DbManager/Migrations/20251031024919\_AddIsActiveToWorkspaceItem.Designer.cs](/pecus.DbManager/Migrations/20251031024919_AddIsActiveToWorkspaceItem.Designer.cs) | C# | -776 | -2 | -300 | -1,078 |
| [pecus.DbManager/Migrations/20251031024919\_AddIsActiveToWorkspaceItem.cs](/pecus.DbManager/Migrations/20251031024919_AddIsActiveToWorkspaceItem.cs) | C# | -31 | -3 | -6 | -40 |
| [pecus.DbManager/Migrations/20251031044638\_AddIsActiveToSkill.Designer.cs](/pecus.DbManager/Migrations/20251031044638_AddIsActiveToSkill.Designer.cs) | C# | -778 | -2 | -301 | -1,081 |
| [pecus.DbManager/Migrations/20251031044638\_AddIsActiveToSkill.cs](/pecus.DbManager/Migrations/20251031044638_AddIsActiveToSkill.cs) | C# | -23 | -3 | -4 | -30 |
| [pecus.DbManager/Migrations/ApplicationDbContextModelSnapshot.cs](/pecus.DbManager/Migrations/ApplicationDbContextModelSnapshot.cs) | C# | -776 | -1 | -301 | -1,078 |
| [pecus.DbManager/Properties/launchSettings.json](/pecus.DbManager/Properties/launchSettings.json) | JSON | -23 | 0 | -1 | -24 |
| [pecus.DbManager/appsettings.Development.json](/pecus.DbManager/appsettings.Development.json) | JSON | -20 | 0 | -1 | -21 |
| [pecus.DbManager/appsettings.json](/pecus.DbManager/appsettings.json) | JSON | -10 | 0 | -1 | -11 |
| [pecus.DbManager/pecus.DbManager.csproj](/pecus.DbManager/pecus.DbManager.csproj) | XML | -22 | 0 | -5 | -27 |
| [pecus.Libs/DB/ApplicationDbContext.cs](/pecus.Libs/DB/ApplicationDbContext.cs) | C# | 341 | 103 | 73 | 517 |
| [pecus.Libs/DB/Models/Genre.cs](/pecus.Libs/DB/Models/Genre.cs) | C# | 15 | 36 | 12 | 63 |
| [pecus.Libs/DB/Models/Organization.cs](/pecus.Libs/DB/Models/Organization.cs) | C# | 20 | 51 | 17 | 88 |
| [pecus.Libs/DB/Models/Permission.cs](/pecus.Libs/DB/Models/Permission.cs) | C# | 13 | 30 | 10 | 53 |
| [pecus.Libs/DB/Models/Role.cs](/pecus.Libs/DB/Models/Role.cs) | C# | 13 | 30 | 10 | 53 |
| [pecus.Libs/DB/Models/Skill.cs](/pecus.Libs/DB/Models/Skill.cs) | C# | 17 | 42 | 14 | 73 |
| [pecus.Libs/DB/Models/Tag.cs](/pecus.Libs/DB/Models/Tag.cs) | C# | 14 | 31 | 10 | 55 |
| [pecus.Libs/DB/Models/User.cs](/pecus.Libs/DB/Models/User.cs) | C# | 26 | 66 | 22 | 114 |
| [pecus.Libs/DB/Models/UserSkill.cs](/pecus.Libs/DB/Models/UserSkill.cs) | C# | 11 | 25 | 8 | 44 |
| [pecus.Libs/DB/Models/Workspace.cs](/pecus.Libs/DB/Models/Workspace.cs) | C# | 19 | 48 | 16 | 83 |
| [pecus.Libs/DB/Models/WorkspaceItem.cs](/pecus.Libs/DB/Models/WorkspaceItem.cs) | C# | 34 | 79 | 26 | 139 |
| [pecus.Libs/DB/Models/WorkspaceItemAttachment.cs](/pecus.Libs/DB/Models/WorkspaceItemAttachment.cs) | C# | 17 | 43 | 14 | 74 |
| [pecus.Libs/DB/Models/WorkspaceItemPin.cs](/pecus.Libs/DB/Models/WorkspaceItemPin.cs) | C# | 16 | 19 | 7 | 42 |
| [pecus.Libs/DB/Models/WorkspaceItemRelation.cs](/pecus.Libs/DB/Models/WorkspaceItemRelation.cs) | C# | 31 | 41 | 12 | 84 |
| [pecus.Libs/DB/Models/WorkspaceItemTag.cs](/pecus.Libs/DB/Models/WorkspaceItemTag.cs) | C# | 11 | 25 | 8 | 44 |
| [pecus.Libs/DB/Models/WorkspaceUser.cs](/pecus.Libs/DB/Models/WorkspaceUser.cs) | C# | 12 | 27 | 9 | 48 |
| [pecus.Libs/DB/Seed/DatabaseSeeder.cs](/pecus.Libs/DB/Seed/DatabaseSeeder.cs) | C# | 504 | 67 | 86 | 657 |
| [pecus.Libs/Hangfire/Tasks/EmailTasks.cs](/pecus.Libs/Hangfire/Tasks/EmailTasks.cs) | C# | 105 | 40 | 23 | 168 |
| [pecus.Libs/Hangfire/Tasks/HangfireTasks.cs](/pecus.Libs/Hangfire/Tasks/HangfireTasks.cs) | C# | 110 | 44 | 25 | 179 |
| [pecus.Libs/Hangfire/Tasks/ImageTasks.cs](/pecus.Libs/Hangfire/Tasks/ImageTasks.cs) | C# | 127 | 28 | 17 | 172 |
| [pecus.Libs/Image/ThumbnailHelper.cs](/pecus.Libs/Image/ThumbnailHelper.cs) | C# | 29 | 14 | 6 | 49 |
| [pecus.Libs/Mail/Configuration/EmailSettings.cs](/pecus.Libs/Mail/Configuration/EmailSettings.cs) | C# | 12 | 27 | 9 | 48 |
| [pecus.Libs/Mail/Models/EmailAttachment.cs](/pecus.Libs/Mail/Models/EmailAttachment.cs) | C# | 18 | 21 | 6 | 45 |
| [pecus.Libs/Mail/Models/EmailMessage.cs](/pecus.Libs/Mail/Models/EmailMessage.cs) | C# | 16 | 39 | 13 | 68 |
| [pecus.Libs/Mail/Services/EmailService.cs](/pecus.Libs/Mail/Services/EmailService.cs) | C# | 174 | 37 | 32 | 243 |
| [pecus.Libs/Mail/Services/IEmailService.cs](/pecus.Libs/Mail/Services/IEmailService.cs) | C# | 19 | 25 | 5 | 49 |
| [pecus.Libs/Mail/Services/ITemplateService.cs](/pecus.Libs/Mail/Services/ITemplateService.cs) | C# | 5 | 10 | 2 | 17 |
| [pecus.Libs/Mail/Services/RazorTemplateService.cs](/pecus.Libs/Mail/Services/RazorTemplateService.cs) | C# | 41 | 12 | 11 | 64 |
| [pecus.Libs/Mail/Templates/Models/PasswordResetEmailModel.cs](/pecus.Libs/Mail/Templates/Models/PasswordResetEmailModel.cs) | C# | 9 | 18 | 5 | 32 |
| [pecus.Libs/Mail/Templates/Models/PasswordSetupEmailModel.cs](/pecus.Libs/Mail/Templates/Models/PasswordSetupEmailModel.cs) | C# | 10 | 21 | 6 | 37 |
| [pecus.Libs/Mail/Templates/Models/WelcomeEmailModel.cs](/pecus.Libs/Mail/Templates/Models/WelcomeEmailModel.cs) | C# | 10 | 21 | 7 | 38 |
| [pecus.Libs/Mail/Templates/\_Layout.html.cshtml](/pecus.Libs/Mail/Templates/_Layout.html.cshtml) | ASP.NET Razor | 40 | 4 | 1 | 45 |
| [pecus.Libs/Mail/Templates/password-reset.html.cshtml](/pecus.Libs/Mail/Templates/password-reset.html.cshtml) | ASP.NET Razor | 12 | 0 | 7 | 19 |
| [pecus.Libs/Mail/Templates/password-reset.text.cshtml](/pecus.Libs/Mail/Templates/password-reset.text.cshtml) | ASP.NET Razor | 9 | 0 | 7 | 16 |
| [pecus.Libs/Mail/Templates/password-setup.html.cshtml](/pecus.Libs/Mail/Templates/password-setup.html.cshtml) | ASP.NET Razor | 21 | 0 | 8 | 29 |
| [pecus.Libs/Mail/Templates/password-setup.text.cshtml](/pecus.Libs/Mail/Templates/password-setup.text.cshtml) | ASP.NET Razor | 12 | 0 | 7 | 19 |
| [pecus.Libs/Mail/Templates/test-email.html.cshtml](/pecus.Libs/Mail/Templates/test-email.html.cshtml) | ASP.NET Razor | 10 | 0 | 7 | 17 |
| [pecus.Libs/Mail/Templates/test-email.text.cshtml](/pecus.Libs/Mail/Templates/test-email.text.cshtml) | ASP.NET Razor | 10 | 0 | 7 | 17 |
| [pecus.Libs/Mail/Templates/welcome.html.cshtml](/pecus.Libs/Mail/Templates/welcome.html.cshtml) | ASP.NET Razor | 23 | 0 | 10 | 33 |
| [pecus.Libs/Mail/Templates/welcome.text.cshtml](/pecus.Libs/Mail/Templates/welcome.text.cshtml) | ASP.NET Razor | 16 | 0 | 8 | 24 |
| [pecus.Libs/Security/PasswordHasher.cs](/pecus.Libs/Security/PasswordHasher.cs) | C# | 17 | 9 | 4 | 30 |
| [pecus.Libs/SerilogHelper.cs](/pecus.Libs/SerilogHelper.cs) | C# | 27 | 7 | 3 | 37 |
| [pecus.Libs/pecus.Libs.csproj](/pecus.Libs/pecus.Libs.csproj) | XML | 23 | 0 | 3 | 26 |

[Summary](results.md) / [Details](details.md) / [Diff Summary](diff.md) / Diff Details