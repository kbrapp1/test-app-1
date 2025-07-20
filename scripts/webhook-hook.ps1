param(
    [string]$ToolName,
    [string]$FilePath
)

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
$body = @{
    tool = $ToolName
    file = $FilePath
    timestamp = $timestamp
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/hook-log" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Webhook sent successfully for $ToolName on $FilePath"
} catch {
    Write-Host "Webhook failed: $($_.Exception.Message)"
}