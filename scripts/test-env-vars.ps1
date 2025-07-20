# Test script to check if Claude Code environment variables are available
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"

Write-Host "=== Claude Code Environment Variable Test ==="
Write-Host "Timestamp: $timestamp"
Write-Host "CLAUDE_TOOL_NAME: '$env:CLAUDE_TOOL_NAME'"
Write-Host "CLAUDE_FILE_PATHS: '$env:CLAUDE_FILE_PATHS'"

# List all CLAUDE_* environment variables
Write-Host "All CLAUDE environment variables:"
Get-ChildItem env: | Where-Object Name -like "CLAUDE*" | ForEach-Object {
    Write-Host "  $($_.Name) = $($_.Value)"
}

# Send test webhook
$body = @{
    tool = if ($env:CLAUDE_TOOL_NAME) { $env:CLAUDE_TOOL_NAME } else { "PowerShell-Test" }
    file = if ($env:CLAUDE_FILE_PATHS) { $env:CLAUDE_FILE_PATHS } else { "No-File-Path-Available" }
    timestamp = $timestamp
    debug = "PowerShell environment test"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:3000/api/hook-log" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Webhook sent successfully"
} catch {
    Write-Host "Webhook failed: $($_.Exception.Message)"
}