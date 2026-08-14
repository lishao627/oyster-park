# ============================================================
#  Oyster Park 一键备份脚本
#  备份内容：SQLite 数据库 (dream_travel.db) + 上传图片 (uploads)
#  用法：双击 backup.bat，或在 PowerShell 中执行 .\backup.ps1
# ============================================================

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbFile      = Join-Path $projectRoot 'backend\dream_travel.db'
$uploadDir   = Join-Path $projectRoot 'backend\uploads'
$backupRoot  = Join-Path $projectRoot 'backups'
$stamp       = Get-Date -Format 'yyyyMMdd_HHmmss'
$target      = Join-Path $backupRoot $stamp

# ---------- 1. 统计源数据 ----------
$srcUploadCount = 0
$srcUploadSize  = 0
if (Test-Path -LiteralPath $uploadDir) {
  $srcUploadFiles = @(Get-ChildItem -LiteralPath $uploadDir -Recurse -File -ErrorAction SilentlyContinue)
  $srcUploadCount = $srcUploadFiles.Count
  $srcUploadSize  = ($srcUploadFiles | Measure-Object -Property Length -Sum).Sum
}

$dbExists = Test-Path -LiteralPath $dbFile
if (-not $dbExists -and $srcUploadCount -eq 0) {
  Write-Host '没有找到数据库或上传图片，无需备份。' -ForegroundColor Yellow
  exit 0
}

# ---------- 2. 创建备份目录 ----------
New-Item -ItemType Directory -Path $target -Force | Out-Null

# ---------- 3. 备份数据库（连同 WAL/SHM，保证一致性） ----------
$copiedCount = 0
$copiedSize  = 0
$dbFiles = @($dbFile)
if (Test-Path -LiteralPath ($dbFile + '-wal')) { $dbFiles += $dbFile + '-wal' }
if (Test-Path -LiteralPath ($dbFile + '-shm')) { $dbFiles += $dbFile + '-shm' }

foreach ($f in $dbFiles) {
  if (Test-Path -LiteralPath $f) {
    Copy-Item -LiteralPath $f -Destination $target -Force
    $copiedCount++
    $copiedSize += (Get-Item -LiteralPath $f).Length
  }
}

# ---------- 4. 备份上传图片 ----------
$backupUploadCount = 0
if (Test-Path -LiteralPath $uploadDir) {
  Copy-Item -LiteralPath $uploadDir -Destination (Join-Path $target 'uploads') -Recurse -Force
  $backupUploadFiles = @(Get-ChildItem -LiteralPath (Join-Path $target 'uploads') -Recurse -File)
  $backupUploadCount = $backupUploadFiles.Count
  $copiedCount += $backupUploadCount
  $copiedSize  += ($backupUploadFiles | Measure-Object -Property Length -Sum).Sum
}

# ---------- 5. 完整性校验 ----------
$ok = $true
if ($dbExists) {
  $srcDbSize = (Get-Item -LiteralPath $dbFile).Length
  $bakDbSize = (Get-Item -LiteralPath (Join-Path $target 'dream_travel.db')).Length
  if ($srcDbSize -ne $bakDbSize) { $ok = $false }
}
if ($backupUploadCount -ne $srcUploadCount) { $ok = $false }

# ---------- 6. 汇总 ----------
Write-Host ''
Write-Host '=============== 备份完成 ===============' -ForegroundColor Cyan
if ($dbExists) { Write-Host '数据库：已备份' } else { Write-Host '数据库：未找到（跳过）' }
Write-Host ('上传图片：源 {0} 个文件 / 备份 {1} 个文件' -f $srcUploadCount, $backupUploadCount)
Write-Host ('总大小：{0:N2} MB' -f ($copiedSize / 1MB))
Write-Host ('保存位置：{0}' -f $target)
if ($ok) {
  Write-Host '校验：一致，可以放心。' -ForegroundColor Green
} else {
  Write-Host '校验：不一致，请检查源文件！' -ForegroundColor Red
}
Write-Host '========================================='
