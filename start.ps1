# ============================================================
#  Oyster Park 一键启动
#  双击 start.bat 即可：自动启动后端 + 前端，并打开浏览器
#  如果服务已经在运行，则跳过启动、直接打开页面
# ============================================================

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir  = Join-Path $projectRoot 'backend'
$frontendDir = $projectRoot

function Test-PortUp($url) {
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
    return ($r.StatusCode -eq 200)
  } catch {
    return $false
  }
}

function Wait-PortUp($url, $seconds) {
  for ($i = 0; $i -lt $seconds * 2; $i++) {
    if (Test-PortUp $url) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

# ---------- 0. 检查 Node/npm ----------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host '未找到 Node.js，请先安装：https://nodejs.org' -ForegroundColor Red
  exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host '未找到 npm，请检查 Node.js 安装是否完整' -ForegroundColor Red
  exit 1
}

# ---------- 1. 首次运行：安装依赖 ----------
if (-not (Test-Path (Join-Path $backendDir 'node_modules'))) {
  Write-Host '首次运行：正在安装后端依赖（可能需要几分钟）...' -ForegroundColor Yellow
  Push-Location $backendDir
  npm install
  Pop-Location
}
if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
  Write-Host '首次运行：正在安装前端依赖（可能需要几分钟）...' -ForegroundColor Yellow
  Push-Location $frontendDir
  npm install
  Pop-Location
}

$wshell = New-Object -ComObject WScript.Shell

# ---------- 2. 启动后端（新窗口） ----------
if (Test-PortUp 'http://localhost:3001/api/health') {
  Write-Host '后端已在运行，跳过启动。' -ForegroundColor Green
} else {
  Write-Host '正在启动后端 (端口 3001)...'
  $wshell.Run("cmd /k cd /d `"$backendDir`" && npm run dev", 1, $false)
  if (Wait-PortUp 'http://localhost:3001/api/health' 60) {
    Write-Host '后端已就绪。' -ForegroundColor Green
  } else {
    Write-Host '后端启动超时，请查看后端窗口中的报错。' -ForegroundColor Red
  }
}

# ---------- 3. 启动前端（新窗口） ----------
if (Test-PortUp 'http://localhost:5173/') {
  Write-Host '前端已在运行，跳过启动。' -ForegroundColor Green
} else {
  Write-Host '正在启动前端 (端口 5173)...'
  $wshell.Run("cmd /k cd /d `"$frontendDir`" && npm run dev", 1, $false)
  if (Wait-PortUp 'http://localhost:5173/' 90) {
    Write-Host '前端已就绪。' -ForegroundColor Green
  } else {
    Write-Host '前端启动超时，请查看前端窗口中的报错。' -ForegroundColor Red
  }
}

# ---------- 4. 打开浏览器 ----------
if ((Test-PortUp 'http://localhost:5173/') -and (Test-PortUp 'http://localhost:3001/api/health')) {
  Write-Host '正在打开浏览器...'
  try {
    [System.Diagnostics.Process]::Start('http://localhost:5173') | Out-Null
  } catch {
    Write-Host '自动打开浏览器失败，请手动访问 http://localhost:5173' -ForegroundColor Yellow
  }
}

Write-Host ''
Write-Host '============= Oyster Park 已启动 =============' -ForegroundColor Cyan
Write-Host '  后端：http://localhost:3001'
Write-Host '  前端：http://localhost:5173'
Write-Host '  两个黑色窗口保持开着就是运行中，关掉即可停止。'
Write-Host '============================================='
