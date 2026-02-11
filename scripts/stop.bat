@echo off
REM free-token 停止脚本 (Windows)
REM 停止 free-token 和 OpenCode 服务器

setlocal

if not defined OPENCODE_PORT set OPENCODE_PORT=4096
if not defined PORT set PORT=3000

echo === free-token 停止脚本 ===

REM 停止 free-token
echo 查找 free-token 进程...
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING ^| findstr node') do (
    echo 停止 free-token (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    echo ^> free-token 已停止
    goto :stop_opencode
)

echo free-token 未运行

:stop_opencode
REM 停止 OpenCode 服务器
echo 查找 OpenCode 服务器进程...
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :%OPENCODE_PORT% ^| findstr LISTENING') do (
    echo 停止 OpenCode 服务器 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    echo ^> OpenCode 服务器已停止
    goto :cleanup
)

echo OpenCode 服务器未运行

:cleanup
REM 清理可能的残留进程
echo 清理残留进程...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 所有服务已停止
endlocal
