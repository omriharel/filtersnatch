@ECHO OFF

ECHO Building filtersnatch (release)...

REM shove git commit, version tag into env
for /f "delims=" %%a in ('git rev-list -1 --abbrev-commit HEAD') do @set GIT_COMMIT=%%a
for /f "delims=" %%a in ('git describe --tags --always') do @set VERSION_TAG=%%a
set BUILD_TYPE=release
ECHO Embedding build-time parameters:
ECHO - gitCommit %GIT_COMMIT%
ECHO - versionTag %VERSION_TAG%
ECHO - buildType %BUILD_TYPE%

wails build -o "..\..\filtersnatch.exe" -ldflags "-X main.gitCommit=%GIT_COMMIT% -X main.versionTag=%VERSION_TAG% -X main.buildType=%BUILD_TYPE%"
IF %ERRORLEVEL% NEQ 0 GOTO BUILDERROR
ECHO Done.
GOTO DONE

:BUILDERROR
ECHO Failed to build filtersnatch in release mode! See above output for details.
EXIT /B 1

:DONE
