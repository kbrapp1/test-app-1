---
description: Take a screenshot of a specific monitor and save to project screenshots folder
allowed_tools: [Bash]
---

# Screenshot Command

Take a screenshot of the specified monitor and save it to the project's screenshots folder.

Usage: `/screenshot <monitor_number>`
- Monitor 1: Left monitor
- Monitor 2: Primary/center monitor  
- Monitor 3: Right monitor

Please run powershell in bash to execute
!powershell.exe -ExecutionPolicy Bypass -File "D:\Projects\test-app-1\scripts\screenshot-hook.ps1" -Note "$ARGUMENTS"

The screenshot will be saved with a timestamp in the format:
`screenshots/monitor-{N}-{timestamp}.png`