# Details

Date : 2025-10-31 18:19:44

Directory d:\\github\\pecus-aspire\\pecus.DbManager

Total : 31 files,  8632 codes, 73 comments, 3005 blanks, all 11710 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [pecus.DbManager/AppHost.cs](/pecus.DbManager/AppHost.cs) | C# | 40 | 8 | 12 | 60 |
| [pecus.DbManager/DbInitializer.cs](/pecus.DbManager/DbInitializer.cs) | C# | 64 | 3 | 13 | 80 |
| [pecus.DbManager/DbInitializerHealthCheck.cs](/pecus.DbManager/DbInitializerHealthCheck.cs) | C# | 25 | 3 | 4 | 32 |
| [pecus.DbManager/Migrations/20250127000000\_AddPasswordResetTokenAndIsActiveToUser.cs](/pecus.DbManager/Migrations/20250127000000_AddPasswordResetTokenAndIsActiveToUser.cs) | C# | 39 | 3 | 7 | 49 |
| [pecus.DbManager/Migrations/20251025065952\_InitialCreate.Designer.cs](/pecus.DbManager/Migrations/20251025065952_InitialCreate.Designer.cs) | C# | 368 | 2 | 136 | 506 |
| [pecus.DbManager/Migrations/20251025065952\_InitialCreate.cs](/pecus.DbManager/Migrations/20251025065952_InitialCreate.cs) | C# | 319 | 3 | 36 | 358 |
| [pecus.DbManager/Migrations/20251025082729\_RemoveInvitedByUserIdFromWorkspaceUser.Designer.cs](/pecus.DbManager/Migrations/20251025082729_RemoveInvitedByUserIdFromWorkspaceUser.Designer.cs) | C# | 366 | 2 | 135 | 503 |
| [pecus.DbManager/Migrations/20251025082729\_RemoveInvitedByUserIdFromWorkspaceUser.cs](/pecus.DbManager/Migrations/20251025082729_RemoveInvitedByUserIdFromWorkspaceUser.cs) | C# | 22 | 3 | 4 | 29 |
| [pecus.DbManager/Migrations/20251025090329\_AddWorkspaceItem.Designer.cs](/pecus.DbManager/Migrations/20251025090329_AddWorkspaceItem.Designer.cs) | C# | 447 | 2 | 169 | 618 |
| [pecus.DbManager/Migrations/20251025090329\_AddWorkspaceItem.cs](/pecus.DbManager/Migrations/20251025090329_AddWorkspaceItem.cs) | C# | 98 | 3 | 12 | 113 |
| [pecus.DbManager/Migrations/20251025110454\_AddTagAndWorkspaceItemTag.Designer.cs](/pecus.DbManager/Migrations/20251025110454_AddTagAndWorkspaceItemTag.Designer.cs) | C# | 531 | 2 | 201 | 734 |
| [pecus.DbManager/Migrations/20251025110454\_AddTagAndWorkspaceItemTag.cs](/pecus.DbManager/Migrations/20251025110454_AddTagAndWorkspaceItemTag.cs) | C# | 95 | 3 | 10 | 108 |
| [pecus.DbManager/Migrations/20251025122949\_AddWorkspaceItemPin.Designer.cs](/pecus.DbManager/Migrations/20251025122949_AddWorkspaceItemPin.Designer.cs) | C# | 561 | 2 | 214 | 777 |
| [pecus.DbManager/Migrations/20251025122949\_AddWorkspaceItemPin.cs](/pecus.DbManager/Migrations/20251025122949_AddWorkspaceItemPin.cs) | C# | 48 | 3 | 6 | 57 |
| [pecus.DbManager/Migrations/20251025131548\_AddWorkspaceItemAttachment.Designer.cs](/pecus.DbManager/Migrations/20251025131548_AddWorkspaceItemAttachment.Designer.cs) | C# | 619 | 2 | 236 | 857 |
| [pecus.DbManager/Migrations/20251025131548\_AddWorkspaceItemAttachment.cs](/pecus.DbManager/Migrations/20251025131548_AddWorkspaceItemAttachment.cs) | C# | 62 | 3 | 7 | 72 |
| [pecus.DbManager/Migrations/20251026020112\_AddWorkspaceItemRelation.Designer.cs](/pecus.DbManager/Migrations/20251026020112_AddWorkspaceItemRelation.Designer.cs) | C# | 677 | 2 | 258 | 937 |
| [pecus.DbManager/Migrations/20251026020112\_AddWorkspaceItemRelation.cs](/pecus.DbManager/Migrations/20251026020112_AddWorkspaceItemRelation.cs) | C# | 73 | 3 | 9 | 85 |
| [pecus.DbManager/Migrations/20251026074049\_AddSkillAndUserSkill.Designer.cs](/pecus.DbManager/Migrations/20251026074049_AddSkillAndUserSkill.Designer.cs) | C# | 768 | 2 | 296 | 1,066 |
| [pecus.DbManager/Migrations/20251026074049\_AddSkillAndUserSkill.cs](/pecus.DbManager/Migrations/20251026074049_AddSkillAndUserSkill.cs) | C# | 111 | 3 | 12 | 126 |
| [pecus.DbManager/Migrations/20251028034212\_PendingModelChanges.Designer.cs](/pecus.DbManager/Migrations/20251028034212_PendingModelChanges.Designer.cs) | C# | 772 | 2 | 298 | 1,072 |
| [pecus.DbManager/Migrations/20251028034212\_PendingModelChanges.cs](/pecus.DbManager/Migrations/20251028034212_PendingModelChanges.cs) | C# | 68 | 3 | 10 | 81 |
| [pecus.DbManager/Migrations/20251031024919\_AddIsActiveToWorkspaceItem.Designer.cs](/pecus.DbManager/Migrations/20251031024919_AddIsActiveToWorkspaceItem.Designer.cs) | C# | 776 | 2 | 300 | 1,078 |
| [pecus.DbManager/Migrations/20251031024919\_AddIsActiveToWorkspaceItem.cs](/pecus.DbManager/Migrations/20251031024919_AddIsActiveToWorkspaceItem.cs) | C# | 31 | 3 | 6 | 40 |
| [pecus.DbManager/Migrations/20251031044638\_AddIsActiveToSkill.Designer.cs](/pecus.DbManager/Migrations/20251031044638_AddIsActiveToSkill.Designer.cs) | C# | 778 | 2 | 301 | 1,081 |
| [pecus.DbManager/Migrations/20251031044638\_AddIsActiveToSkill.cs](/pecus.DbManager/Migrations/20251031044638_AddIsActiveToSkill.cs) | C# | 23 | 3 | 4 | 30 |
| [pecus.DbManager/Migrations/ApplicationDbContextModelSnapshot.cs](/pecus.DbManager/Migrations/ApplicationDbContextModelSnapshot.cs) | C# | 776 | 1 | 301 | 1,078 |
| [pecus.DbManager/Properties/launchSettings.json](/pecus.DbManager/Properties/launchSettings.json) | JSON | 23 | 0 | 1 | 24 |
| [pecus.DbManager/appsettings.Development.json](/pecus.DbManager/appsettings.Development.json) | JSON | 20 | 0 | 1 | 21 |
| [pecus.DbManager/appsettings.json](/pecus.DbManager/appsettings.json) | JSON | 10 | 0 | 1 | 11 |
| [pecus.DbManager/pecus.DbManager.csproj](/pecus.DbManager/pecus.DbManager.csproj) | XML | 22 | 0 | 5 | 27 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)