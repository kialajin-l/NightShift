@echo off
chcp 65001 >nul

echo ========================================
echo   NightShift - AI原生编辑器
echo   Version 0.1.0
echo ========================================
echo.

REM 检查端口占用情况
echo 检查端口状态...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo 端口 3000 已被占用，使用端口 3001
    set PORT=3001
) else (
    echo 端口 3000 可用
    set PORT=3000
)

echo.
echo 启动服务器...
echo 访问地址: http://localhost:%PORT%
echo.

REM 启动服务器并保持窗口打开
node server.js -p %PORT%

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo 启动失败！
    echo 可能的原因：
    echo 1. 端口被占用
    echo 2. Node.js 版本不兼容
    echo 3. 依赖包缺失
    echo ========================================
)

pause