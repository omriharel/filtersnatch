package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed frontend/dist
var assets embed.FS

func main() {

	// Create an instance of the app structure
	app := NewApp()

	// for now
	// clearConfigDir()

	// Create application with options
	err := wails.Run(&options.App{
		Title:             "filtersnatch",
		Width:             1024,
		Height:            872,
		Assets:            assets,
		OnStartup:         app.startup,
		OnDomReady:        app.domReady,
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
