@echo off
REM FreeClaw 停止脚本 (Windows)
REM 停止 FreeClaw 和 OpenCode 服务器

setlocal

if not defined OPENCODE_PORT set OPENCODE_PORT=4096
if not defined PORT set PORT=3000

echo === FreeClaw 停止脚本 ===

REM 停止 FreeClaw
echo 查找 FreeClaw 进程...
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING ^| findstr node') do (
    echo 停止 FreeClaw (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
    echo ^> FreeClaw 已停止
    goto :stop_opencode
)

echo FreeClaw 未运行

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
