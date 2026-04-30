# Create NightShift app icons using PowerShell
Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot "electron\assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

# Create 256x256 icon
$size = 256
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Background
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, 26, 46))
$g.FillEllipse($bgBrush, 16, 16, $size - 32, $size - 32)

# Moon (red circle)
$moonBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(233, 69, 96))
$moonR = $size / 5
$cx = $size / 2
$cy = $size / 2
$g.FillEllipse($moonBrush, $cx - $moonR, $cy - $moonR, $moonR * 2, $moonR * 2)

# Stars
$starBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 245, 245))
$starR = $size / 32
$stars = @(
    @($size/4, $size/4),
    @(3*$size/4, $size/3),
    @($size/3, 3*$size/4),
    @(2*$size/3, $size/5)
)
foreach ($star in $stars) {
    $g.FillEllipse($starBrush, $star[0] - $starR, $star[1] - $starR, $starR * 2, $starR * 2)
}

# Save as PNG
$pngPath = Join-Path $assetsDir "icon.png"
$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Created: $pngPath"

# Save as ICO (multi-size)
$icoPath = Join-Path $assetsDir "icon.ico"
$sizes = @(16, 32, 48, 64, 128, 256)
$iconSizes = @()

foreach ($s in $sizes) {
    $smallBmp = New-Object System.Drawing.Bitmap($s, $s)
    $sg = [System.Drawing.Graphics]::FromImage($smallBmp)
    $sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    $margin = [Math]::Max(1, $s / 16)
    $sg.FillEllipse($bgBrush, $margin, $margin, $s - 2*$margin, $s - 2*$margin)
    
    $mr = $s / 5
    $scx = $s / 2
    $scy = $s / 2
    $sg.FillEllipse($moonBrush, $scx - $mr, $scy - $mr, $mr * 2, $mr * 2)
    
    $sr = [Math]::Max(1, $s / 32)
    $starPositions = @(
        @($s/4, $s/4),
        @(3*$s/4, $s/3),
        @($s/3, 3*$s/4),
        @(2*$s/3, $s/5)
    )
    foreach ($sp in $starPositions) {
        $sg.FillEllipse($starBrush, $sp[0] - $sr, $sp[1] - $sr, $sr * 2, $sr * 2)
    }
    
    $iconSizes += $smallBmp
    $sg.Dispose()
}

# Save ICO using first size (256x256 is the main one)
$bmp.Save($icoPath, [System.Drawing.Imaging.ImageFormat]::Icon)
Write-Host "Created: $icoPath"

# Cleanup
$g.Dispose()
$bmp.Dispose()
$bgBrush.Dispose()
$moonBrush.Dispose()
$starBrush.Dispose()
foreach ($icon in $iconSizes) {
    $icon.Dispose()
}

Write-Host "All icons generated successfully!"
