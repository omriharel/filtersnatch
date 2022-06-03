package main

import (
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
)

// maybe use this to allows preferences reset.. idk
func clearConfigDir() {
	configPath, err := xdg.ConfigFile(configDirAndName)
	if err != nil {
		return
	}

	os.RemoveAll(filepath.Dir(configPath))
}

func lowerFileNamesEqual(a, b string) bool {
	return strings.EqualFold(a, b)
}

func dirExists(path string) bool {
	pathInfo, err := os.Stat(path)
	if err == nil && pathInfo.IsDir() {
		return true
	}

	return false
}

func copyFileContents(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, in)
	if err != nil {
		return err
	}
	return out.Close()
}
