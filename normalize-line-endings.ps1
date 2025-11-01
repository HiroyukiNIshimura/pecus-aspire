# 改行コード変換スクリプト（除外ディレクトリ対応 + 進行状況表示）
# 使用方法: .\normalize-line-endings.ps1

# 対象ファイルを取得（除外ディレクトリをフィルタ）
$files = Get-ChildItem -Recurse -File -Include *.cs,*.ts,*.tsx,*.js,*.json,*.md,*.yml,*.yaml,*.xml,*.sln,*.csproj,*.config |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\bin\\' -and $_.FullName -notmatch '\\obj\\' -and $_.FullName -notmatch '\\\.next\\' }

$total = $files.Count
$i = 0

Write-Host "改行コード変換を開始します... (対象ファイル数: $total)"

foreach ($file in $files) {
    $i++
    Write-Progress -Activity "改行コードをLFに変換中" -Status "$i / $total : $($file.Name)" -PercentComplete (($i / $total) * 100)

    try {
        $content = Get-Content $file.FullName -Raw
        $content = $content -replace "`r`n", "`n"
        Set-Content $file.FullName $content -NoNewline
    } catch {
        Write-Warning "ファイル処理エラー: $($file.FullName) - $($_.Exception.Message)"
    }
}

Write-Progress -Completed
Write-Host "変換完了: $total ファイルを処理しました。"