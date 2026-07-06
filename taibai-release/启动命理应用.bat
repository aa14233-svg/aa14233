@echo off
title 太白炁渊 · 命理全栈
chcp 65001 >nul

echo ╔═══════════════════════════════════════════════╗
echo ║    太白炁渊 · 命理全栈桌面应用                 ║
echo ╚═══════════════════════════════════════════════╝
echo.

:: ── 检查依赖 ──
echo [检查] 运行环境...
where node >nul 2>nul
if errorlevel 1 (
    echo [ERR] Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

:: ── 检查 LM Studio ──
echo [检查] LM Studio...
curl -s http://127.0.0.1:1234/v1/models >nul 2>nul
if errorlevel 1 (
    echo [WRNG] LM Studio 未响应，请确认已启动并加载模型
    echo     API: http://127.0.0.1:1234/v1
    echo.
) else (
    echo [OK] LM Studio 已连接
)

:: ── 检查 Obsidian 库 ──
if exist "E:\obsidian\taibai-命理全栈\提示词注入\对话注入.md" (
    echo [OK] Obsidian 命理库已加载
) else (
    echo [INFO] Obsidian 库未找到（使用内置默认 Prompt）
)

:: ── 检查引擎 ──
if exist "%~dp0taibai_engine.exe" (
    echo [OK] 引擎就绪
) else (
    echo [ERR] 引擎文件缺失: taibai_engine.exe
    pause
    exit /b 1
)

:: ── 启动服务 ──
echo.
echo [启动] 太白炁渊服务...

start /b "" cmd /c "cd /d "%~dp0" && node server.js > server.log 2>&1"

:: ── 等待就绪 ──
set WAIT_COUNT=0
:WAIT_LOOP
>nul 2>nul (
    curl -s http://127.0.0.1:3456/api/ping
) && (
    goto SERVICE_UP
)
set /a WAIT_COUNT+=1
if %WAIT_COUNT% gtr 20 (
    echo [ERR] 服务启动超时，请查看 server.log
    pause
    exit /b 1
)
ping -n 2 127.0.0.1 >nul
goto WAIT_LOOP

:SERVICE_UP
echo [OK] 太白炁渊服务已启动 → http://127.0.0.1:3456
echo.
echo ┌──────────────────────────────────────────────┐
echo │ 打开浏览器访问 http://127.0.0.1:3456          │
echo │ 或在 Obsidian 中查看 E:\obsidian\taibai-命理全栈 │
echo └──────────────────────────────────────────────┘
echo.
echo 按任意键停止服务...
pause >nul

:: ── 清理 ──
taskkill /f /im node.exe >nul 2>nul
echo 服务已停止
