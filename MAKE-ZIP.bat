@echo off
title Create ter-documentation-portal.zip

echo ==========================================================
echo  TER Documentation Portal - create the project ZIP
echo ==========================================================
echo.
echo Building ter-documentation-portal.zip from this folder.
echo (node_modules, dist and any existing ZIP are skipped.)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0make-zip.ps1"

echo.
pause
