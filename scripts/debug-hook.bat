@echo off
echo Debug Hook Started > debug-output.txt
echo CLAUDE_TOOL_NAME=%CLAUDE_TOOL_NAME% >> debug-output.txt
echo CLAUDE_FILE_PATHS=%CLAUDE_FILE_PATHS% >> debug-output.txt
set >> debug-output.txt
curl -X POST http://localhost:3000/api/hook-log -H "Content-Type: application/json" -d "{\"tool\":\"%CLAUDE_TOOL_NAME%\",\"file\":\"%CLAUDE_FILE_PATHS%\",\"timestamp\":\"%date% %time%\"}"