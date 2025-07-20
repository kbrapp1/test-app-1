# Claude Code Hook - Simple File Detection
# Detects recently changed files and sends webhook

param()

# Try to get file path from Claude environment variables first
$filePath = if ($env:CLAUDE_FILE_PATHS) { 
    $env:CLAUDE_FILE_PATHS 
} else {
    # Find the most recently modified TypeScript file (within 15 seconds)
    # Exclude build/cache directories
    $recentFiles = Get-ChildItem -Path . -Recurse -File | 
        Where-Object { 
            $_.LastWriteTime -gt (Get-Date).AddSeconds(-15) -and 
            $_.Extension -in @('.ts', '.tsx', '.js', '.jsx') -and
            $_.FullName -notmatch '\\\.next\\' -and
            $_.FullName -notmatch '\\node_modules\\' -and
            $_.FullName -notmatch '\\\.git\\' -and
            $_.FullName -notmatch '\\dist\\' -and
            $_.FullName -notmatch '\\build\\' -and
            $_.FullName -notmatch '\\coverage\\'
        } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    
    if ($recentFiles) {
        # Convert full path to relative path from project root
        $projectRoot = (Get-Location).Path
        $relativePath = $recentFiles.FullName.Replace($projectRoot, "").TrimStart('\')
        $relativePath
    } else {
        "No recent file changes detected"
    }
}

# Send simple webhook with just the file name
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"

try {
    $body = @{
        file = $filePath
        timestamp = $timestamp
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:3000/api/hook-log" -Method POST -Body $body -ContentType "application/json"
} catch {
    # Silently fail - don't spam console with errors
}