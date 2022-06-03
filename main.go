package main

import (
	"embed"
	"fmt"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

// build tags will populate this
var (
	gitCommit  string
	versionTag string
	buildType  string
)

//go:embed frontend/dist
var assets embed.FS

func main() {

	// Create an instance of the app structure
	app := NewApp()

	// If build tags are available, feed them to the app
	if buildType != "" && (versionTag != "" || gitCommit != "") {
		identifier := gitCommit
		if versionTag != "" {
			identifier = versionTag
		}

		versionString := fmt.Sprintf("Version %s-%s", buildType, identifier)
		app.setVersion(versionString)
	}

	// Create application with options
	err := wails.Run(&options.App{
		Title:             "filtersnatch",
		Width:             1024,
		Height:            882,
		Assets:            assets,
		OnStartup:         app.startup,
		OnDomReady:        app.domReady,
		OnShutdown:        app.shutdown,
		DisableResize:     true,
		HideWindowOnClose: true,
		StartHidden:       true,
		Frameless:         true,
		Windows: &windows.Options{
			WindowIsTranslucent:  true,
			WebviewIsTransparent: true,
		},
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err)
	}
}
