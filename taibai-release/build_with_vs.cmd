@echo off
setlocal
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvarsall.bat" x64 >nul
set CARGO_BUILD_JOBS=4
set CARGO_BUILD_RUSTC_WRAPPER=
set RUSTC_WRAPPER=
cd /d "%~dp0"
echo [BUILD] Starting cargo build...
cargo build 2>&1
if %errorlevel% equ 0 (
    if exist "target\debug\taibai-server.exe" (
        for %%I in ("target\debug\taibai-server.exe") do echo [OK] Build success! Size: %%~zI bytes
        if not exist "E:\trae work\taibai-release" mkdir "E:\trae work\taibai-release"
        copy /y "target\debug\taibai-server.exe" "E:\trae work\taibai-release\taibai.exe" >nul
        echo [OK] Copied!
    )
) else (
    echo [FAIL] First attempt: %errorlevel%
    echo [TRY] Building only core+engine...
    cargo build -p taibai-core -p taibai-engine 2>&1
)
echo.
echo Press any key...
pause >nul
