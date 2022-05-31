package main

import (
	"embed"

	"github.com/getlantern/systray"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed frontend/dist
var assets embed.FS

func main() {

	// Create an instance of the app structure
	app := NewApp()

	go func() {
		systray.Run(func() { onTrayReady(app) }, func() { onTrayQuit(app) })
	}()

	// Create application with options
	err := wails.Run(&options.App{
		Title:             "instantblade",
		Width:             1024,
		Height:            768,
		Assets:            assets,
		OnStartup:         app.startup,
		DisableResize:     true,
		HideWindowOnClose: true,
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
