Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $root "docs\assets"
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

function New-RoundedPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()

  return $path
}

function Draw-CardImage {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$ImagePath,
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [System.Drawing.Color]$ShadowColor
  )

  $shadowBrush = New-Object System.Drawing.SolidBrush $ShadowColor
  $shadowPath = New-RoundedPath ($X + 10) ($Y + 12) $Width $Height 28
  $Graphics.FillPath($shadowBrush, $shadowPath)

  $image = [System.Drawing.Image]::FromFile($ImagePath)
  $clipPath = New-RoundedPath $X $Y $Width $Height 28
  $state = $Graphics.Save()
  $Graphics.SetClip($clipPath)
  $Graphics.DrawImage($image, $X, $Y, $Width, $Height)
  $Graphics.Restore($state)

  $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(215, 230, 225)), 2
  $Graphics.DrawPath($borderPen, $clipPath)

  $borderPen.Dispose()
  $clipPath.Dispose()
  $image.Dispose()
  $shadowPath.Dispose()
  $shadowBrush.Dispose()
}

$width = 1600
$height = 900
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Rectangle 0, 0, $width, $height),
  [System.Drawing.Color]::FromArgb(246, 241, 234),
  [System.Drawing.Color]::FromArgb(250, 247, 241),
  25
)
$graphics.FillRectangle($backgroundBrush, 0, 0, $width, $height)

$orbBrush1 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(60, 31, 104, 82))
$orbBrush2 = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(48, 138, 61, 36))
$graphics.FillEllipse($orbBrush1, -140, 520, 520, 420)
$graphics.FillEllipse($orbBrush2, 1080, -80, 440, 360)

$panelPath = New-RoundedPath 72 66 1456 768 42
$panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(222, 255, 252, 247))
$panelPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(224, 208, 197)), 2
$graphics.FillPath($panelBrush, $panelPath)
$graphics.DrawPath($panelPen, $panelPath)

$eyebrowFont = New-Object System.Drawing.Font("Segoe UI Semibold", 18)
$titleFont = New-Object System.Drawing.Font("Trebuchet MS", 34, [System.Drawing.FontStyle]::Bold)
$bodyFont = New-Object System.Drawing.Font("Segoe UI", 18)
$chipFont = New-Object System.Drawing.Font("Segoe UI Semibold", 16)

$accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(138, 61, 36))
$forestBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(31, 104, 82))
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 21, 15))
$mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(111, 86, 74))

$graphics.DrawString("VISCERA OCR TOOLKIT", $eyebrowFont, $accentBrush, 132, 126)
$graphics.DrawString("OCR that starts as text", $titleFont, $textBrush, 128, 168)
$graphics.DrawString("extraction", $titleFont, $textBrush, 128, 228)
$graphics.DrawString("and ends as structured JSON.", $titleFont, $textBrush, 128, 288)
$graphics.DrawString(
  "Built on top of tesseract.js with preset parsing, offline-friendly fixtures, and docs that are actually pleasant to browse.",
  $bodyFont,
  $mutedBrush,
  (New-Object System.Drawing.RectangleF 132, 412, 590, 120)
)

$chipBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(240, 248, 245))
$chipPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(196, 219, 210)), 2
$chips = @(
  @{ Text = "npm package"; X = 132; Y = 560; W = 164 },
  @{ Text = "docs included"; X = 314; Y = 560; W = 176 },
  @{ Text = "fixture-tested"; X = 510; Y = 560; W = 180 }
)

foreach ($chip in $chips) {
  $chipPath = New-RoundedPath $chip.X $chip.Y $chip.W 48 22
  $graphics.FillPath($chipBrush, $chipPath)
  $graphics.DrawPath($chipPen, $chipPath)
  $graphics.DrawString($chip.Text, $chipFont, $forestBrush, $chip.X + 18, $chip.Y + 11)
  $chipPath.Dispose()
}

$codeBlockPath = New-RoundedPath 128 650 520 178 26
$codeBlockBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(248, 250, 252))
$codeBlockPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(221, 228, 233)), 2
$codeFont = New-Object System.Drawing.Font("Consolas", 18)
$graphics.FillPath($codeBlockBrush, $codeBlockPath)
$graphics.DrawPath($codeBlockPen, $codeBlockPath)
$graphics.DrawString("const { extractText } = require(""viscera"");", $codeFont, $textBrush, 152, 684)
$graphics.DrawString("await extractText(""./receipt.png"", {", $codeFont, $textBrush, 152, 722)
$graphics.DrawString("  preset: ""mobile_receipt"",", $codeFont, $forestBrush, 152, 760)
$graphics.DrawString("});", $codeFont, $textBrush, 152, 798)

$fixtureRoot = Join-Path $assetsDir "fixtures"
Draw-CardImage $graphics (Join-Path $fixtureRoot "mobile-receipt.png") 858 146 540 220 ([System.Drawing.Color]::FromArgb(44, 31, 104, 82))
Draw-CardImage $graphics (Join-Path $fixtureRoot "invoice.png") 782 400 356 238 ([System.Drawing.Color]::FromArgb(36, 138, 61, 36))
Draw-CardImage $graphics (Join-Path $fixtureRoot "bank-receipt.png") 1152 430 290 194 ([System.Drawing.Color]::FromArgb(36, 31, 56, 104))

$savePath = Join-Path $assetsDir "viscera-readme-banner.png"
$bitmap.Save($savePath, [System.Drawing.Imaging.ImageFormat]::Png)

$codeFont.Dispose()
$codeBlockBrush.Dispose()
$codeBlockPen.Dispose()
$chipBrush.Dispose()
$chipPen.Dispose()
$accentBrush.Dispose()
$forestBrush.Dispose()
$textBrush.Dispose()
$mutedBrush.Dispose()
$eyebrowFont.Dispose()
$titleFont.Dispose()
$bodyFont.Dispose()
$chipFont.Dispose()
$panelBrush.Dispose()
$panelPen.Dispose()
$panelPath.Dispose()
$orbBrush1.Dispose()
$orbBrush2.Dispose()
$backgroundBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Generated $savePath"
