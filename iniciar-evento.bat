@echo off
rem Abre el panel y la pantalla del juego con sonido automatico (sin clic para activar el audio).
rem Usa un perfil propio del navegador: la primera vez importa el respaldo JSON en el panel.
set URL=https://sephiroth613.github.io/cien-retro-gamers
set PERFIL=%LOCALAPPDATA%\CienRetroGamers
set FLAGS=--user-data-dir="%PERFIL%" --autoplay-policy=no-user-gesture-required --no-first-run

set NAV=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe
if not exist "%NAV%" set NAV=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe
if not exist "%NAV%" set NAV=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if not exist "%NAV%" set NAV=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
if not exist "%NAV%" (
  echo No se encontro Edge ni Chrome.
  pause
  exit /b 1
)

start "" "%NAV%" %FLAGS% "%URL%/config.html"
timeout /t 2 /nobreak >nul
start "" "%NAV%" %FLAGS% --app="%URL%/index.html"
