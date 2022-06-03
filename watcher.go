package main

import (
	"path/filepath"
	"strings"
	"time"

	"github.com/fsnotify/fsnotify"
	"github.com/pkg/errors"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	internalEmitCooldown      = time.Millisecond * 500
	internalFlushWaitDuration = time.Millisecond * 200

	downloadTimeout = time.Second * 2
)

type Watcher struct {
	watcher *fsnotify.Watcher
	app     *App

	stopChannel chan bool

	filtersDirectory   string
	downloadsDirectory string

	dryRun bool

	perEventLastEmitTime map[string]time.Time
	pendingDownloads     map[string]time.Time
}

func NewWatcher(app *App) (*Watcher, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}

	return &Watcher{
		watcher:              watcher,
		app:                  app,
		dryRun:               false,
		perEventLastEmitTime: make(map[string]time.Time),
		pendingDownloads:     make(map[string]time.Time),
	}, nil
}

func (w *Watcher) Start() {
	w.stopChannel = make(chan bool)

	go func() {
		for {
			select {
			case event, ok := <-w.watcher.Events:
				if !ok {
					return
				}

				if w.shouldHandleEvent(&event) {
					if err := w.handleEvent(&event); err != nil {
						runtime.LogErrorf(w.app.ctx, "Failed to handle file watcher event: %w", err)
					}
				}

			case err, ok := <-w.watcher.Errors:
				if !ok {
					return
				}
				runtime.LogErrorf(w.app.ctx, "Got error from file watcher: %w", err)

			case <-w.stopChannel:
				return
			}
		}
	}()
}

func (w *Watcher) Stop() error {
	runtime.LogInfo(w.app.ctx, "Stopping file watcher")
	w.stopChannel <- true

	if err := w.watcher.Close(); err != nil {
		runtime.LogErrorf(w.app.ctx, "Failed to stop file watcher: %w", err)
		return err
	}

	runtime.LogDebug(w.app.ctx, "Stopped file watcher")
	return nil
}

func (w *Watcher) SetFiltersDirectory(directory string) {
	if w.filtersDirectory == directory {
		runtime.LogDebug(w.app.ctx, "Filters directory unchanged")
		return
	}

	if w.filtersDirectory != "" {
		runtime.LogDebugf(w.app.ctx, "Removing watch on previous filters directory %s", w.filtersDirectory)
		w.watcher.Remove(w.filtersDirectory)
	}

	runtime.LogDebugf(w.app.ctx, "Now watching filters directory %s", directory)
	w.watcher.Add(directory)
	w.filtersDirectory = directory
}

func (w *Watcher) SetDownloadsDirectory(directory string) {
	if w.downloadsDirectory == directory {
		runtime.LogDebug(w.app.ctx, "Downloads directory unchanged")
		return
	}

	if w.downloadsDirectory != "" {
		runtime.LogDebugf(w.app.ctx, "Removing watch on previous downloads directory %s", w.downloadsDirectory)
		w.watcher.Remove(w.downloadsDirectory)
	}

	runtime.LogDebugf(w.app.ctx, "Now watching downloads directory %s", directory)
	w.watcher.Add(directory)
	w.downloadsDirectory = directory
}

func (w *Watcher) shouldHandleEvent(event *fsnotify.Event) bool {
	if w.app.Paused {
		return false
	}

	if w.downloadsDirectory == "" || w.filtersDirectory == "" {
		return false
	}

	if strings.ToLower(filepath.Ext(event.Name)) != ".filter" {
		return false
	}

	return true
}

func (w *Watcher) handleEvent(event *fsnotify.Event) error {
	eventInFiltersDirectory := strings.HasPrefix(event.Name, w.filtersDirectory)
	eventInDownloadsDirectory := strings.HasPrefix(event.Name, w.downloadsDirectory)

	if eventInFiltersDirectory {
		runtime.LogDebugf(w.app.ctx, "File watcher event in filters directory: %s (%s)", filepath.Base(event.Name), event.Op)
		w.emitWatchEventTriggered()
		return nil
	}

	if !eventInDownloadsDirectory {
		return errors.Errorf("Event doesn't seem to be in filters or downloads directory: %s", event)
	}

	now := time.Now()

	// if this is a new file, that means a download has been started - store time and wait for further events
	if event.Op&fsnotify.Create == fsnotify.Create {
		runtime.LogDebugf(w.app.ctx, "Detected new filter download: %s", filepath.Base(event.Name))
		w.pendingDownloads[event.Name] = now
		return nil
	}

	// if this is a modify event, that means a download has been started - store time and wait for further events
	if event.Op&fsnotify.Write == fsnotify.Write {
		downloadStartTime, pendingDownload := w.pendingDownloads[event.Name]
		if !pendingDownload {
			runtime.LogTracef(w.app.ctx, "Modify event for a file we're probably done downloading: %s", filepath.Base(event.Name))
			return nil
		}

		if now.Sub(downloadStartTime) > downloadTimeout {
			runtime.LogDebugf(w.app.ctx, "Modify event after download timeout exceeded, ignoring: %s", filepath.Base(event.Name))
			delete(w.pendingDownloads, event.Name)
			return nil
		}

		runtime.LogDebugf(w.app.ctx, "Download completed: %s (time since start: %s)", filepath.Base(event.Name), now.Sub(downloadStartTime))
		delete(w.pendingDownloads, event.Name)

		w.emitWatchEventTriggered()
		err := w.replaceFilterFileIfNeeded(event.Name)
		if err != nil {
			runtime.LogErrorf(w.app.ctx, "Failed to replace filter file: %s", err)
		}

		// if another non-create, non-modify event happened, we should give the app a chance to know
	} else if event.Op&fsnotify.Remove == fsnotify.Remove ||
		event.Op&fsnotify.Rename == fsnotify.Rename ||
		event.Op&fsnotify.Chmod == fsnotify.Chmod {

		runtime.LogTracef(w.app.ctx, "Other watch-event-trigger-worthy file operation: %s (%s)", filepath.Base(event.Name), event.Op)
		w.emitWatchEventTriggered()
		return nil
	}

	return nil

}

func (w *Watcher) replaceFilterFileIfNeeded(downloadedFile string) error {
	downloadsWatchStrategy, ok := parseWatchStrategy(w.app.config.GetString(configKeyDownloadsWatchStrategy))
	if !ok {
		runtime.LogErrorf(w.app.ctx, "Failed to get downloads watch strategy from config")
		return errors.New("get downloads watch strategy from config")
	}

	filtersTargetFile := w.app.config.GetString(configKeyFiltersSelectedFile)
	if filtersTargetFile == "" {
		runtime.LogDebug(w.app.ctx, "No filter file to replace selected, doing nothing")
		return nil
	}

	downloadedFileName := filepath.Base(downloadedFile)
	downloadsNamedFile := w.app.config.GetString(configKeyDownloadsNamedFile)

	if downloadsWatchStrategy == WatchNamedFile && !lowerFileNamesEqual(downloadedFileName, downloadsNamedFile) {
		runtime.LogDebugf(w.app.ctx, "Downloaded file name doesn't match exact watched file name: %s != %s", downloadedFileName, downloadsNamedFile)
		return nil
	}

	return w.performActualReplacement(downloadedFileName, filtersTargetFile)
}

func (w *Watcher) performActualReplacement(downloadedFile, targetFile string) error {
	runtime.LogInfof(w.app.ctx, "Replacing filter file: %s -> %s", downloadedFile, targetFile)

	if !w.dryRun {
		if err := copyFileContents(filepath.Join(w.downloadsDirectory, downloadedFile), filepath.Join(w.filtersDirectory, targetFile)); err != nil {
			runtime.LogErrorf(w.app.ctx, "Failed to replace filter file: %s", err)
			return err
		}
	} else {
		runtime.LogDebug(w.app.ctx, "Dry run, not actually replacing filter file")
	}

	runtime.LogDebugf(w.app.ctx, "Successfully replaced filter file: %s -> %s", downloadedFile, targetFile)
	w.emitFilterFileReplaced()
	return nil
}

func (w *Watcher) emitWatchEventTriggered() {
	w.emitEvent(eventWatchEventTriggered)
}

func (w *Watcher) emitFilterFileReplaced() {
	w.emitEvent(eventFilterFileReplaced)
}

func (w *Watcher) emitEvent(eventName string) {
	now := time.Now()

	if lastEmitTime, ok := w.perEventLastEmitTime[eventName]; ok && now.Sub(lastEmitTime) < internalEmitCooldown {
		return
	}

	w.perEventLastEmitTime[eventName] = now
	<-time.After(internalFlushWaitDuration)
	runtime.EventsEmit(w.app.ctx, eventName, nil)
}
