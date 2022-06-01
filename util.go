package main

import (
	"os"
	"path/filepath"

	"github.com/adrg/xdg"
)

func clearConfigDir() {
	configPath, err := xdg.ConfigFile(configDirAndName)
	if err != nil {
		return
	}

	os.RemoveAll(filepath.Dir(configPath))
}

func dirExists(path string) bool {
	pathInfo, err := os.Stat(path)
	if err == nil && pathInfo.IsDir() {
		return true
	}

	return false
}
