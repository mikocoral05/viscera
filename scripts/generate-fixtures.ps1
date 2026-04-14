Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $root 'docs\assets\fixtures'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function New-Canvas($width, $height, $background) {
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bmp)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $graphics.Clear($background)

  return @($bmp, $graphics)
}

function Save-Canvas($bitmap, $graphics, $path) {
  $graphics.Dispose()
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Draw-Header($graphics, $title, $subtitle, $width, $palette) {
  $headerBrush = New-Object System.Drawing.SolidBrush $palette.Header
  $textBrush = New-Object System.Drawing.SolidBrush $palette.HeaderText
  $subBrush = New-Object System.Drawing.SolidBrush $palette.Subtle
  $headlineFont = New-Object System.Drawing.Font('Segoe UI Semibold', 30)
  $subFont = New-Object System.Drawing.Font('Segoe UI', 13)

  $graphics.FillRectangle($headerBrush, 0, 0, $width, 110)
  $graphics.DrawString($title, $headlineFont, $textBrush, 34, 22)
  $graphics.DrawString($subtitle, $subFont, $subBrush, 36, 66)

  $headlineFont.Dispose()
  $subFont.Dispose()
  $headerBrush.Dispose()
  $textBrush.Dispose()
  $subBrush.Dispose()
}

function Draw-BodyLines($graphics, $lines, $palette, $startY) {
  $labelFont = New-Object System.Drawing.Font('Consolas', 22)
  $textBrush = New-Object System.Drawing.SolidBrush $palette.Text
  $mutedBrush = New-Object System.Drawing.SolidBrush $palette.Muted
  $dividerPen = New-Object System.Drawing.Pen $palette.Rule, 2

  $y = $startY
  foreach ($line in $lines) {
    if ($line -eq '__divider__') {
      $graphics.DrawLine($dividerPen, 34, $y + 10, 1260, $y + 10)
      $y += 28
      continue
    }

    if ($line.StartsWith('# ')) {
      $graphics.DrawString($line.Substring(2), $labelFont, $mutedBrush, 36, $y)
      $y += 44
      continue
    }

    $graphics.DrawString($line, $labelFont, $textBrush, 36, $y)
    $y += 42
  }

  $labelFont.Dispose()
  $textBrush.Dispose()
  $mutedBrush.Dispose()
  $dividerPen.Dispose()
}

function Draw-Stamp($graphics, $text, $palette, $x, $y) {
  $pen = New-Object System.Drawing.Pen $palette.Accent, 3
  $brush = New-Object System.Drawing.SolidBrush $palette.Accent
  $font = New-Object System.Drawing.Font('Segoe UI Semibold', 14)
  $rect = New-Object System.Drawing.RectangleF($x, $y, 180, 34)
  $graphics.DrawRectangle($pen, $rect.X, $rect.Y, $rect.Width, $rect.Height)
  $graphics.DrawString($text, $font, $brush, $x + 16, $y + 7)
  $font.Dispose()
  $brush.Dispose()
  $pen.Dispose()
}

$receiptPalette = @{
  Header = [System.Drawing.Color]::FromArgb(27, 95, 74)
  HeaderText = [System.Drawing.Color]::FromArgb(248, 250, 242)
  Subtle = [System.Drawing.Color]::FromArgb(207, 229, 221)
  Text = [System.Drawing.Color]::FromArgb(26, 31, 38)
  Muted = [System.Drawing.Color]::FromArgb(83, 98, 111)
  Rule = [System.Drawing.Color]::FromArgb(209, 217, 224)
  Accent = [System.Drawing.Color]::FromArgb(39, 146, 109)
}

$invoicePalette = @{
  Header = [System.Drawing.Color]::FromArgb(104, 49, 30)
  HeaderText = [System.Drawing.Color]::FromArgb(253, 247, 240)
  Subtle = [System.Drawing.Color]::FromArgb(240, 218, 203)
  Text = [System.Drawing.Color]::FromArgb(34, 28, 24)
  Muted = [System.Drawing.Color]::FromArgb(105, 88, 76)
  Rule = [System.Drawing.Color]::FromArgb(224, 208, 197)
  Accent = [System.Drawing.Color]::FromArgb(168, 89, 41)
}

$bankPalette = @{
  Header = [System.Drawing.Color]::FromArgb(30, 45, 97)
  HeaderText = [System.Drawing.Color]::FromArgb(249, 250, 255)
  Subtle = [System.Drawing.Color]::FromArgb(212, 220, 243)
  Text = [System.Drawing.Color]::FromArgb(28, 34, 48)
  Muted = [System.Drawing.Color]::FromArgb(91, 103, 130)
  Rule = [System.Drawing.Color]::FromArgb(212, 218, 232)
  Accent = [System.Drawing.Color]::FromArgb(53, 104, 223)
}

$canvas = New-Canvas 1300 760 ([System.Drawing.Color]::FromArgb(250, 251, 247))
$receiptBitmap = $canvas[0]
$receiptGraphics = $canvas[1]
Draw-Header $receiptGraphics 'GCash Wallet Receipt' 'Sample fixture for OCR end-to-end tests' 1300 $receiptPalette
Draw-Stamp $receiptGraphics 'SUCCESS' $receiptPalette 1080 34
Draw-BodyLines $receiptGraphics @(
  '# Transaction Summary',
  '__divider__',
  'Reference No: 700123456789',
  'Sent to: Maria Cruz',
  'Amount: PHP 1250.00',
  'Date: April 14, 2026 9:21 PM',
  'Status: Completed'
) $receiptPalette 150
Save-Canvas $receiptBitmap $receiptGraphics (Join-Path $outputDir 'mobile-receipt.png')

$canvas = New-Canvas 1300 760 ([System.Drawing.Color]::FromArgb(253, 248, 243))
$invoiceBitmap = $canvas[0]
$invoiceGraphics = $canvas[1]
Draw-Header $invoiceGraphics 'Invoice Snapshot' 'Structured fixture used by docs and OCR tests' 1300 $invoicePalette
Draw-Stamp $invoiceGraphics 'DUE SOON' $invoicePalette 1065 34
Draw-BodyLines $invoiceGraphics @(
  '# Invoice Details',
  '__divider__',
  'Invoice No: INV-2201',
  'Vendor: Northwind Studio',
  'Billed To: Acme Corp',
  'Grand Total: USD 199.00',
  'Due Date: April 30, 2026'
) $invoicePalette 150
Save-Canvas $invoiceBitmap $invoiceGraphics (Join-Path $outputDir 'invoice.png')

$canvas = New-Canvas 1300 800 ([System.Drawing.Color]::FromArgb(247, 249, 255))
$bankBitmap = $canvas[0]
$bankGraphics = $canvas[1]
Draw-Header $bankGraphics 'BDO Online Banking' 'Bank transfer fixture with clean OCR-friendly typography' 1300 $bankPalette
Draw-Stamp $bankGraphics 'POSTED' $bankPalette 1088 34
Draw-BodyLines $bankGraphics @(
  '# Transfer Details',
  '__divider__',
  'Transaction Reference: ABC-12345',
  'Sender: John Doe',
  'Receiver: Jane Santos',
  'Account Number: 1234-5678-90',
  'Amount: PHP 2500.75',
  'Transaction Date: April 14, 2026 09:30 AM'
) $bankPalette 150
Save-Canvas $bankBitmap $bankGraphics (Join-Path $outputDir 'bank-receipt.png')

Write-Host "Generated fixtures in $outputDir"
