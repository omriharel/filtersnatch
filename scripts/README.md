# Building filtersnatch

This page will cover how to build filtersnatch from source for development purposes.

## Prerequisites

- **Go 1.17 (or above) development environment** - importantly (_and regardless of OS_), please only install Go using the instructions on [Go's official website](https://go.dev/doc/install), and _not_ through a package manager.
- **Wails (v2) development prerequisites** - see Wails website for [setup instructions](https://wails.io/docs/gettingstarted/installation)

## Running in development mode

Use the `wails dev` command to run the Wails CLI in development mode. This will set up a watch over both your Go and frontend sources, as well as a live-reload server hosting the frontend (with its own devtools, accessible thru right-click -> Inspect).

> To view trace-level logs, run with `-loglevel trace`.

## Developer scripts

The scripts in this directory will help you build filtersnatch as intended. It's recommended to build filtersnatch only with these scripts.

> **Please note:** All scripts should be run from the root of the repository, i.e. from the _root_ `filtersnatch` directory: `.\scripts\...\whatever.bat`. They're not guaranteed to work correctly if run from another directory.

### Windows

- [`build.bat`](./windows/build.bat): Helper script to build all variants
- [`make-icon.bat`](./windows/make-icon.bat): Converts a .ico file to an icon byte array in a Go file. Used by our systray library. You shouldn't need to run this unless you change the filtersnatch logo (and why would you? The Tailoring Orb meme is so clever!) Anyway, you need to move the icon after that. And also copy it to create a *nix equivalent. Not that I checked any of this on a *nix system, lol
- [`prepare-release.bat`](./windows/prepare-release.bat): Tags, builds and renames the release binaries in preparation for a GitHub release. Usage: `prepare-release.bat vX.Y.Z` (binaries will be under `releases\vX.Y.Z\`)
