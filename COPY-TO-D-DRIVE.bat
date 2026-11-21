@echo off
setlocal
title Copy TER Documentation Portal to D: drive

set "SOURCE=%~dp0"
set "DEST=D:\ter-documentation-portal"

echo ==========================================================
echo  TER Documentation Portal - copy to D: drive
echo ==========================================================
echo.
echo Source : %SOURCE%
echo Target : %DEST%
echo.

if not exist "D:\" (
  echo ERROR: Drive D: was not found on this computer.
  echo.
  pause
  exit /b 1
)

echo Copying files (node_modules is skipped - run npm install after copying)...
echo.

robocopy "%SOURCE%." "%DEST%" /E /XD node_modules .git dist /NFL /NDL /NJH /NJS

if %ERRORLEVEL% LSS 8 (
  echo.
  echo Copy completed successfully.
  echo Location: %DEST%
  echo.
  echo Next steps:
  echo   1. Open a terminal in %DEST%
  echo   2. Run: npm install
  echo   3. Run: npm run dev
  echo.
  echo If the copy failed, close this window and run the file again
  echo by right clicking it and choosing "Run as administrator".
) else (
  echo.
  echo Copy FAILED with robocopy exit code %ERRORLEVEL%.
  echo Try again by right clicking this file and choosing "Run as administrator".
)

echo.
pause
endlocal
