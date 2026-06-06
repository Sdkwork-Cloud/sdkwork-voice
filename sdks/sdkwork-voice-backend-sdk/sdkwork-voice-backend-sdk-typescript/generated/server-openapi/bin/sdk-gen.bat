@echo off
echo SDKWork Backend SDK
if "%1"=="" goto help
if "%1"=="build" goto build
goto help

:build
cd /d "%~dp0.."
npm install && npm run build
goto end

:help
echo Usage: sdk-gen.bat build

:end
