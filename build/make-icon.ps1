# make-icon.ps1 v1.0.0
# Syncthing for UGOS Pro — 生成应用图标
#
# 功能: 用 System.Drawing 生成 512x512 圆角蓝底 + 白色同步环 PNG
# 输出: ../assets/icon.png
#
# 规范: docs/specs/01-project-structure.md (rootfs_common/icon.png)
# 用法: powershell -ExecutionPolicy Bypass -File build/make-icon.ps1

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir '..')
$outDir = Join-Path $projectRoot 'assets'
$outPath = Join-Path $outDir 'icon.png'

$size = 512

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::Transparent)

# 圆角矩形路径
function New-RoundedRectPath {
    param([System.Drawing.Rectangle]$rect, [int]$radius)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $x = [int]$rect.X
    $y = [int]$rect.Y
    $w = [int]$rect.Width
    $h = [int]$rect.Height
    $d = [int]$radius * 2
    $x_wd = $x + $w - $d
    $y_hd = $y + $h - $d
    $path.AddArc((New-Object System.Drawing.Rectangle($x, $y, $d, $d)), 180, 90)
    $path.AddArc((New-Object System.Drawing.Rectangle($x_wd, $y, $d, $d)), 270, 90)
    $path.AddArc((New-Object System.Drawing.Rectangle($x_wd, $y_hd, $d, $d)), 0, 90)
    $path.AddArc((New-Object System.Drawing.Rectangle($x, $y_hd, $d, $d)), 90, 90)
    $path.CloseFigure()
    return $path
}

# 圆角蓝底
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 118, 214)) # Syncthing blue
$r = 110  # 圆角半径
$rect = New-Object System.Drawing.Rectangle(24, 24, ([int]$size - 48), ([int]$size - 48))
$bgPath = New-RoundedRectPath $rect $r
$g.FillPath($bgBrush, $bgPath)

# 白色同步环 (两个半圆弧 + 箭头)
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 26)
$pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$ring = New-Object System.Drawing.Rectangle(150, 150, 212, 212)

# 上弧 (从左到右)
$g.DrawArc($pen, $ring, 200, 140)
# 下弧 (从右到左)
$g.DrawArc($pen, $ring, 20, 140)

# 箭头 (两个三角形)
$arrowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
# 右侧箭头
$g.FillPolygon($arrowBrush, @(
    (New-Object System.Drawing.Point(360, 150)),
    (New-Object System.Drawing.Point(390, 195)),
    (New-Object System.Drawing.Point(330, 195))
))
# 左侧箭头
$g.FillPolygon($arrowBrush, @(
    (New-Object System.Drawing.Point(152, 362)),
    (New-Object System.Drawing.Point(122, 317)),
    (New-Object System.Drawing.Point(182, 317))
))

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

Write-Host "[make-icon] 已生成: $outPath ($size x $size)"
