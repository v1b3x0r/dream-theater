@echo off
echo 🌌 INITIALIZING DREAM OS MULTIVERSE...
echo ---------------------------------------
start "DreamOS Backend" cmd /k "run-backend.bat"
start "DreamOS Frontend" cmd /k "run-frontend.bat"
echo 🛰️ Systems are launching in separate windows.
echo ---------------------------------------
echo Done.
timeout /t 5
