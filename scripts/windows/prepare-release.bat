@ECHO OFF

IF "%1"=="" GOTO NOTAG

ECHO Preparing release (%1)...
ECHO.

git tag --delete %1 >NUL 2>&1
git tag %1

REM set windows scripts dir root in relation to script path to avoid cwd dependency
SET "WIN_SCRIPTS_ROOT=%~dp0"

CALL "%WIN_SCRIPTS_ROOT%build.bat"

REM make this next part nicer by setting the repo root
SET "FILTERSNATCH_ROOT=%WIN_SCRIPTS_ROOT%..\.."
PUSHD "%FILTERSNATCH_ROOT%"
SET "FILTERSNATCH_ROOT=%CD%"
POPD

MKDIR "%FILTERSNATCH_ROOT%\releases\%1" 2> NUL
MOVE /Y "%FILTERSNATCH_ROOT%\filtersnatch.exe" "%FILTERSNATCH_ROOT%\releases\%1\filtersnatch.exe" >NUL 2>&1
COPY /Y "%FILTERSNATCH_ROOT%\scripts\misc\release-notes.txt" "%FILTERSNATCH_ROOT%\releases\%1\notes.txt" >NUL 2>&1

ECHO.
ECHO Release binary created in %FILTERSNATCH_ROOT%\releases\%1
ECHO Opening release directory and notes for editing.
ECHO When you're done, run "git push origin %1" and draft the release on GitHub.

START explorer.exe "%FILTERSNATCH_ROOT%\releases\%1"
START notepad.exe "%FILTERSNATCH_ROOT%\releases\%1\notes.txt"

GOTO DONE

:NOTAG
ECHO usage: %0 ^<tag name^>    (use semver i.e. v0.9.3)
GOTO DONE

:DONE
