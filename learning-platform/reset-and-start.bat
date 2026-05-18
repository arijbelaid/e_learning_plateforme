@echo off
echo ============================================================
echo   LearnCloud Platform - Reset et Demarrage
echo   Ce script supprime les volumes corrompus et relance tout
echo ============================================================
echo.

echo [1/3] Arret et suppression des conteneurs + volumes...
docker compose down -v --remove-orphans
if %ERRORLEVEL% NEQ 0 (
    echo AVERTISSEMENT: Erreur lors de l'arret (peut etre ignoree si rien ne tourne)
)

echo.
echo [2/3] Construction et demarrage de tous les services...
docker compose up --build

echo.
echo [3/3] Termine!
echo Ouvrez http://localhost dans votre navigateur
pause
