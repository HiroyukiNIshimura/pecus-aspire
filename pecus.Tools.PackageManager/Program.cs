using Pecus.Tools.PackageManager.Commands;
using System.CommandLine;

var rootCommand = new RootCommand("Pecus パッケージマネージャー - NuGet パッケージの依存関係管理ツール");

rootCommand.AddCommand(new CheckCommand());
rootCommand.AddCommand(new UpdateCommand());

return await rootCommand.InvokeAsync(args);
