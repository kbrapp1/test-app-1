# Claude Code Hook Wrapper
# This script captures hook context and calls hook-test.ps1 with proper file path

param()

# Get all environment variables for debugging
$allEnvVars = Get-ChildItem env: | Where-Object Name -like "*CLAUDE*" | ForEach-Object { "$($_.Name)=$($_.Value)" }

# Try to get file path from various sources
$filePath = "unknown"
$toolName = "unknown"

# Check for Claude environment variables
if ($env:CLAUDE_FILE_PATHS) {
    $filePath = $env:CLAUDE_FILE_PATHS
}

if ($env:CLAUDE_TOOL_NAME) {
    $toolName = $env:CLAUDE_TOOL_NAME
}

# If still unknown, try to extract from command line arguments or context
if ($filePath -eq "unknown") {
    # Look for file paths in the current working directory's recent file changes
    $recentFiles = Get-ChildItem -Path . -Recurse -File | 
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddSeconds(-10) } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($recentFiles) {
        $filePath = $recentFiles.FullName
    }
}

# Debug information
$debugInfo = @{
    wrapper_script = "claude-hook-wrapper.ps1"
    detected_file_path = $filePath
    detected_tool_name = $toolName
    all_claude_env_vars = $allEnvVars
    recent_file_detection = $filePath -ne "unknown" -and $filePath -ne $env:CLAUDE_FILE_PATHS
    command_line = [Environment]::CommandLine
    working_directory = (Get-Location).Path
    timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
}

# Log debug info to file for troubleshooting
$debugInfo | ConvertTo-Json -Depth 3 | Out-File -FilePath "claude-hook-debug.json" -Encoding UTF8

# Call the original hook-test.ps1 with the detected file path
if (Test-Path "scripts/hook-test.ps1") {
    & "scripts/hook-test.ps1" -file_path $filePath
} else {
    Write-Host "Error: hook-test.ps1 not found" -ForegroundColor Red
}