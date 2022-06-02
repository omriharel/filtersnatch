package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/djherbis/times"
	"github.com/getlantern/systray"
	"github.com/spf13/viper"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx    context.Context
	config *viper.Viper
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	go func() {
		systray.Run(func() { onTrayReady(a) }, func() { onTrayQuit(a) })
	}()

	var err error
	a.config, err = NewConfig(a.ctx)
	if err != nil {
		runtime.LogErrorf(a.ctx, "Failed to load config: %w", err)
	}
}

// domReady is called when the DOM is ready
func (a *App) domReady(ctx context.Context) {
	if !a.config.GetBool(configKeyWindowStartInTray) {
		runtime.WindowShow(ctx)
	}
}

// ChooseDirFromConfigAndUpdateConfig allows the user to choose a directory for a given purpose.
// The default directory is attempted to be read from the config using the given config key.
// If the user successfully chooses a directory, the config key is updated with the new directory.
// Returns the path of the chosen directory, or the empty string if one wasn't chosen
func (a *App) ChooseDirFromConfigAndUpdateConfig(configKey string, title string) string {
	options := runtime.OpenDialogOptions{
		Title:                title,
		CanCreateDirectories: false,
	}
	defaultDirectory := a.config.GetString(configKey)
	expandedDefaultDirectory := os.ExpandEnv(a.config.GetString(configKey))
	runtime.LogDebugf(a.ctx, "Expanded %s into %s (key: %s)", defaultDirectory, expandedDefaultDirectory, configKey)

	if dirExists(expandedDefaultDirectory) {
		options.DefaultDirectory = expandedDefaultDirectory
	}

	chosenPath, err := runtime.OpenDirectoryDialog(a.ctx, options)
	if err != nil || chosenPath == "" {
		runtime.LogErrorf(a.ctx, "Failed to choose directory: %w", err)
		return ""
	} else {
		runtime.LogDebugf(a.ctx, "Chosen new path %s for key '%s', updating config", chosenPath, configKey)
		a.config.Set(configKey, chosenPath)
		if err = a.config.WriteConfig(); err != nil {
			runtime.LogErrorf(a.ctx, "Failed to update config key '%s': %w", configKey, err)
		}
	}

	return chosenPath
}

func (a *App) ChooseFiltersDir() string {
	return a.ChooseDirFromConfigAndUpdateConfig(configKeyFiltersDirectory, "Choose Path of Exile filter directory")
}

func (a *App) ChooseDownloadsDir() string {
	return a.ChooseDirFromConfigAndUpdateConfig(configKeyDownloadsDirectory, "Choose downloads directory to watch")
}

type FileListEntry struct {
	Name        string `json:"name"`
	CreatedTime string `json:"created_time"`
}

func (a *App) ListFiltersInDir(dir string) ([]FileListEntry, error) {
	if !dirExists(dir) {
		return nil, fmt.Errorf("directory %s does not exist", dir)
	}

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	filterFiles := make([]FileListEntry, 0)
	for _, file := range files {
		if file.IsDir() {
			continue
		}

		if strings.ToLower(filepath.Ext(file.Name())) == ".filter" {
			fileTimes := times.Get(file)
			createdTime := fileTimes.ModTime()
			if fileTimes.HasBirthTime() && createdTime.Before(fileTimes.BirthTime()) {
				createdTime = fileTimes.BirthTime()
			}

			filterFiles = append(filterFiles, FileListEntry{
				Name:        file.Name(),
				CreatedTime: createdTime.Format(time.RFC3339),
			})
		}
	}

	runtime.LogDebugf(a.ctx, "Found %d filter files in %s", len(filterFiles), dir)
	return filterFiles, nil
}
