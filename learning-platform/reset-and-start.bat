@echo off
echo ============================================================
echo   LearnCloud Platform - Reset COMPLET et Redemarrage
echo   Supprime volumes + force rebuild sans cache
echo ============================================================
echo.

echo [1/4] Arret et suppression de TOUS les conteneurs + volumes...
docker compose down -v --remove-orphans
if %ERRORLEVEL% NEQ 0 (
    echo AVERTISSEMENT: Erreur lors de l'arret (normal si rien ne tourne)
)

echo.
echo [2/4] Suppression du cache Docker pour le frontend...
docker rmi learning-platform-learning-frontend 2>nul
docker rmi learning-platform-user-service 2>nul
docker rmi learning-platform-nginx-gateway 2>nul
docker rmi learning-platform-course-service 2>nul
docker rmi learning-platform-analytics-service 2>nul
docker rmi learning-platform-ai-tutor-service 2>nul

echo.
echo [3/4] Construction et demarrage (sans cache)...
docker compose build --no-cache
docker compose up

echo.
echo [4/4] Termine!
echo Ouvrez http://localhost dans votre navigateur
echo Attendez 2-3 minutes que tous les services demarrent
pause
