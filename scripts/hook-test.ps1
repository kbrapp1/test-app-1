# Legacy hook-test.ps1 - Redirects to claude-hook-wrapper.ps1
# This exists to handle old configurations that still reference it

param($file_path)

# Redirect to the new simplified script
& "scripts/claude-hook-wrapper.ps1"