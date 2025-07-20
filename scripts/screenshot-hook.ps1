param(
    [Parameter(Mandatory=$true)]
    [string]$Note
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Parse monitor number from note (expect "1", "2", or "3")
$monitorNumber = $null
if ($Note -match '^(\d+)$') {
    $monitorNumber = [int]$matches[1]
} else {
    Write-Host "Error: Note must be a monitor number (1, 2, or 3)"
    exit 1
}

# Get all screens and sort by X position (left to right)
$screens = [System.Windows.Forms.Screen]::AllScreens | Sort-Object { $_.Bounds.X }

if ($monitorNumber -lt 1 -or $monitorNumber -gt $screens.Length) {
    Write-Host "Error: Invalid monitor number. Available monitors: 1-$($screens.Length)"
    exit 1
}

# Get the specified monitor (convert to 0-based index, now sorted left to right)
$targetScreen = $screens[$monitorNumber - 1]
$bounds = $targetScreen.Bounds

Write-Host "Capturing Monitor $monitorNumber ($($bounds.Width)x$($bounds.Height))"

# Create bitmap
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)

# Create screenshots directory if it doesn't exist
$screenshotsDir = "screenshots"
if (-not (Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir | Out-Null
}

# Save as PNG with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$filename = "$screenshotsDir\monitor-$monitorNumber-$timestamp.png"
$bitmap.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)

# Clean up
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Screenshot saved: $filename"