@echo off
REM free-token 启动脚本 (Windows)
REM 自动启动 OpenCode 服务器和 free-token

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM 加载环境变量
if exist .env (
    for /f "usebackq tokens=*" %%a in (.env) do (
        set "%%a" 2>nul
    )
)

REM 设置默认值
if not defined OPENCODE_PORT set OPENCODE_PORT=4096
if not defined PORT set PORT=3000

echo === free-token 启动脚本 ===
echo OpenCode 端口: %OPENCODE_PORT%
echo free-token 端口: %PORT%

REM 检查 OpenCode 是否已运行
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :%OPENCODE_PORT% ^| findstr LISTENING') do (
    echo OpenCode 服务器已在运行 (PID: %%a)
    goto :check_freetoken
)

echo 启动 OpenCode 服务器...
REM 检查是否有密码，没有密码则使用随机密码
if not defined OPENCODE_SERVER_PASSWORD (
    echo 生成随机密码用于本地开发...
    set OPENCODE_SERVER_PASSWORD=dev-%random%%random%
    echo 密码: !OPENCODE_SERVER_PASSWORD!
)

start /B "OpenCode Server" cmd /c "opencode serve --port %OPENCODE_PORT% --hostname 127.0.0.1 >> logs\opencode.log 2>&1"
set OPENCODE_PID=!random!

REM 等待 OpenCode 服务器就绪
echo 等待 OpenCode 服务器就绪...
for /l %%i in (1,1,10) do (
    curl -s -u "opencode:!OPENCODE_SERVER_PASSWORD!" "http://127.0.0.1:%OPENCODE_PORT%/global/health" >nul 2>&1 && (
        echo OpenCode 服务器已就绪
        goto :check_freetoken
    )
    timeout /t 1 >nul
)

:check_freetoken
REM 检查是否已在运行
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING ^| findstr node') do (
    echo free-token 已在运行 (PID: %%a)
    exit /b 0
)

echo 启动 free-token...

REM 编译（如果需要）
if "%1"=="--build" (
    echo 编译项目...
    call npm run build
)

REM 启动服务
start /B "free-token" node dist\index.js >> logs\free-token.log 2>&1

echo free-token 已启动

REM 等待服务就绪
for /l %%i in (1,1,10) do (
    curl -s "http://localhost:%PORT%/health" >nul 2>&1 && (
        echo ^> free-token 服务已就绪 (http://localhost:%PORT%)
        echo ^> 可用模型列表: http://localhost:%PORT%/v1/models
        echo.
        echo API 端点:
        echo   - Chat Completions: POST http://localhost:%PORT%/v1/chat/completions
        echo   - List Models: GET http://localhost:%PORT%/v1/models
        exit /b 0
    )
    timeout /t 1 >nul
)

echo 警告: 服务可能未完全就绪，请检查 logs\free-token.log
endlocal
