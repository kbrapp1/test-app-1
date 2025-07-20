param($file_path)

# Capture detailed debug information about how this script is being called
$debugInfo = @{
    all_parameters = $PSBoundParameters
    all_args = $args
    script_path = $MyInvocation.MyCommand.Path
    script_name = $MyInvocation.MyCommand.Name
    invocation_line = $MyInvocation.Line
    command_line = [Environment]::CommandLine
    parent_process_id = (Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId
    parent_process = if ((Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId) { 
        (Get-Process -Id (Get-WmiObject Win32_Process -Filter ProcessId=$PID).ParentProcessId -ErrorAction SilentlyContinue).ProcessName 
    } else { "Unknown" }
    current_directory = Get-Location
    all_env_vars = Get-ChildItem env: | Where-Object Name -like "*CLAUDE*" | ForEach-Object { "$($_.Name)=$($_.Value)" }
}

# Get the actual file path - use the parameter if provided, otherwise check environment variables
$actualFilePath = if ($file_path -and $file_path -ne '$file_path') { 
    # We have a real file path (not the literal text '$file_path')
    $file_path 
} elseif ($env:CLAUDE_FILE_PATHS) { 
    # Try environment variable
    $env:CLAUDE_FILE_PATHS 
} else { 
    # Neither worked, try to detect recently modified files
    $recentFiles = Get-ChildItem -Path . -Recurse -File | 
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddSeconds(-15) } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    
    if ($recentFiles) {
        $recentFiles.FullName
    } else {
        "No file path detected (received: $file_path)"
    }
}

# Get tool name from environment or default
$toolName = if ($env:CLAUDE_TOOL_NAME) { 
    $env:CLAUDE_TOOL_NAME 
} else { 
    "Unknown Tool" 
}

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
$logMessage = "$timestamp - Hook triggered: $toolName on $actualFilePath"

# Write to console
Write-Host $logMessage -ForegroundColor Green

# Also append to a log file
Add-Content -Path "D:\Projects\test-app-1\hook-log.txt" -Value $logMessage

# Try to send to API with proper data and debugging info
try {
    $body = @{
        tool = $toolName
        file = $actualFilePath
        timestamp = $timestamp
        status = "success" 
        message = "Claude Code Hook Executed Successfully"
        details = "File operation detected and logged"
        debug_info = $debugInfo
        environment_vars = @{
            CLAUDE_TOOL_NAME = $env:CLAUDE_TOOL_NAME
            CLAUDE_FILE_PATHS = $env:CLAUDE_FILE_PATHS
            parameter_file_path = $file_path
        }
    } | ConvertTo-Json -Depth 3
    
    Invoke-RestMethod -Uri "http://localhost:3000/api/hook-log" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Webhook sent successfully: $toolName -> $actualFilePath" -ForegroundColor Cyan
} catch {
    Write-Host "API call failed: $_" -ForegroundColor Red
    # Fallback logging to file
    Add-Content -Path "D:\Projects\test-app-1\hook-log.txt" -Value "API ERROR: $_"
}